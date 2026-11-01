from datetime import datetime, timezone
import bson.errors
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, exceptions

from core.models import User, Team, Task, Comment, Activity
from core.permissions import IsTeamMember
from core.serializers import (
    TaskCreateSerializer,
    TaskUpdateSerializer,
    CommentCreateSerializer,
)
from core.services import (
    serialize_task,
    serialize_comment,
    serialize_activity,
    log_activity,
)
from core.views.team_views import get_team_or_404


STATUS_DISPLAY_MAP = {
    Task.STATUS_PENDING: 'Pending',
    Task.STATUS_IN_PROGRESS: 'In Progress',
    Task.STATUS_DONE: 'Done',
}


def get_task_or_404(task_id: str) -> Task:
    """Safely fetch a Task by string ID or raise 404."""
    try:
        return Task.objects.get(id=task_id)
    except (Task.DoesNotExist, bson.errors.InvalidId, Exception):
        raise exceptions.NotFound('Task not found.')


class TeamTasksView(APIView):
    """
    GET /api/teams/:id/tasks/ - List tasks in team (optional ?status=pending|in_progress|done).
    POST /api/teams/:id/tasks/ - Create a new task in team.
    """
    permission_classes = [IsAuthenticated, IsTeamMember]

    def get(self, request, id):
        team = get_team_or_404(id)
        self.check_object_permissions(request, team)

        status_filter = request.query_params.get('status')
        query = {'team': team}
        if status_filter:
            if status_filter not in Task.STATUS_CHOICES:
                raise exceptions.ValidationError({'status': [f"Invalid status filter '{status_filter}'."]})
            query['status'] = status_filter

        tasks = Task.objects(**query).order_by('-created_at')
        return Response([serialize_task(t) for t in tasks], status=status.HTTP_200_OK)

    def post(self, request, id):
        team = get_team_or_404(id)
        self.check_object_permissions(request, team)

        serializer = TaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        assigned_user = None
        assigned_to_id = data.get('assigned_to')
        if assigned_to_id:
            try:
                assigned_user = User.objects.get(id=assigned_to_id)
            except (User.DoesNotExist, bson.errors.InvalidId, Exception):
                raise exceptions.ValidationError({'assigned_to': ['Assigned user does not exist.']})

            team_member_ids = [str(m.id) for m in team.members]
            if str(assigned_user.id) not in team_member_ids:
                raise exceptions.ValidationError({'assigned_to': ['Assigned user must be a member of the team.']})

        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            assigned_to=assigned_user,
            status=data.get('status', Task.STATUS_PENDING),
            team=team,
            created_by=request.user
        )
        task.save()

        # Log task_created activity
        message = f'{request.user.name} created task "{task.title}"'
        log_activity(
            team=team,
            actor=request.user,
            task=task,
            action=Activity.ACTION_TASK_CREATED,
            message=message
        )

        return Response(serialize_task(task), status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    """
    GET /api/tasks/:id/ - Task detail (member of task's team only).
    PATCH /api/tasks/:id/ - Partial update task.
    """
    permission_classes = [IsAuthenticated, IsTeamMember]

    def get(self, request, id):
        task = get_task_or_404(id)
        self.check_object_permissions(request, task)
        return Response(serialize_task(task), status=status.HTTP_200_OK)

    def patch(self, request, id):
        task = get_task_or_404(id)
        self.check_object_permissions(request, task)

        serializer = TaskUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        old_status = task.status
        status_changed = False
        fields_changed = False

        if 'title' in data and data['title'] != task.title:
            task.title = data['title']
            fields_changed = True

        if 'description' in data and data['description'] != task.description:
            task.description = data['description']
            fields_changed = True

        if 'assigned_to' in data:
            new_assignee_id = data['assigned_to']
            if not new_assignee_id:
                if task.assigned_to is not None:
                    task.assigned_to = None
                    fields_changed = True
            else:
                try:
                    assigned_user = User.objects.get(id=new_assignee_id)
                except (User.DoesNotExist, bson.errors.InvalidId, Exception):
                    raise exceptions.ValidationError({'assigned_to': ['Assigned user does not exist.']})

                team_member_ids = [str(m.id) for m in task.team.members]
                if str(assigned_user.id) not in team_member_ids:
                    raise exceptions.ValidationError({'assigned_to': ['Assigned user must be a member of the team.']})

                current_assignee_id = str(task.assigned_to.id) if task.assigned_to else None
                if current_assignee_id != str(assigned_user.id):
                    task.assigned_to = assigned_user
                    fields_changed = True

        if 'status' in data and data['status'] != old_status:
            task.status = data['status']
            status_changed = True

        task.save()

        # Activity logging rule:
        # If one PATCH changes status and other fields, log two entries: one status_changed, one task_updated.
        if status_changed:
            new_status_label = STATUS_DISPLAY_MAP.get(task.status, task.status)
            status_msg = f'{request.user.name} changed status of "{task.title}" to {new_status_label}'
            log_activity(
                team=task.team,
                actor=request.user,
                task=task,
                action=Activity.ACTION_STATUS_CHANGED,
                message=status_msg
            )

        if fields_changed:
            updated_msg = f'{request.user.name} updated task "{task.title}"'
            log_activity(
                team=task.team,
                actor=request.user,
                task=task,
                action=Activity.ACTION_TASK_UPDATED,
                message=updated_msg
            )

        return Response(serialize_task(task), status=status.HTTP_200_OK)


class TaskCommentsView(APIView):
    """
    GET /api/tasks/:id/comments/ - List comments (oldest first).
    POST /api/tasks/:id/comments/ - Create a comment on the task.
    """
    permission_classes = [IsAuthenticated, IsTeamMember]

    def get(self, request, id):
        task = get_task_or_404(id)
        self.check_object_permissions(request, task)

        comments = Comment.objects(task=task).order_by('created_at')
        return Response([serialize_comment(c) for c in comments], status=status.HTTP_200_OK)

    def post(self, request, id):
        task = get_task_or_404(id)
        self.check_object_permissions(request, task)

        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = Comment(
            task=task,
            user=request.user,
            text=serializer.validated_data['text']
        )
        comment.save()

        # Log commented activity
        message = f'{request.user.name} commented on "{task.title}"'
        log_activity(
            team=task.team,
            actor=request.user,
            task=task,
            action=Activity.ACTION_COMMENTED,
            message=message
        )

        return Response(serialize_comment(comment), status=status.HTTP_201_CREATED)


class TeamActivityView(APIView):
    """
    GET /api/teams/:id/activity/
    Chronological activity feed ordered newest first.
    Supports ?limit=50 (default 50, max 200) and optional ?since=<ISO> for polling.
    """
    permission_classes = [IsAuthenticated, IsTeamMember]

    def get(self, request, id):
        team = get_team_or_404(id)
        self.check_object_permissions(request, team)

        # Parse limit parameter
        try:
            limit = int(request.query_params.get('limit', 50))
            if limit <= 0:
                limit = 50
            elif limit > 200:
                limit = 200
        except (ValueError, TypeError):
            limit = 50

        query = {'team': team}

        # Parse optional since parameter
        since_param = request.query_params.get('since')
        if since_param:
            try:
                # Normalize ISO string with Z or offset
                normalized_since = since_param.replace('Z', '+00:00')
                since_dt = datetime.fromisoformat(normalized_since)
                query['created_at__gt'] = since_dt
            except (ValueError, TypeError):
                raise exceptions.ValidationError({'since': ["Invalid ISO 8601 timestamp for 'since'."]})

        activities = Activity.objects(**query).order_by('-created_at')[:limit]
        return Response([serialize_activity(act) for act in activities], status=status.HTTP_200_OK)


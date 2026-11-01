from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from core.models import User, Team, Task, Activity, Comment, Invitation


def format_iso(dt: Optional[datetime]) -> Optional[str]:
    """Serialize datetime to UTC ISO 8601 string ending with 'Z'."""
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    utc_dt = dt.astimezone(timezone.utc)
    if utc_dt.microsecond:
        return utc_dt.strftime('%Y-%m-%dT%H:%M:%S.') + f'{utc_dt.microsecond // 1000:03d}Z'
    return utc_dt.strftime('%Y-%m-%dT%H:%M:%SZ')


def log_activity(
    team: Team,
    actor: User,
    action: str,
    message: str,
    task: Optional[Task] = None
) -> Activity:
    """
    All activity writes go through this single entrypoint.
    Views never write Activity directly.
    """
    activity = Activity(
        team=team,
        actor=actor,
        action=action,
        message=message,
        task=task
    )
    activity.save()
    return activity


def apply_pending_invites(user: User) -> int:
    """
    When a new user registers, find all invitations for their email,
    add them to each team, log member_added activity, and remove the invitation.
    """
    if not user.email:
        return 0

    invitations = Invitation.objects(email=user.email.strip().lower())
    applied_count = 0

    for invite in invitations:
        team = invite.team
        # Check if already in members
        member_ids = [str(m.id) for m in team.members]
        if str(user.id) not in member_ids:
            team.members.append(user)
            team.save()

            message = f"{invite.invited_by.name} added {user.name} to the team"
            log_activity(
                team=team,
                actor=invite.invited_by,
                action=Activity.ACTION_MEMBER_ADDED,
                message=message
            )
            applied_count += 1

        invite.delete()

    return applied_count


def serialize_user(user: User) -> Dict[str, Any]:
    """Serialize a User document."""
    return {
        'id': str(user.id),
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'created_at': format_iso(user.created_at),
    }


def serialize_team(team: Team, detail: bool = False) -> Dict[str, Any]:
    """Serialize a Team document (list view or detailed view with members)."""
    data = {
        'id': str(team.id),
        'name': team.name,
        'description': team.description,
        'created_by': {
            'id': str(team.created_by.id),
            'name': team.created_by.name,
        },
        'member_count': len(team.members),
        'created_at': format_iso(team.created_at),
    }
    if detail:
        data['members'] = [
            {
                'id': str(m.id),
                'name': m.name,
                'email': m.email,
                'role': m.role,
            }
            for m in team.members
        ]
    return data


def serialize_task(task: Task) -> Dict[str, Any]:
    """Serialize a Task document."""
    assigned_to_data = None
    if task.assigned_to:
        assigned_to_data = {
            'id': str(task.assigned_to.id),
            'name': task.assigned_to.name,
        }

    return {
        'id': str(task.id),
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'team_id': str(task.team.id),
        'assigned_to': assigned_to_data,
        'created_by': {
            'id': str(task.created_by.id),
            'name': task.created_by.name,
        },
        'created_at': format_iso(task.created_at),
        'updated_at': format_iso(task.updated_at),
    }


def serialize_comment(comment: Comment) -> Dict[str, Any]:
    """Serialize a Comment document."""
    return {
        'id': str(comment.id),
        'text': comment.text,
        'user': {
            'id': str(comment.user.id),
            'name': comment.user.name,
        },
        'created_at': format_iso(comment.created_at),
    }


def serialize_activity(activity: Activity) -> Dict[str, Any]:
    """Serialize an Activity document."""
    return {
        'id': str(activity.id),
        'action': activity.action,
        'message': activity.message,
        'actor': {
            'id': str(activity.actor.id),
            'name': activity.actor.name,
        },
        'task_id': str(activity.task.id) if activity.task else None,
        'created_at': format_iso(activity.created_at),
    }

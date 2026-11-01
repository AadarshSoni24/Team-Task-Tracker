import bson.errors
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, exceptions

from core.models import User, Team, Invitation, Activity
from core.permissions import IsAdmin, IsTeamMember
from core.serializers import TeamCreateSerializer, InviteSerializer
from core.services import serialize_team, serialize_user, log_activity
from core.exceptions import ConflictError


def get_team_or_404(team_id: str) -> Team:
    """Safely fetch a Team by string ID or raise 404."""
    try:
        return Team.objects.get(id=team_id)
    except (Team.DoesNotExist, bson.errors.InvalidId, Exception):
        raise exceptions.NotFound('Team not found.')


class TeamListCreateView(APIView):
    """
    GET /api/teams/ - List teams the user belongs to.
    POST /api/teams/ - Create a new team (admin only).
    """
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        # Query teams where members list contains the requesting user
        teams = Team.objects(members=request.user).order_by('-created_at')
        data = [serialize_team(team, detail=False) for team in teams]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TeamCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        team = Team(
            name=data['name'],
            description=data.get('description', ''),
            created_by=request.user,
            members=[request.user]
        )
        team.save()

        return Response(serialize_team(team, detail=True), status=status.HTTP_201_CREATED)


class TeamDetailView(APIView):
    """
    GET /api/teams/:id/ - Team detail with populated members (member only).
    """
    permission_classes = [IsAuthenticated, IsTeamMember]

    def get(self, request, id):
        team = get_team_or_404(id)
        self.check_object_permissions(request, team)
        return Response(serialize_team(team, detail=True), status=status.HTTP_200_OK)


class TeamInviteView(APIView):
    """
    POST /api/teams/:id/invite - Invite a member to the team via email (admin + member).
    """
    permission_classes = [IsAuthenticated, IsAdmin, IsTeamMember]

    def post(self, request, id):
        team = get_team_or_404(id)
        self.check_object_permissions(request, team)

        serializer = InviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        # Check if already a member
        member_emails = [m.email.lower() for m in team.members if m and m.email]
        if email in member_emails:
            raise ConflictError(f"User with email '{email}' is already a member of this team.")

        existing_user = User.objects(email=email).first()
        if existing_user:
            # User exists: add to team.members, log member_added
            team.members.append(existing_user)
            team.save()

            message = f"{request.user.name} added {existing_user.name} to the team"
            log_activity(
                team=team,
                actor=request.user,
                action=Activity.ACTION_MEMBER_ADDED,
                message=message
            )
            return Response({
                'detail': f"Added {existing_user.name} to the team.",
                'user': serialize_user(existing_user)
            }, status=status.HTTP_200_OK)
        else:
            # User does not exist: record pending Invitation
            invite = Invitation.objects(team=team, email=email).first()
            if not invite:
                invite = Invitation(
                    team=team,
                    email=email,
                    invited_by=request.user
                )
                invite.save()

            return Response({
                'detail': f"Invitation recorded for {email}. They will be added to the team upon registration."
            }, status=status.HTTP_200_OK)


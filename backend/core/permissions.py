from rest_framework.permissions import BasePermission
from core.models import Team, Task


class IsAdmin(BasePermission):
    """
    Allows access only to authenticated users with role 'admin'.
    """
    message = 'Only admins are permitted to perform this action.'

    def has_permission(self, request, view) -> bool:
        user = getattr(request, 'user', None)
        return bool(user and getattr(user, 'role', None) == 'admin')


class IsTeamMember(BasePermission):
    """
    Object-level permission ensuring that request.user belongs to the team
    associated with the object (Team or Task).
    """
    message = 'You must be a member of this team to access this resource.'

    def has_object_permission(self, request, view, obj) -> bool:
        user = getattr(request, 'user', None)
        if not user:
            return False

        user_id_str = str(user.id)

        if isinstance(obj, Team):
            member_ids = [str(m.id) for m in obj.members]
            return user_id_str in member_ids

        if isinstance(obj, Task):
            team = obj.team
            member_ids = [str(m.id) for m in team.members]
            return user_id_str in member_ids

        return False


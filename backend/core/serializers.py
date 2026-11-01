from rest_framework import serializers
from core.models import User, Task


class RegisterSerializer(serializers.Serializer):
    """Validation for user registration."""
    name = serializers.CharField(required=True, max_length=255, trim_whitespace=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=['admin', 'member'], default='member', required=False)

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Name cannot be blank.')
        return value.strip()

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if User.objects(email=normalized_email).first():
            raise serializers.ValidationError('Email already registered.')
        return normalized_email


class LoginSerializer(serializers.Serializer):
    """Validation for user login."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_email(self, value):
        return value.strip().lower()


class RefreshSerializer(serializers.Serializer):
    """Validation for JWT token refresh."""
    refresh = serializers.CharField(required=True)


class TeamCreateSerializer(serializers.Serializer):
    """Validation for creating a team."""
    name = serializers.CharField(required=True, max_length=255, trim_whitespace=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Team name cannot be blank.')
        return value.strip()


class InviteSerializer(serializers.Serializer):
    """Validation for inviting a member to a team."""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.strip().lower()


class TaskCreateSerializer(serializers.Serializer):
    """Validation for creating a task in a team."""
    title = serializers.CharField(required=True, max_length=255, trim_whitespace=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    assigned_to = serializers.CharField(required=False, allow_null=True, allow_blank=True, default=None)
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, default=Task.STATUS_PENDING, required=False)

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Task title cannot be blank.')
        return value.strip()


class TaskUpdateSerializer(serializers.Serializer):
    """Validation for updating a task."""
    title = serializers.CharField(required=False, max_length=255, trim_whitespace=True)
    description = serializers.CharField(required=False, allow_blank=True)
    assigned_to = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=False)

    def validate_title(self, value):
        if value is not None and not value.strip():
            raise serializers.ValidationError('Task title cannot be blank.')
        return value.strip() if value is not None else None


class CommentCreateSerializer(serializers.Serializer):
    """Validation for creating a comment on a task."""
    text = serializers.CharField(required=True, max_length=1000, trim_whitespace=True)

    def validate_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Comment text cannot be blank.')
        return value.strip()


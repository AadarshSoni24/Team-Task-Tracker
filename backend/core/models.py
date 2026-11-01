from datetime import datetime, timezone
import mongoengine as me


def utc_now() -> datetime:
    """Return the current UTC timestamp normalized to millisecond precision."""
    now = datetime.now(timezone.utc)
    return now.replace(microsecond=(now.microsecond // 1000) * 1000)


class User(me.Document):
    """User document stored in MongoDB."""
    name = me.StringField(required=True, max_length=255)
    email = me.StringField(required=True, unique=True)
    password = me.StringField(required=True)
    role = me.StringField(choices=['admin', 'member'], default='member')
    created_at = me.DateTimeField(default=utc_now)

    meta = {
        'collection': 'users',
        'indexes': [
            {'fields': ['email'], 'unique': True},
        ],
    }

    def clean(self):
        if self.email:
            self.email = self.email.strip().lower()

    @property
    def is_authenticated(self) -> bool:
        """DRF compatibility for authenticated user."""
        return True

    def __str__(self) -> str:
        return f"{self.name} <{self.email}> ({self.role})"


class Team(me.Document):
    """Team document with references to creator and member users."""
    name = me.StringField(required=True, max_length=255)
    description = me.StringField(default='')
    created_by = me.ReferenceField(User, required=True, reverse_delete_rule=me.CASCADE)
    members = me.ListField(me.ReferenceField(User), default=list)
    created_at = me.DateTimeField(default=utc_now)

    meta = {
        'collection': 'teams',
        'indexes': [
            'created_by',
        ],
    }

    def __str__(self) -> str:
        return self.name


class Invitation(me.Document):
    """Pending team invitation for emails that have not yet registered."""
    team = me.ReferenceField(Team, required=True, reverse_delete_rule=me.CASCADE)
    email = me.StringField(required=True)
    invited_by = me.ReferenceField(User, required=True)
    created_at = me.DateTimeField(default=utc_now)

    meta = {
        'collection': 'invitations',
        'indexes': [
            {'fields': ['email']},
            {'fields': ['team', 'email']},
        ],
    }

    def clean(self):
        if self.email:
            self.email = self.email.strip().lower()

    def __str__(self) -> str:
        return f"Invite for {self.email} to {self.team.name}"


class Task(me.Document):
    """Task document scoped to a team and assigned to a team member."""
    STATUS_PENDING = 'pending'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_DONE = 'done'

    STATUS_CHOICES = [STATUS_PENDING, STATUS_IN_PROGRESS, STATUS_DONE]

    title = me.StringField(required=True, max_length=255)
    description = me.StringField(default='')
    assigned_to = me.ReferenceField(User, null=True, required=False)
    status = me.StringField(choices=STATUS_CHOICES, default=STATUS_PENDING)
    team = me.ReferenceField(Team, required=True, reverse_delete_rule=me.CASCADE)
    created_by = me.ReferenceField(User, required=True)
    created_at = me.DateTimeField(default=utc_now)
    updated_at = me.DateTimeField(default=utc_now)

    meta = {
        'collection': 'tasks',
        'indexes': [
            {'fields': ['team', 'status']},
            {'fields': ['team', '-created_at']},
        ],
    }

    def save(self, *args, **kwargs):
        self.updated_at = utc_now()
        return super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Task: {self.title} [{self.status}]"


class Comment(me.Document):
    """Comment on a task created by a team member."""
    task = me.ReferenceField(Task, required=True, reverse_delete_rule=me.CASCADE)
    user = me.ReferenceField(User, required=True)
    text = me.StringField(required=True, max_length=1000)
    created_at = me.DateTimeField(default=utc_now)

    meta = {
        'collection': 'comments',
        'indexes': [
            {'fields': ['task']},
            {'fields': ['task', 'created_at']},
        ],
    }

    def __str__(self) -> str:
        return f"Comment by {self.user.name} on {self.task.title}"


class Activity(me.Document):
    """Chronological activity entry recording team actions."""
    ACTION_TASK_CREATED = 'task_created'
    ACTION_TASK_UPDATED = 'task_updated'
    ACTION_STATUS_CHANGED = 'status_changed'
    ACTION_COMMENTED = 'commented'
    ACTION_MEMBER_ADDED = 'member_added'

    ACTION_CHOICES = [
        ACTION_TASK_CREATED,
        ACTION_TASK_UPDATED,
        ACTION_STATUS_CHANGED,
        ACTION_COMMENTED,
        ACTION_MEMBER_ADDED,
    ]

    team = me.ReferenceField(Team, required=True, reverse_delete_rule=me.CASCADE)
    actor = me.ReferenceField(User, required=True)
    task = me.ReferenceField(Task, null=True, required=False)
    action = me.StringField(choices=ACTION_CHOICES, required=True)
    message = me.StringField(required=True)
    created_at = me.DateTimeField(default=utc_now)

    meta = {
        'collection': 'activities',
        'indexes': [
            {'fields': ['team', '-created_at']},
        ],
    }

    def __str__(self) -> str:
        return f"[{self.action}] {self.message}"


class RevokedToken(me.Document):
    """Track revoked JWT tokens (such as rotated refresh tokens)."""
    jti = me.StringField(required=True, unique=True)
    revoked_at = me.DateTimeField(default=utc_now)

    meta = {
        'collection': 'revoked_tokens',
        'indexes': [
            {'fields': ['jti'], 'unique': True},
        ],
    }

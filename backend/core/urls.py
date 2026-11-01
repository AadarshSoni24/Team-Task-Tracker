from django.urls import re_path
from core.views.auth_views import RegisterView, LoginView, RefreshView, MeView
from core.views.team_views import TeamListCreateView, TeamDetailView, TeamInviteView
from core.views.task_views import (
    TeamTasksView,
    TaskDetailView,
    TaskCommentsView,
    TeamActivityView,
)

urlpatterns = [
    # Auth endpoints
    re_path(r'^auth/register/?$', RegisterView.as_view(), name='auth-register'),
    re_path(r'^auth/login/?$', LoginView.as_view(), name='auth-login'),
    re_path(r'^auth/refresh/?$', RefreshView.as_view(), name='auth-refresh'),
    re_path(r'^auth/me/?$', MeView.as_view(), name='auth-me'),

    # Team nested endpoints
    re_path(r'^teams/(?P<id>[^/]+)/invite/?$', TeamInviteView.as_view(), name='team-invite'),
    re_path(r'^teams/(?P<id>[^/]+)/tasks/?$', TeamTasksView.as_view(), name='team-tasks'),
    re_path(r'^teams/(?P<id>[^/]+)/activity/?$', TeamActivityView.as_view(), name='team-activity'),
    re_path(r'^teams/(?P<id>[^/]+)/?$', TeamDetailView.as_view(), name='team-detail'),
    re_path(r'^teams/?$', TeamListCreateView.as_view(), name='team-list-create'),

    # Task endpoints
    re_path(r'^tasks/(?P<id>[^/]+)/comments/?$', TaskCommentsView.as_view(), name='task-comments'),
    re_path(r'^tasks/(?P<id>[^/]+)/?$', TaskDetailView.as_view(), name='task-detail'),
]

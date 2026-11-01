from datetime import datetime, timezone, timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.hashers import make_password

from core.models import User, Team, Task, Activity, Comment, Invitation
from core.auth import make_token
from core.services import format_iso


class TaskAndActivityTests(APITestCase):
    """Unit and integration tests for Tasks, Comments, and Activity timeline."""

    def setUp(self):
        User.drop_collection()
        Team.drop_collection()
        Task.drop_collection()
        Activity.drop_collection()
        Comment.drop_collection()
        Invitation.drop_collection()

        # Users
        self.alice = User(
            name='Alice Admin',
            email='alice@example.com',
            password=make_password('Password@123'),
            role='admin'
        ).save()
        self.alice_token = make_token(str(self.alice.id), 'access')

        self.bob = User(
            name='Bob Member',
            email='bob@example.com',
            password=make_password('Password@123'),
            role='member'
        ).save()
        self.bob_token = make_token(str(self.bob.id), 'access')

        self.charlie = User(
            name='Charlie Outsider',
            email='charlie@example.com',
            password=make_password('Password@123'),
            role='member'
        ).save()
        self.charlie_token = make_token(str(self.charlie.id), 'access')

        # Team with Alice and Bob
        self.team = Team(
            name='Alpha Team',
            description='Primary squad',
            created_by=self.alice,
            members=[self.alice, self.bob]
        ).save()

    def tearDown(self):
        User.drop_collection()
        Team.drop_collection()
        Task.drop_collection()
        Activity.drop_collection()
        Comment.drop_collection()
        Invitation.drop_collection()

    def test_member_can_create_task_and_logs_activity(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.bob_token}')
        payload = {
            'title': 'Design API endpoints',
            'description': 'REST contract for backend',
            'assigned_to': str(self.alice.id),
            'status': 'in_progress'
        }
        res = self.client.post(f'/api/teams/{self.team.id}/tasks/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'Design API endpoints')
        self.assertEqual(res.data['status'], 'in_progress')
        self.assertEqual(res.data['assigned_to']['id'], str(self.alice.id))
        self.assertEqual(res.data['created_by']['id'], str(self.bob.id))
        self.assertIn('Z', res.data['created_at'])

        # Verify activity logged
        act = Activity.objects(team=self.team).first()
        self.assertIsNotNone(act)
        self.assertEqual(act.action, Activity.ACTION_TASK_CREATED)
        self.assertEqual(act.message, 'Bob Member created task "Design API endpoints"')
        self.assertEqual(str(act.task.id), res.data['id'])

    def test_non_member_cannot_create_task_returns_403(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.charlie_token}')
        payload = {'title': 'Sneaky Task'}
        res = self.client.post(f'/api/teams/{self.team.id}/tasks/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', res.data)

    def test_assigned_to_must_be_team_member(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.alice_token}')
        # Assign to Charlie who is NOT a member of self.team
        payload = {
            'title': 'Invalid Assignment',
            'assigned_to': str(self.charlie.id)
        }
        res = self.client.post(f'/api/teams/{self.team.id}/tasks/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assigned_to', res.data['errors'])

    def test_list_tasks_and_status_filter(self):
        # Create 3 tasks with different statuses
        Task(title='Task 1', status='pending', team=self.team, created_by=self.alice).save()
        Task(title='Task 2', status='in_progress', team=self.team, created_by=self.alice).save()
        Task(title='Task 3', status='done', team=self.team, created_by=self.alice).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.bob_token}')

        # List all
        res_all = self.client.get(f'/api/teams/{self.team.id}/tasks/')
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_all.data), 3)

        # Filter by in_progress
        res_filtered = self.client.get(f'/api/teams/{self.team.id}/tasks/?status=in_progress')
        self.assertEqual(res_filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_filtered.data), 1)
        self.assertEqual(res_filtered.data[0]['title'], 'Task 2')

        # Filter by done
        res_done = self.client.get(f'/api/teams/{self.team.id}/tasks/?status=done')
        self.assertEqual(res_done.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_done.data), 1)
        self.assertEqual(res_done.data[0]['title'], 'Task 3')

    def test_non_member_cannot_list_tasks_returns_403(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.charlie_token}')
        res = self.client.get(f'/api/teams/{self.team.id}/tasks/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_detail_member_allowed_non_member_forbidden(self):
        task = Task(title='Secret Task', team=self.team, created_by=self.alice).save()

        # Bob (member) can read
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.bob_token}')
        res_bob = self.client.get(f'/api/tasks/{task.id}/')
        self.assertEqual(res_bob.status_code, status.HTTP_200_OK)
        self.assertEqual(res_bob.data['title'], 'Secret Task')

        # Charlie (non-member) forbidden
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.charlie_token}')
        res_charlie = self.client.get(f'/api/tasks/{task.id}/')
        self.assertEqual(res_charlie.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_task_status_only_logs_status_changed(self):
        task = Task(title='Deploy App', status='pending', team=self.team, created_by=self.alice).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.bob_token}')
        patch_payload = {'status': 'in_progress'}
        res = self.client.patch(f'/api/tasks/{task.id}/', patch_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'in_progress')

        # Check activity
        acts = Activity.objects(team=self.team).order_by('-created_at')
        self.assertEqual(len(acts), 1)
        self.assertEqual(acts[0].action, Activity.ACTION_STATUS_CHANGED)
        self.assertEqual(acts[0].message, 'Bob Member changed status of "Deploy App" to In Progress')

    def test_patch_task_dual_update_logs_two_activities(self):
        task = Task(title='Old Title', status='pending', team=self.team, created_by=self.alice).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.bob_token}')
        patch_payload = {
            'title': 'New Title',
            'status': 'done'
        }
        res = self.client.patch(f'/api/tasks/{task.id}/', patch_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Should log status_changed AND task_updated
        acts = Activity.objects(team=self.team).order_by('created_at')
        actions = [a.action for a in acts]
        self.assertIn(Activity.ACTION_STATUS_CHANGED, actions)
        self.assertIn(Activity.ACTION_TASK_UPDATED, actions)
        messages = [a.message for a in acts]
        self.assertTrue(any('changed status of "New Title" to Done' in m for m in messages))
        self.assertTrue(any('updated task "New Title"' in m for m in messages))

    def test_comments_create_and_list_chronological(self):
        task = Task(title='Feature X', team=self.team, created_by=self.alice).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.bob_token}')
        res1 = self.client.post(f'/api/tasks/{task.id}/comments/', {'text': 'First comment'}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data['text'], 'First comment')
        self.assertEqual(res1.data['user']['name'], 'Bob Member')

        # Second comment by Alice
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.alice_token}')
        res2 = self.client.post(f'/api/tasks/{task.id}/comments/', {'text': 'Second comment'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        # List comments - oldest first
        res_list = self.client.get(f'/api/tasks/{task.id}/comments/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data), 2)
        self.assertEqual(res_list.data[0]['text'], 'First comment')
        self.assertEqual(res_list.data[1]['text'], 'Second comment')

        # Verify activity logged
        act = Activity.objects(team=self.team, action=Activity.ACTION_COMMENTED).first()
        self.assertIsNotNone(act)
        self.assertIn('commented on "Feature X"', act.message)

    def test_activity_timeline_ordering_limit_and_since_polling(self):
        base_time = datetime.now(timezone.utc) - timedelta(minutes=10)
        base_time = base_time.replace(microsecond=(base_time.microsecond // 1000) * 1000)

        # Create sequential activities
        a1 = Activity(
            team=self.team,
            actor=self.alice,
            action=Activity.ACTION_TASK_CREATED,
            message='Alice created task "A"',
            created_at=base_time
        ).save()

        a2 = Activity(
            team=self.team,
            actor=self.bob,
            action=Activity.ACTION_COMMENTED,
            message='Bob commented on "A"',
            created_at=base_time + timedelta(minutes=2)
        ).save()

        a3 = Activity(
            team=self.team,
            actor=self.alice,
            action=Activity.ACTION_STATUS_CHANGED,
            message='Alice changed status of "A" to Done',
            created_at=base_time + timedelta(minutes=5)
        ).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.bob_token}')

        # 1. Activity ordered newest first
        res = self.client.get(f'/api/teams/{self.team.id}/activity/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 3)
        self.assertEqual(res.data[0]['id'], str(a3.id))
        self.assertEqual(res.data[1]['id'], str(a2.id))
        self.assertEqual(res.data[2]['id'], str(a1.id))

        # 2. Limit test
        res_limit = self.client.get(f'/api/teams/{self.team.id}/activity/?limit=2')
        self.assertEqual(res_limit.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_limit.data), 2)
        self.assertEqual(res_limit.data[0]['id'], str(a3.id))

        # 3. Since parameter for polling (returns only items newer than a2)
        since_iso = format_iso(a2.created_at)
        res_since = self.client.get(f'/api/teams/{self.team.id}/activity/?since={since_iso}')
        self.assertEqual(res_since.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_since.data), 1)
        self.assertEqual(res_since.data[0]['id'], str(a3.id))

    def test_non_member_cannot_view_activity_returns_403(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.charlie_token}')
        res = self.client.get(f'/api/teams/{self.team.id}/activity/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

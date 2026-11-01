from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.hashers import make_password

from core.models import User, Team, Invitation, Task, Activity, Comment
from core.auth import make_token


class TeamTests(APITestCase):
    """Unit and integration tests for Team creation, listing, details, and invitations."""

    def setUp(self):
        User.drop_collection()
        Team.drop_collection()
        Invitation.drop_collection()
        Task.drop_collection()
        Activity.drop_collection()
        Comment.drop_collection()

        # Admin user
        self.admin = User(
            name='Alice Admin',
            email='alice@example.com',
            password=make_password('Password@123'),
            role='admin'
        ).save()
        self.admin_token = make_token(str(self.admin.id), 'access')

        # Member user
        self.member = User(
            name='Bob Member',
            email='bob@example.com',
            password=make_password('Password@123'),
            role='member'
        ).save()
        self.member_token = make_token(str(self.member.id), 'access')

        # Another member (outsider)
        self.outsider = User(
            name='Charlie Outsider',
            email='charlie@example.com',
            password=make_password('Password@123'),
            role='member'
        ).save()
        self.outsider_token = make_token(str(self.outsider.id), 'access')

    def tearDown(self):
        User.drop_collection()
        Team.drop_collection()
        Invitation.drop_collection()
        Task.drop_collection()
        Activity.drop_collection()
        Comment.drop_collection()

    def test_admin_can_create_team(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        payload = {
            'name': 'Core Engineering',
            'description': 'Main engineering squad'
        }
        res = self.client.post('/api/teams/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['name'], 'Core Engineering')
        self.assertEqual(res.data['member_count'], 1)
        self.assertEqual(res.data['created_by']['id'], str(self.admin.id))
        self.assertEqual(len(res.data['members']), 1)
        self.assertEqual(res.data['members'][0]['id'], str(self.admin.id))

    def test_member_cannot_create_team_returns_403(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.member_token}')
        payload = {
            'name': 'Unauthorized Team',
            'description': 'Should fail'
        }
        res = self.client.post('/api/teams/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', res.data)

    def test_list_teams_returns_only_user_teams(self):
        # Create team with admin and member
        team1 = Team(
            name='Alpha Squad',
            created_by=self.admin,
            members=[self.admin, self.member]
        ).save()

        # Create team with only admin
        team2 = Team(
            name='Beta Squad',
            created_by=self.admin,
            members=[self.admin]
        ).save()

        # Bob Member lists teams -> should only see team1
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.member_token}')
        res = self.client.get('/api/teams/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], str(team1.id))
        self.assertEqual(res.data[0]['name'], 'Alpha Squad')

        # Charlie Outsider lists teams -> should see none
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.outsider_token}')
        res_out = self.client.get('/api/teams/')
        self.assertEqual(res_out.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_out.data), 0)

    def test_team_detail_member_can_view(self):
        team = Team(
            name='Design Squad',
            description='Design Team',
            created_by=self.admin,
            members=[self.admin, self.member]
        ).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.member_token}')
        res = self.client.get(f'/api/teams/{team.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['id'], str(team.id))
        self.assertEqual(res.data['name'], 'Design Squad')
        self.assertEqual(len(res.data['members']), 2)
        member_emails = [m['email'] for m in res.data['members']]
        self.assertIn('alice@example.com', member_emails)
        self.assertIn('bob@example.com', member_emails)

    def test_team_detail_non_member_returns_403(self):
        team = Team(
            name='Private Squad',
            created_by=self.admin,
            members=[self.admin]
        ).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.member_token}')
        res = self.client.get(f'/api/teams/{team.id}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', res.data)

    def test_invalid_team_id_returns_404_not_500(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.get('/api/teams/invalid-object-id-123/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', res.data)

    def test_invite_existing_user_adds_to_team_and_logs_activity(self):
        team = Team(
            name='DevOps Squad',
            created_by=self.admin,
            members=[self.admin]
        ).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.post(f'/api/teams/{team.id}/invite', {'email': 'bob@example.com'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Verify Bob is added to team
        updated_team = Team.objects.get(id=team.id)
        member_ids = [str(m.id) for m in updated_team.members]
        self.assertIn(str(self.member.id), member_ids)

        # Verify activity was logged
        act = Activity.objects(team=team).first()
        self.assertIsNotNone(act)
        self.assertEqual(act.action, Activity.ACTION_MEMBER_ADDED)
        self.assertIn('Alice Admin added Bob Member to the team', act.message)

    def test_invite_already_member_returns_409(self):
        team = Team(
            name='QA Squad',
            created_by=self.admin,
            members=[self.admin, self.member]
        ).save()

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        res = self.client.post(f'/api/teams/{team.id}/invite', {'email': 'bob@example.com'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('already a member', res.data['detail'])

    def test_invite_pending_user_applied_on_registration(self):
        team = Team(
            name='Product Squad',
            created_by=self.admin,
            members=[self.admin]
        ).save()

        # Admin invites email that doesn't exist yet
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        inv_email = 'newbie@example.com'
        res_inv = self.client.post(f'/api/teams/{team.id}/invite', {'email': inv_email}, format='json')
        self.assertEqual(res_inv.status_code, status.HTTP_200_OK)

        # Verify invitation saved
        invite = Invitation.objects(email=inv_email).first()
        self.assertIsNotNone(invite)

        # Now newbie registers
        self.client.credentials()  # unauthenticated
        reg_payload = {
            'name': 'Newbie User',
            'email': inv_email,
            'password': 'Password@123'
        }
        reg_res = self.client.post('/api/auth/register', reg_payload, format='json')
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        newbie_id = reg_res.data['user']['id']

        # Verify newbie is now automatically in team.members
        updated_team = Team.objects.get(id=team.id)
        member_ids = [str(m.id) for m in updated_team.members]
        self.assertIn(newbie_id, member_ids)

        # Verify invitation record was cleaned up
        self.assertIsNone(Invitation.objects(email=inv_email).first())

        # Verify activity was logged
        act = Activity.objects(team=team, action=Activity.ACTION_MEMBER_ADDED).first()
        self.assertIsNotNone(act)
        self.assertIn('Alice Admin added Newbie User to the team', act.message)

    def test_member_cannot_invite_returns_403(self):
        team = Team(
            name='Squad',
            created_by=self.admin,
            members=[self.admin, self.member]
        ).save()

        # Bob (member) tries to invite
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.member_token}')
        res = self.client.post(f'/api/teams/{team.id}/invite', {'email': 'someuser@example.com'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


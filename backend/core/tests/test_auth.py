from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
import mongoengine as me

from core.models import User, RevokedToken, Invitation, Team, Task, Activity, Comment
from core.auth import make_token


class AuthTests(APITestCase):
    """Unit and integration tests for Authentication flows."""

    def setUp(self):
        # Clean collections before each test
        User.drop_collection()
        RevokedToken.drop_collection()
        Invitation.drop_collection()
        Team.drop_collection()
        Task.drop_collection()
        Activity.drop_collection()
        Comment.drop_collection()

    def tearDown(self):
        # Clean collections after each test
        User.drop_collection()
        RevokedToken.drop_collection()
        Invitation.drop_collection()
        Team.drop_collection()
        Task.drop_collection()
        Activity.drop_collection()
        Comment.drop_collection()

    def test_register_success_default_member(self):
        payload = {
            'name': 'Riya Sharma',
            'email': 'riya@example.com',
            'password': 'Password@123'
        }
        res = self.client.post('/api/auth/register', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', res.data)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['name'], 'Riya Sharma')
        self.assertEqual(res.data['user']['email'], 'riya@example.com')
        self.assertEqual(res.data['user']['role'], 'member')
        self.assertNotIn('password', res.data['user'])

    def test_register_success_admin_role(self):
        payload = {
            'name': 'Admin User',
            'email': 'admin@example.com',
            'password': 'AdminPassword@123',
            'role': 'admin'
        }
        res = self.client.post('/api/auth/register', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['role'], 'admin')

    def test_register_short_password_fails(self):
        payload = {
            'name': 'Short Pass',
            'email': 'short@example.com',
            'password': 'short'  # less than 8 chars
        }
        res = self.client.post('/api/auth/register', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', res.data)
        self.assertIn('password', res.data['errors'])

    def test_register_duplicate_email_fails(self):
        payload = {
            'name': 'First User',
            'email': 'test@example.com',
            'password': 'Password@123'
        }
        res1 = self.client.post('/api/auth/register', payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post('/api/auth/register', payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', res2.data)
        self.assertIn('email', res2.data['errors'])

    def test_login_success(self):
        # Register first
        reg_payload = {
            'name': 'Login Tester',
            'email': 'login@example.com',
            'password': 'Password@123'
        }
        self.client.post('/api/auth/register', reg_payload, format='json')

        login_payload = {
            'email': 'login@example.com',
            'password': 'Password@123'
        }
        res = self.client.post('/api/auth/login', login_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['email'], 'login@example.com')

    def test_login_invalid_credentials_returns_401(self):
        login_payload = {
            'email': 'nonexistent@example.com',
            'password': 'WrongPassword123'
        }
        res = self.client.post('/api/auth/login', login_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data['detail'], 'Invalid email or password.')

    def test_refresh_token_rotation_and_revocation(self):
        reg_payload = {
            'name': 'Refresh Tester',
            'email': 'refresh@example.com',
            'password': 'Password@123'
        }
        reg_res = self.client.post('/api/auth/register', reg_payload, format='json')
        old_refresh = reg_res.data['refresh']

        # First refresh succeeds
        ref_res = self.client.post('/api/auth/refresh', {'refresh': old_refresh}, format='json')
        self.assertEqual(ref_res.status_code, status.HTTP_200_OK)
        new_access = ref_res.data['access']
        new_refresh = ref_res.data['refresh']
        self.assertNotEqual(old_refresh, new_refresh)

        # Attempting to use the rotated old refresh token fails with 401
        reuse_res = self.client.post('/api/auth/refresh', {'refresh': old_refresh}, format='json')
        self.assertEqual(reuse_res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('revoked', reuse_res.data['detail'].lower())

    def test_wrong_token_type_rejected_on_refresh(self):
        reg_payload = {
            'name': 'Type Tester',
            'email': 'type@example.com',
            'password': 'Password@123'
        }
        reg_res = self.client.post('/api/auth/register', reg_payload, format='json')
        access_token = reg_res.data['access']

        # Pass access token to refresh endpoint
        res = self.client.post('/api/auth/refresh', {'refresh': access_token}, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('Invalid token type', res.data['detail'])

    def test_expired_access_token_returns_401_with_code(self):
        reg_payload = {
            'name': 'Expiry Tester',
            'email': 'expiry@example.com',
            'password': 'Password@123'
        }
        reg_res = self.client.post('/api/auth/register', reg_payload, format='json')
        user_id = reg_res.data['user']['id']

        # Create intentionally expired access token (-1 minute lifetime)
        expired_token = make_token(user_id, token_type='access', lifetime=timedelta(minutes=-1))

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {expired_token}')
        res = self.client.get('/api/auth/me')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data.get('detail'), 'Token expired')
        self.assertEqual(res.data.get('code'), 'token_expired')

    def test_unauthenticated_request_returns_401_never_403(self):
        self.client.credentials()  # clear credentials
        res = self.client.get('/api/auth/me')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', res.data)

    def test_get_current_user_profile(self):
        reg_payload = {
            'name': 'Profile Tester',
            'email': 'profile@example.com',
            'password': 'Password@123'
        }
        reg_res = self.client.post('/api/auth/register', reg_payload, format='json')
        access_token = reg_res.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        res = self.client.get('/api/auth/me')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name'], 'Profile Tester')
        self.assertEqual(res.data['email'], 'profile@example.com')
        self.assertIn('created_at', res.data)
        self.assertIn('Z', res.data['created_at'])


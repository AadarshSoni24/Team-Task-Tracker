from django.contrib.auth.hashers import make_password, check_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status, exceptions

from core.models import User
from core.serializers import RegisterSerializer, LoginSerializer, RefreshSerializer
from core.auth import make_token, rotate_refresh_token
from core.services import serialize_user, apply_pending_invites


class RegisterView(APIView):
    """
    POST /api/auth/register
    Creates a new user, applies pending invites, and returns user with JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        hashed_password = make_password(data['password'])

        user = User(
            name=data['name'],
            email=data['email'],
            password=hashed_password,
            role=data.get('role', 'member')
        )
        user.save()

        # Connect any teams that invited this email before registration
        apply_pending_invites(user)

        access_token = make_token(str(user.id), token_type='access')
        refresh_token = make_token(str(user.id), token_type='refresh')

        return Response({
            'user': serialize_user(user),
            'access': access_token,
            'refresh': refresh_token,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    POST /api/auth/login
    Authenticates user credentials and returns user with JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = User.objects(email=email).first()
        if not user or not check_password(password, user.password):
            raise exceptions.AuthenticationFailed('Invalid email or password.')

        access_token = make_token(str(user.id), token_type='access')
        refresh_token = make_token(str(user.id), token_type='refresh')

        return Response({
            'user': serialize_user(user),
            'access': access_token,
            'refresh': refresh_token,
        }, status=status.HTTP_200_OK)


class RefreshView(APIView):
    """
    POST /api/auth/refresh
    Rotates a refresh token and returns a new access and refresh token pair.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_token_str = serializer.validated_data['refresh']
        access_token, new_refresh_token, _ = rotate_refresh_token(refresh_token_str)

        return Response({
            'access': access_token,
            'refresh': new_refresh_token,
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET /api/auth/me
    Returns the currently authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(serialize_user(request.user), status=status.HTTP_200_OK)


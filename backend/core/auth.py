import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework import exceptions

from core.models import User, RevokedToken
from core.exceptions import TokenExpiredError


ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)
REFRESH_TOKEN_LIFETIME = timedelta(days=7)
JWT_ALGORITHM = 'HS256'


def make_token(user_id: str, token_type: str = 'access', lifetime: Optional[timedelta] = None) -> str:
    """
    Generate a signed PyJWT token (access or refresh).
    """
    now = datetime.now(timezone.utc)
    if lifetime is None:
        lifetime = ACCESS_TOKEN_LIFETIME if token_type == 'access' else REFRESH_TOKEN_LIFETIME

    jti = str(uuid.uuid4())
    payload = {
        'user_id': str(user_id),
        'type': token_type,
        'jti': jti,
        'iat': int(now.timestamp()),
        'exp': int((now + lifetime).timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a PyJWT token.
    Raises TokenExpiredError if expired, or AuthenticationFailed if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={'require': ['exp', 'iat', 'user_id', 'type']},
        )
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError() from exc
    except jwt.PyJWTError as exc:
        raise exceptions.AuthenticationFailed('Invalid token.') from exc


def rotate_refresh_token(refresh_token_str: str) -> Tuple[str, str, User]:
    """
    Verify and rotate a refresh token.
    Validates signature, expiration, type=='refresh', and that token is not already revoked.
    Revokes the old refresh token and issues a new access and refresh token pair.
    """
    payload = decode_token(refresh_token_str)

    if payload.get('type') != 'refresh':
        raise exceptions.AuthenticationFailed('Invalid token type: expected refresh token.')

    jti = payload.get('jti')
    if not jti:
        raise exceptions.AuthenticationFailed('Invalid token structure.')

    # Check if token is already revoked
    if RevokedToken.objects(jti=jti).first():
        raise exceptions.AuthenticationFailed('Refresh token has already been revoked.')

    user_id = payload.get('user_id')
    try:
        user = User.objects.get(id=user_id)
    except Exception as exc:
        raise exceptions.AuthenticationFailed('User not found.') from exc

    # Revoke old refresh token (rotation enforcement)
    RevokedToken(jti=jti).save()

    new_access = make_token(str(user.id), token_type='access')
    new_refresh = make_token(str(user.id), token_type='refresh')

    return new_access, new_refresh, user


class JWTAuthentication(BaseAuthentication):
    """
    DRF custom authentication class using PyJWT.
    Returns (user, token) on success, None if no auth header is present.
    Raises AuthenticationFailed (401) on invalid or expired token.
    """

    def authenticate_header(self, request) -> str:
        """
        Required so DRF returns HTTP 401 (Unauthorized) instead of 403 (Forbidden)
        when credentials are not provided or invalid.
        """
        return 'Bearer'

    def authenticate(self, request) -> Optional[Tuple[User, str]]:
        auth_header = get_authorization_header(request).split()

        if not auth_header:
            return None

        if len(auth_header) == 1 or auth_header[0].lower() != b'bearer':
            raise exceptions.AuthenticationFailed('Invalid Authorization header. Format must be "Bearer <token>".')

        if len(auth_header) > 2:
            raise exceptions.AuthenticationFailed('Invalid Authorization header. Token string should not contain spaces.')

        token = auth_header[1].decode('utf-8')
        payload = decode_token(token)

        if payload.get('type') != 'access':
            raise exceptions.AuthenticationFailed('Invalid token type: expected access token.')

        user_id = payload.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except Exception as exc:
            raise exceptions.AuthenticationFailed('User not found.') from exc

        return (user, token)


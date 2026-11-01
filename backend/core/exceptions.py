import bson.errors
from rest_framework import exceptions, status
from rest_framework.response import Response
import mongoengine.errors


class ConflictError(exceptions.APIException):
    """Custom exception representing an HTTP 409 Conflict."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'A conflict occurred with the current state of the resource.'
    default_code = 'conflict'


class TokenExpiredError(exceptions.AuthenticationFailed):
    """Exception raised when an access token has expired."""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Token expired'
    default_code = 'token_expired'


def custom_exception_handler(exc, context):
    """
    Custom exception handler that standardizes all DRF error responses
    according to PRD Section 7:
    - Base shape: {"detail": "human readable message"}
    - Validation errors (400): {"detail": "Validation error", "errors": {"field": ["message"]}}
    - Expired access tokens (401): {"detail": "Token expired", "code": "token_expired"}
    - Invalid ObjectId or DoesNotExist gives 404, not 500
    - Missing/invalid auth tokens return 401, never 403
    """
    # Handle mongoengine/BSON errors that bypass DRF by default
    if isinstance(exc, (bson.errors.InvalidId, mongoengine.errors.DoesNotExist)):
        return Response({'detail': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)

    if isinstance(exc, ConflictError):
        detail_msg = str(exc.detail) if hasattr(exc, 'detail') else 'Conflict.'
        return Response({'detail': detail_msg}, status=status.HTTP_409_CONFLICT)

    # Let DRF process standard APIExceptions first
    from rest_framework.views import exception_handler
    response = exception_handler(exc, context)

    # Token expired special shape check
    is_token_expired = (
        isinstance(exc, TokenExpiredError) or
        getattr(exc, 'code', None) == 'token_expired' or
        getattr(getattr(exc, 'detail', None), 'code', None) == 'token_expired' or
        str(getattr(exc, 'detail', '')) == 'Token expired'
    )
    if is_token_expired:
        return Response({
            'detail': 'Token expired',
            'code': 'token_expired'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if response is not None:
        # Standardize 401 Unauthorized
        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            detail_msg = response.data.get('detail', 'Authentication credentials were not provided.')
            return Response({'detail': str(detail_msg)}, status=status.HTTP_401_UNAUTHORIZED)

        # Standardize 403 Forbidden
        if response.status_code == status.HTTP_403_FORBIDDEN:
            detail_msg = response.data.get('detail', 'You do not have permission to perform this action.')
            return Response({'detail': str(detail_msg)}, status=status.HTTP_403_FORBIDDEN)

        # Standardize 404 Not Found
        if response.status_code == status.HTTP_404_NOT_FOUND:
            detail_msg = response.data.get('detail', 'Not found.')
            return Response({'detail': str(detail_msg)}, status=status.HTTP_404_NOT_FOUND)

        # Standardize 400 Validation Errors
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            errors_dict = {}
            raw_data = response.data

            if isinstance(raw_data, dict):
                for field, error_list in raw_data.items():
                    if isinstance(error_list, list):
                        errors_dict[field] = [str(e) for e in error_list]
                    else:
                        errors_dict[field] = [str(error_list)]
            elif isinstance(raw_data, list):
                errors_dict['non_field_errors'] = [str(e) for e in raw_data]
            else:
                errors_dict['detail'] = [str(raw_data)]

            # Check if there is an explicit top-level detail message
            top_detail = 'Validation error'
            if 'detail' in errors_dict and len(errors_dict) == 1:
                top_detail = errors_dict['detail'][0]
                return Response({'detail': top_detail}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'detail': top_detail,
                'errors': errors_dict
            }, status=status.HTTP_400_BAD_REQUEST)

        # For any other status code, ensure a detail message exists
        if isinstance(response.data, dict) and 'detail' not in response.data:
            response.data = {'detail': str(response.data)}

        return response

    # Fallback for unhandled exceptions
    return Response(
        {'detail': 'An internal server error occurred.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

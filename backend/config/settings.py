import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import mongoengine

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv('SECRET_KEY', 'default-insecure-secret-key-32-chars-long')

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'corsheaders',
    'rest_framework',
    'core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = []

WSGI_APPLICATION = 'config.wsgi.application'

# No Django ORM models are used. We provide an in-memory SQLite database solely
# to satisfy Django's internal management commands and test runner harness.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# CORS Configuration
cors_origins_env = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]
CORS_ALLOW_ALL_ORIGINS = os.getenv('CORS_ALLOW_ALL', 'False').lower() in ('true', '1', 't')

# Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.auth.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'UNAUTHENTICATED_USER': None,
}

# MongoDB Configuration via MongoEngine
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017/')
IS_TESTING = 'test' in sys.argv or 'pytest' in sys.modules or os.getenv('DJANGO_TEST', 'False').lower() == 'true'

if IS_TESTING:
    MONGO_DB = os.getenv('MONGO_TEST_DB', os.getenv('MONGO_DB', 'team_task_tracker') + '_test')
else:
    MONGO_DB = os.getenv('MONGO_DB', 'team_task_tracker')

mongoengine.connect(
    db=MONGO_DB,
    host=MONGO_URI,
    alias='default',
    uuidRepresentation='standard',
)


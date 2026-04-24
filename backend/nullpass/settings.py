"""
Django settings for nullpass.
"""

from pathlib import Path
import os
from urllib.parse import parse_qs, unquote, urlparse

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

ENV_FILE = BASE_DIR / 'nullpass' / '.env'
ENV_VALUES = {}
if ENV_FILE.exists():
    with ENV_FILE.open() as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            ENV_VALUES[key.strip()] = value.strip()


def env(name, default=None, cast=str):
    value = ENV_VALUES.get(name, os.environ.get(name, default))
    if value is None:
        return None

    if cast is bool:
        normalized = str(value).strip().lower()
        truthy = {'1', 'true', 't', 'yes', 'y', 'on', 'debug', 'dev', 'development'}
        falsy = {'0', 'false', 'f', 'no', 'n', 'off', 'release', 'prod', 'production', ''}
        if normalized in truthy:
            return True
        if normalized in falsy:
            return False
        raise ValueError(f'Invalid boolean value for {name}: {value}')

    if cast in (None, str):
        return str(value)
    return cast(value)


def env_list(name, default=''):
    value = env(name, default=default)
    return [item.strip() for item in value.split(',') if item.strip()]


def env_path(name, default):
    value = Path(env(name, default=default))
    if value.is_absolute():
        return value
    return (BASE_DIR / value).resolve()


def env_path_list(name, default=''):
    paths = []
    for item in env_list(name, default=default):
        path_item = Path(item)
        if not path_item.is_absolute():
            path_item = (BASE_DIR / path_item).resolve()
        paths.append(str(path_item))
    return paths


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-this-in-production-123456789')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', default='localhost,127.0.0.1')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    
    # Custom apps
    'authenticate',
    'dashboard',
    #'blockchain_audit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware at the top
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'nullpass.urls'

TEMPLATE_DIRS = env_path_list('TEMPLATE_DIRS', default='../frontend')

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': TEMPLATE_DIRS,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'nullpass.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DB_ENGINE = env('DB_ENGINE', default='sqlite3').strip().lower()
DB_NAME = env('DB_NAME', default='db.sqlite3')
DB_USER = env('DB_USER', default='')
DB_PASSWORD = env('DB_PASSWORD', default='')
DB_HOST = env('DB_HOST', default='localhost')
DB_PORT = env('DB_PORT', default='5432')
DATABASE_URL = env('DATABASE_URL', default='').strip()
DB_CONN_MAX_AGE = env('DB_CONN_MAX_AGE', default=60, cast=int)
DB_ATOMIC_REQUESTS = env('DB_ATOMIC_REQUESTS', default=False, cast=bool)


def resolve_db_name(db_name):
    if DB_ENGINE == 'sqlite3' and db_name != ':memory:' and not os.path.isabs(db_name):
        return str((BASE_DIR / db_name).resolve())
    return db_name


DB_NAME = resolve_db_name(DB_NAME)

def database_from_url(database_url):
    parsed = urlparse(database_url)
    raw_scheme = parsed.scheme.lower()
    scheme = raw_scheme.split('+', 1)[0]

    engine_by_scheme = {
        'postgres': 'django.db.backends.postgresql',
        'postgresql': 'django.db.backends.postgresql',
        'mysql': 'django.db.backends.mysql',
        'mysql2': 'django.db.backends.mysql',
        'sqlite': 'django.db.backends.sqlite3',
    }
    if scheme not in engine_by_scheme:
        raise ValueError(f'Unsupported DATABASE_URL scheme: {raw_scheme}')

    engine = engine_by_scheme[scheme]
    config = {'ENGINE': engine}

    if scheme == 'sqlite':
        if parsed.path in ('', '/'):
            db_name = ':memory:'
        else:
            db_name = unquote(parsed.path.lstrip('/'))
            if not os.path.isabs(db_name) and db_name != ':memory:':
                db_name = str((BASE_DIR / db_name).resolve())
        config['NAME'] = db_name
    else:
        config.update({
            'NAME': unquote(parsed.path.lstrip('/')),
            'USER': unquote(parsed.username or ''),
            'PASSWORD': unquote(parsed.password or ''),
            'HOST': parsed.hostname or '',
            'PORT': str(parsed.port or ''),
        })

        query = parse_qs(parsed.query, keep_blank_values=True)
        if query:
            config['OPTIONS'] = {key: values[-1] if values else '' for key, values in query.items()}

    config['CONN_MAX_AGE'] = DB_CONN_MAX_AGE
    config['ATOMIC_REQUESTS'] = DB_ATOMIC_REQUESTS
    return config


if DATABASE_URL:
    DATABASES = {'default': database_from_url(DATABASE_URL)}
elif DB_ENGINE in ('postgres', 'postgresql'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
            'CONN_MAX_AGE': DB_CONN_MAX_AGE,
            'ATOMIC_REQUESTS': DB_ATOMIC_REQUESTS,
        }
    }
elif DB_ENGINE in ('mysql', 'mysql2'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': DB_NAME,
            'USER': DB_USER,
            'PASSWORD': DB_PASSWORD,
            'HOST': DB_HOST,
            'PORT': DB_PORT,
            'CONN_MAX_AGE': DB_CONN_MAX_AGE,
            'ATOMIC_REQUESTS': DB_ATOMIC_REQUESTS,
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': DB_NAME,
            'CONN_MAX_AGE': DB_CONN_MAX_AGE,
            'ATOMIC_REQUESTS': DB_ATOMIC_REQUESTS,
        }
    }

# Example .env settings:
# DB_ENGINE=sqlite3
# DB_NAME=/path/to/db.sqlite3
#
# DB_ENGINE=postgresql
# DB_NAME=your_database
# DB_USER=your_user
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = env('LANGUAGE_CODE', default='en-us')

TIME_ZONE = env('TIME_ZONE', default='UTC')

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = env('STATIC_URL', default='/assets/')
STATICFILES_DIRS = env_path_list('STATICFILES_DIRS', default='../frontend/dist/assets')
STATIC_ROOT = env_path('STATIC_ROOT', default='staticfiles')

# Media files (user uploaded files)
MEDIA_URL = env('MEDIA_URL', default='/media/')
MEDIA_ROOT = env_path('MEDIA_ROOT', default='media')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = env('DEFAULT_AUTO_FIELD', default='django.db.models.BigAutoField')


# ============================================================================
# CORS CONFIGURATION
# ============================================================================

CORS_ALLOW_ALL_ORIGINS = env('CORS_ALLOW_ALL_ORIGINS', default=False, cast=bool)
CORS_ALLOW_CREDENTIALS = env('CORS_ALLOW_CREDENTIALS', default=True, cast=bool)
CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000,http://localhost:4000,http://127.0.0.1:4000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000',
)

CORS_ALLOW_METHODS = env_list(
    'CORS_ALLOW_METHODS',
    default='DELETE,GET,OPTIONS,PATCH,POST,PUT',
)
CORS_ALLOW_HEADERS = env_list(
    'CORS_ALLOW_HEADERS',
    default='accept,accept-encoding,authorization,content-type,dnt,origin,user-agent,x-csrftoken,x-requested-with',
)
CORS_ALLOWED_ORIGIN_REGEXES = env_list(
    'CORS_ALLOWED_ORIGIN_REGEXES',
    default=r'^http://192\.168\.\d{1,3}\.\d{1,3}$,^http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}$,^http://172\.\d{1,3}\.\d{1,3}\.\d{1,3}$',
)
CSRF_TRUSTED_ORIGINS = env_list(
    'CSRF_TRUSTED_ORIGINS',
    default='http://localhost:8000,http://127.0.0.1:8000,http://localhost:4000,http://localhost:5173,http://127.0.0.1:5173',
)


# ============================================================================
# DJANGO REST FRAMEWORK CONFIGURATION
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}


# ============================================================================
# NULLPASS CUSTOM SETTINGS
# ============================================================================

# Frontend Configuration
FRONTEND_BASE_URL = env('FRONTEND_BASE_URL', default='http://localhost:5173')

# JWT Configuration
JWT_SECRET_KEY = env('JWT_SECRET_KEY', default='nullpass-jwt-secret-key-change-this-in-production')
JWT_ALGORITHM = env('JWT_ALGORITHM', default='HS256')
JWT_EXPIRATION_HOURS = env('JWT_EXPIRATION_HOURS', default=24, cast=int)

# Challenge Configuration
CHALLENGE_EXPIRATION_MINUTES = env('CHALLENGE_EXPIRATION_MINUTES', default=5, cast=int)
ENROLLMENT_CHALLENGE_EXPIRATION_MINUTES = env('ENROLLMENT_CHALLENGE_EXPIRATION_MINUTES', default=10, cast=int)

# Security Configuration
MAX_FAILED_ATTEMPTS = env('MAX_FAILED_ATTEMPTS', default=5, cast=int)
DEVICE_FLAG_THRESHOLD = env('DEVICE_FLAG_THRESHOLD', default=5, cast=int)

# Blockchain Configuration (Optional)
BLOCKCHAIN_ENABLED = env('BLOCKCHAIN_ENABLED', default=False, cast=bool)
BLOCKCHAIN_NETWORK = env('BLOCKCHAIN_NETWORK', default='sepolia')
BLOCKCHAIN_RPC_URL = env('BLOCKCHAIN_RPC_URL', default='https://sepolia.infura.io/v3/YOUR_INFURA_KEY')
BLOCKCHAIN_CONTRACT_ADDRESS = env('BLOCKCHAIN_CONTRACT_ADDRESS', default='')
BLOCKCHAIN_PRIVATE_KEY = env('BLOCKCHAIN_PRIVATE_KEY', default='')

# QR Code Configuration
QR_CODE_VERSION = env('QR_CODE_VERSION', default=1, cast=int)
QR_CODE_BOX_SIZE = env('QR_CODE_BOX_SIZE', default=10, cast=int)
QR_CODE_BORDER = env('QR_CODE_BORDER', default=4, cast=int)


# ============================================================================
# SECURITY SETTINGS (for production)
# ============================================================================

SECURE_SSL_REDIRECT = env('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = env('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = env('CSRF_COOKIE_SECURE', default=False, cast=bool)
SECURE_CONTENT_TYPE_NOSNIFF = env('SECURE_CONTENT_TYPE_NOSNIFF', default=True, cast=bool)
X_FRAME_OPTIONS = env('X_FRAME_OPTIONS', default='DENY')
SECURE_HSTS_SECONDS = env('SECURE_HSTS_SECONDS', default=0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False, cast=bool)
SECURE_HSTS_PRELOAD = env('SECURE_HSTS_PRELOAD', default=False, cast=bool)


# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOG_LEVEL = env('LOG_LEVEL', default='INFO').upper()
SECURITY_LOG_LEVEL = env('SECURITY_LOG_LEVEL', default='WARNING').upper()

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': LOG_LEVEL,
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'nullpass.log',
            'formatter': 'verbose',
        },
        'security_file': {
            'level': SECURITY_LOG_LEVEL,
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': LOG_LEVEL,
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': True,
        },
        'authenticate': {
            'handlers': ['console', 'security_file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'dashboard': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
        'blockchain_audit': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
if not LOGS_DIR.exists():
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

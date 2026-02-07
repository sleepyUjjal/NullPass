"""
Utility functions for NullPass authentication system.
Includes cryptographic helpers, JWT token management, and request utilities.
"""

import secrets
import base64
import jwt
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from ecdsa import VerifyingKey, SECP256k1, BadSignatureError

logger = logging.getLogger('authenticate')


# ============================================================================
# RANDOM STRING GENERATION
# ============================================================================

def generate_random_string(length=32):
    """
    Generate a cryptographically secure random string.
    
    Args:
        length (int): Length of the random string
    
    Returns:
        str: URL-safe random string
    """
    return secrets.token_urlsafe(length)


def generate_challenge_nonce():
    """
    Generate a unique challenge ID and nonce for authentication.
    
    Returns:
        dict: Dictionary containing challenge_id and nonce
    """
    return {
        'challenge_id': generate_random_string(32),
        'nonce': generate_random_string(32)
    }


# ============================================================================
# JWT TOKEN MANAGEMENT
# ============================================================================

def create_jwt_token(device_id, session_id):
    """
    Create a JWT token for authenticated sessions.
    
    Args:
        device_id (str): Unique device identifier
        session_id (str): Unique session identifier
    
    Returns:
        str: Encoded JWT token
    """
    now = timezone.now()
    expiration_hours = settings.JWT_EXPIRATION_HOURS
    
    payload = {
        'device_id': device_id,
        'session_id': session_id,
        'issued_at': int(now.timestamp()),
        'expires_at': int((now + timedelta(hours=expiration_hours)).timestamp()),
        'iss': 'nullpass',  # Issuer
        'iat': int(now.timestamp()),  # Issued at
        'exp': int((now + timedelta(hours=expiration_hours)).timestamp())  # Expiration
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    logger.info(f"JWT token created for device: {device_id}")
    
    return token


def decode_jwt_token(token):
    """
    Decode and validate a JWT token.
    
    Args:
        token (str): JWT token to decode
    
    Returns:
        tuple: (payload dict, error message)
               Returns (None, error_message) if token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        logger.info(f"JWT token decoded successfully for device: {payload.get('device_id')}")
        
        return payload, None
    
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        return None, 'Token expired'
    
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {str(e)}")
        return None, 'Invalid token'
    
    except Exception as e:
        logger.error(f"JWT decode error: {str(e)}")
        return None, str(e)


def verify_jwt_token(token):
    """
    Verify if JWT token is valid.
    
    Args:
        token (str): JWT token to verify
    
    Returns:
        bool: True if valid, False otherwise
    """
    payload, error = decode_jwt_token(token)
    return payload is not None


# ============================================================================
# ECDSA SIGNATURE VERIFICATION
# ============================================================================

def verify_ecdsa_signature(public_key_pem, message, signature_base64):
    """
    Verify ECDSA signature using public key.
    """
    try:
        import hashlib
        from ecdsa.util import sigdecode_der, sigdecode_string
        
        # Load the public key
        verifying_key = VerifyingKey.from_pem(public_key_pem)
        
        # Decode the signature
        signature_bytes = base64.b64decode(signature_base64)
        
        # Encode message to bytes
        message_bytes = message.encode('utf-8')
        
        # REMOVED: message_hash = hashlib.sha256(message_bytes).digest()
        # REASON: The verify function below will hash the data for us because we passed hashfunc
        
        try:
            # Try DER format (ASN.1 encoded)
            verifying_key.verify(
                signature_bytes, 
                message_bytes,  # <--- Pass raw bytes here
                hashfunc=hashlib.sha256,
                sigdecode=sigdecode_der
            )
            logger.info("Signature verification successful (DER format)")
            return True, None
        except:
            # Try raw format
            try:
                verifying_key.verify(
                    signature_bytes,
                    message_bytes, # <--- Pass raw bytes here
                    hashfunc=hashlib.sha256,
                    sigdecode=sigdecode_string
                )
                logger.info("Signature verification successful (raw format)")
                return True, None
            except:
                pass
        
        logger.warning("Invalid signature detected")
        return False, 'Invalid signature - signature verification failed'
    
    except BadSignatureError:
        logger.warning("Invalid signature detected")
        return False, 'Invalid signature - signature verification failed'
    
    except base64.binascii.Error:
        logger.warning("Invalid base64 signature format")
        return False, 'Invalid signature format - not valid base64'
    
    except Exception as e:
        logger.error(f"Signature verification error: {str(e)}")
        return False, f'Signature verification error: {str(e)}'


def validate_public_key_format(public_key_pem):
    """
    Validate if the public key is in correct PEM format.
    
    Args:
        public_key_pem (str): Public key in PEM format
    
    Returns:
        tuple: (is_valid bool, error_message str)
    """
    try:
        # Try to load the key - if it fails, format is invalid
        VerifyingKey.from_pem(public_key_pem)
        return True, None
    
    except Exception as e:
        logger.warning(f"Invalid public key format: {str(e)}")
        return False, f'Invalid public key format: {str(e)}'


# ============================================================================
# REQUEST METADATA HELPERS
# ============================================================================

def get_client_ip(request):
    """
    Get the real client IP address from request.
    Handles proxy headers like X-Forwarded-For.
    
    Args:
        request: Django HttpRequest object
    
    Returns:
        str: Client IP address
    """
    # Check for X-Forwarded-For header (used by proxies/load balancers)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    
    if x_forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        # Fallback to REMOTE_ADDR
        ip = request.META.get('REMOTE_ADDR')
    
    return ip


def get_user_agent(request):
    """
    Get the user agent string from request.
    
    Args:
        request: Django HttpRequest object
    
    Returns:
        str: User agent string
    """
    return request.META.get('HTTP_USER_AGENT', '')


def get_request_metadata(request):
    """
    Extract common metadata from request.
    
    Args:
        request: Django HttpRequest object
    
    Returns:
        dict: Dictionary containing ip_address and user_agent
    """
    return {
        'ip_address': get_client_ip(request),
        'user_agent': get_user_agent(request)
    }


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_device_id(device_id):
    """
    Validate device ID format.
    
    Args:
        device_id (str): Device identifier
    
    Returns:
        tuple: (is_valid bool, error_message str)
    """
    if not device_id:
        return False, 'Device ID is required'
    
    if len(device_id) < 8:
        return False, 'Device ID too short (minimum 8 characters)'
    
    if len(device_id) > 64:
        return False, 'Device ID too long (maximum 64 characters)'
    
    return True, None


def validate_signature_format(signature_base64):
    """
    Validate signature is in correct base64 format.
    
    Args:
        signature_base64 (str): Base64-encoded signature
    
    Returns:
        tuple: (is_valid bool, error_message str)
    """
    if not signature_base64:
        return False, 'Signature is required'
    
    try:
        # Try to decode base64
        base64.b64decode(signature_base64)
        return True, None
    
    except Exception as e:
        return False, f'Invalid signature format: {str(e)}'


# ============================================================================
# SECURITY HELPERS
# ============================================================================

def is_suspicious_activity(ip_address, event_count, time_window_minutes=10):
    """
    Check if there's suspicious activity from an IP address.
    
    Args:
        ip_address (str): IP address to check
        event_count (int): Number of events in time window
        time_window_minutes (int): Time window in minutes
    
    Returns:
        bool: True if activity is suspicious
    """
    # If more than 10 failed attempts in 10 minutes, it's suspicious
    threshold = 10
    
    return event_count >= threshold


def calculate_trust_level(failed_attempts, total_attempts):
    """
    Calculate trust level based on authentication history.
    
    Args:
        failed_attempts (int): Number of failed attempts
        total_attempts (int): Total number of attempts
    
    Returns:
        str: Trust level ('High', 'Medium', 'Low')
    """
    if total_attempts == 0:
        return 'High'
    
    failure_rate = failed_attempts / total_attempts
    
    if failure_rate == 0:
        return 'High'
    elif failure_rate < 0.1:  # Less than 10% failure
        return 'Medium'
    else:
        return 'Low'


# ============================================================================
# FORMATTING HELPERS
# ============================================================================

def format_timestamp(dt):
    """
    Format datetime object to ISO 8601 string.
    
    Args:
        dt (datetime): Datetime object
    
    Returns:
        str: ISO formatted timestamp
    """
    if dt is None:
        return None
    
    return dt.isoformat()


def truncate_string(text, max_length=50):
    """
    Truncate string to maximum length with ellipsis.
    
    Args:
        text (str): Text to truncate
        max_length (int): Maximum length
    
    Returns:
        str: Truncated text
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length-3] + '...'


# ============================================================================
# LOGGING HELPERS
# ============================================================================

def log_security_event(event_type, device_id=None, success=True, details=''):
    """
    Log a security event with consistent formatting.
    
    Args:
        event_type (str): Type of security event
        device_id (str): Device identifier (optional)
        success (bool): Whether event was successful
        details (str): Additional details
    """
    device_info = f"Device: {device_id}" if device_id else "No device"
    status = "SUCCESS" if success else "FAILED"
    
    logger.info(f"[{event_type}] {status} - {device_info} - {details}")


def log_authentication_attempt(device_id, ip_address, success, reason=''):
    """
    Log authentication attempt with details.
    
    Args:
        device_id (str): Device identifier
        ip_address (str): Client IP address
        success (bool): Whether authentication succeeded
        reason (str): Reason for failure (if applicable)
    """
    status = "SUCCESS" if success else "FAILED"
    message = f"Authentication {status} - Device: {device_id} - IP: {ip_address}"
    
    if not success and reason:
        message += f" - Reason: {reason}"
    
    if success:
        logger.info(message)
    else:
        logger.warning(message)
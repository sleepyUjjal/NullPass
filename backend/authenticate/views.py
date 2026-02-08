"""
API Views for NullPass authentication system.
Handles device enrollment, login requests, signature verification, and session management.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import json
import qrcode
import io
import base64
import logging

from .models import TrustedDevice, AuthenticationChallenge, AuthenticationEvent, UserSession
from .utils import (
    generate_challenge_nonce,
    create_jwt_token,
    decode_jwt_token,
    verify_ecdsa_signature,
    validate_public_key_format,
    get_client_ip,
    get_user_agent,
    get_request_metadata,
    validate_device_id,
    log_security_event,
    log_authentication_attempt
)

logger = logging.getLogger('authentication')


# ============================================================================
# DEVICE ENROLLMENT
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def enroll_device(request):
    """
    Enroll a new trusted device in the NullPass system.
    
    Request Body:
        {
            "device_id": "unique-device-identifier",
            "public_key": "-----BEGIN PUBLIC KEY-----...",
            "device_name": "My Phone"
        }
    
    Returns:
        {
            "success": true,
            "message": "Device enrolled successfully",
            "device_id": "unique-device-identifier",
            "device_name": "My Phone"
        }
    """
    try:
        # Parse request body
        data = json.loads(request.body)
        device_id = data.get('device_id')
        public_key_pem = data.get('public_key')
        device_name = data.get('device_name', 'Unnamed Device')
        
        # Validate required fields
        if not device_id or not public_key_pem:
            logger.warning("Enrollment failed: Missing required fields")
            return JsonResponse({
                'success': False,
                'error': 'Missing required fields: device_id and public_key are required'
            }, status=400)
        
        # Validate device_id format
        is_valid, error = validate_device_id(device_id)
        if not is_valid:
            logger.warning(f"Enrollment failed: {error}")
            return JsonResponse({
                'success': False,
                'error': error
            }, status=400)
        
        # Check if device already exists
        if TrustedDevice.objects.filter(device_id=device_id).exists():
            logger.warning(f"Enrollment failed: Device {device_id} already enrolled")
            return JsonResponse({
                'success': False,
                'error': 'Device already enrolled. Use a different device_id.'
            }, status=400)
        
        # Validate public key format
        is_valid, error = validate_public_key_format(public_key_pem)
        if not is_valid:
            logger.warning(f"Enrollment failed: Invalid public key format - {error}")
            return JsonResponse({
                'success': False,
                'error': f'Invalid public key format: {error}'
            }, status=400)
        
        # Create new trusted device
        device = TrustedDevice.objects.create(
            device_id=device_id,
            public_key=public_key_pem,
            device_name=device_name
        )
        
        # Get request metadata
        metadata = get_request_metadata(request)
        
        # Log enrollment event
        event = AuthenticationEvent.objects.create(
            event_type='ENROLLMENT',
            device=device,
            success=True,
            ip_address=metadata['ip_address'],
            user_agent=metadata['user_agent']
        )
        
        # Optional: Log to blockchain
        event.log_to_blockchain()
        
        log_security_event('ENROLLMENT', device_id, True, f"Device '{device_name}' enrolled")
        
        return JsonResponse({
            'success': True,
            'message': 'Device enrolled successfully',
            'device_id': device_id,
            'device_name': device_name
        }, status=201)
    
    except json.JSONDecodeError:
        logger.error("Enrollment failed: Invalid JSON")
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    
    except Exception as e:
        logger.error(f"Enrollment error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, status=500)


# ============================================================================
# LOGIN REQUEST (QR CODE GENERATION)
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def request_login(request):
    """
    Generate a new authentication challenge and QR code for login.
    
    Returns:
        {
            "success": true,
            "challenge_id": "unique-challenge-id",
            "qr_code": "data:image/png;base64,...",
            "expires_in": 300
        }
    """
    try:
        # Generate unique challenge and nonce
        challenge_data = generate_challenge_nonce()
        challenge_id = challenge_data['challenge_id']
        nonce = challenge_data['nonce']
        
        # Get request metadata
        metadata = get_request_metadata(request)
        
        # Create challenge record in database
        challenge = AuthenticationChallenge.objects.create(
            challenge_id=challenge_id,
            nonce=nonce,
            ip_address=metadata['ip_address']
        )
        
        # Build challenge URL for mobile device (for LOGIN)
        base_url = request.build_absolute_uri('/authenticate')
        challenge_url = f"{base_url}?challenge_id={challenge_id}&nonce={nonce}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=settings.QR_CODE_VERSION,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=settings.QR_CODE_BOX_SIZE,
            border=settings.QR_CODE_BORDER,
        )
        qr.add_data(challenge_url)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert image to base64 string
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        logger.info(f"Login request created: {challenge_id}")
        
        return JsonResponse({
            'success': True,
            'challenge_id': challenge_id,
            'qr_code': f'data:image/png;base64,{img_base64}',
            'expires_in': settings.CHALLENGE_EXPIRATION_MINUTES * 60  # Convert to seconds
        })
    
    except Exception as e:
        logger.error(f"Login request error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Failed to generate login challenge: {str(e)}'
        }, status=500)


# ============================================================================
# ENROLLMENT QR CODE GENERATION
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def request_enrollment(request):
    """
    Generate a QR code for device enrollment (no challenge needed).
    
    Returns:
        {
            "success": true,
            "qr_code": "data:image/png;base64,...",
            "enrollment_url": "https://..."
        }
    """
    try:
        # Build enrollment URL
        base_url = request.build_absolute_uri('/authenticate')
        enrollment_url = f"{base_url}?action=enroll"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=settings.QR_CODE_VERSION,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=settings.QR_CODE_BOX_SIZE,
            border=settings.QR_CODE_BORDER,
        )
        qr.add_data(enrollment_url)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert image to base64 string
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        logger.info("Enrollment QR code generated")
        
        return JsonResponse({
            'success': True,
            'qr_code': f'data:image/png;base64,{img_base64}',
            'enrollment_url': enrollment_url
        })
    
    except Exception as e:
        logger.error(f"Enrollment QR generation error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Failed to generate enrollment QR: {str(e)}'
        }, status=500)


# ============================================================================
# SIGNATURE VERIFICATION (AUTHENTICATION)
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def verify_signature(request):
    """
    Verify the cryptographic signature from a trusted device.
    
    Request Body:
        {
            "challenge_id": "unique-challenge-id",
            "device_id": "unique-device-identifier",
            "signature": "base64-encoded-signature"
        }
    
    Returns:
        {
            "success": true,
            "message": "Authentication successful",
            "session_token": "jwt-token",
            "redirect": "/dashboard"
        }
    """
    try:
        # Parse request body
        data = json.loads(request.body)
        challenge_id = data.get('challenge_id')
        device_id = data.get('device_id')
        signature_base64 = data.get('signature')
        
        # Get request metadata
        metadata = get_request_metadata(request)
        
        # Validate required fields
        if not all([challenge_id, device_id, signature_base64]):
            logger.warning("Signature verification failed: Missing required fields")
            return JsonResponse({
                'success': False,
                'error': 'Missing required fields: challenge_id, device_id, and signature are required'
            }, status=400)
        
        # Get challenge from database
        try:
            challenge = AuthenticationChallenge.objects.get(challenge_id=challenge_id)
        except AuthenticationChallenge.DoesNotExist:
            logger.warning(f"Signature verification failed: Invalid challenge {challenge_id}")
            return JsonResponse({
                'success': False,
                'error': 'Invalid challenge ID'
            }, status=404)
        
        # Check if challenge has already been used (replay attack detection)
        if challenge.is_used:
            device = challenge.device if challenge.device else None
            
            # Log replay attack
            AuthenticationEvent.objects.create(
                event_type='REPLAY_ATTACK',
                device=device,
                success=False,
                ip_address=metadata['ip_address'],
                user_agent=metadata['user_agent'],
                failure_reason='Challenge already used - replay attack detected',
                attack_type='Replay Attack'
            ).log_to_blockchain()
            
            log_security_event('REPLAY_ATTACK', device_id, False, 'Challenge reuse detected')
            
            return JsonResponse({
                'success': False,
                'error': 'Challenge already used (replay attack detected)',
                'threat_level': 'high',
                'redirect': '/threat-alert'
            }, status=403)
        
        # Check if challenge has expired
        if challenge.check_expired():
            # Log expired challenge
            AuthenticationEvent.objects.create(
                event_type='EXPIRED_CHALLENGE',
                success=False,
                ip_address=metadata['ip_address'],
                user_agent=metadata['user_agent'],
                failure_reason='Challenge expired'
            )
            
            logger.warning(f"Challenge {challenge_id} expired")
            
            return JsonResponse({
                'success': False,
                'error': 'Challenge expired. Please request a new QR code.'
            }, status=403)
        
        # Get device from database
        try:
            device = TrustedDevice.objects.get(device_id=device_id)
        except TrustedDevice.DoesNotExist:
            # Log unregistered device attempt
            AuthenticationEvent.objects.create(
                event_type='UNREGISTERED_DEVICE',
                success=False,
                ip_address=metadata['ip_address'],
                user_agent=metadata['user_agent'],
                failure_reason=f'Device {device_id} not registered',
                attack_type='Unauthorized Device'
            ).log_to_blockchain()
            
            log_security_event('UNREGISTERED_DEVICE', device_id, False, 'Unregistered device attempt')
            
            return JsonResponse({
                'success': False,
                'error': 'Device not registered. Please enroll your device first.',
                'redirect': '/threat-alert'
            }, status=403)
        
        # Check if device is active
        if not device.is_active:
            logger.warning(f"Device {device_id} is deactivated")
            return JsonResponse({
                'success': False,
                'error': 'Device has been deactivated. Please contact support.'
            }, status=403)
        
        # Check if device is flagged for suspicious activity
        if device.is_flagged:
            logger.warning(f"Device {device_id} is flagged")
            return JsonResponse({
                'success': False,
                'error': 'Device has been flagged for suspicious activity. Please contact support.'
            }, status=403)
        
        # Verify cryptographic signature
        message = challenge_id + challenge.nonce
        is_valid, error = verify_ecdsa_signature(
            device.public_key,
            message,
            signature_base64
        )
        
        if not is_valid:
            # Increment failed attempts counter
            device.increment_failed_attempts()
            
            # Log invalid signature event
            AuthenticationEvent.objects.create(
                event_type='INVALID_SIGNATURE',
                device=device,
                success=False,
                ip_address=metadata['ip_address'],
                user_agent=metadata['user_agent'],
                failure_reason=error,
                attack_type='Signature Forgery Attempt'
            ).log_to_blockchain()
            
            log_authentication_attempt(device_id, metadata['ip_address'], False, error)
            
            return JsonResponse({
                'success': False,
                'error': 'Invalid signature. Authentication failed.',
                'redirect': '/threat-alert'
            }, status=403)
        
        # ✅ AUTHENTICATION SUCCESSFUL!
        
        # Mark challenge as used
        challenge.mark_as_used(device)
        
        # Reset failed attempts counter
        device.reset_failed_attempts()
        
        # Update device last used timestamp
        device.update_last_used()
        
        # Create session
        from .utils import generate_random_string
        session_id = generate_random_string(32)
        session_token = create_jwt_token(device_id, session_id)
        
        session = UserSession.objects.create(
            session_id=session_id,
            session_token=session_token,
            device=device,
            ip_address=metadata['ip_address'],
            user_agent=metadata['user_agent']
        )
        
        # Log successful authentication
        AuthenticationEvent.objects.create(
            event_type='LOGIN_SUCCESS',
            device=device,
            success=True,
            ip_address=metadata['ip_address'],
            user_agent=metadata['user_agent']
        ).log_to_blockchain()
        
        log_authentication_attempt(device_id, metadata['ip_address'], True)
        
        response = JsonResponse({
            'success': True,
            'message': 'Authentication successful',
            'session_token': session_token,
            'device_name': device.device_name,
            'redirect': '/dashboard'
        })

        # Store JWT in HttpOnly cookie to avoid localStorage usage on the dashboard
        cookie_kwargs = {
            'httponly': True,
            'samesite': 'Lax',
            'secure': False  # set True when serving over HTTPS
        }
        response.set_cookie('session_token', session_token, **cookie_kwargs)
        return response
    
    except json.JSONDecodeError:
        logger.error("Signature verification failed: Invalid JSON")
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON format'
        }, status=400)
    
    except Exception as e:
        logger.error(f"Signature verification error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, status=500)


# ============================================================================
# CHALLENGE STATUS CHECK
# ============================================================================

@require_http_methods(["GET"])
def check_challenge_status(request):
    """
    Check the status of an authentication challenge (for polling).
    
    Query Parameters:
        challenge_id: The unique challenge identifier
    
    Returns:
        {
            "is_used": false,
            "is_expired": false,
            "authenticated": false
        }
    """
    challenge_id = request.GET.get('challenge_id')
    
    if not challenge_id:
        return JsonResponse({
            'error': 'Missing challenge_id parameter'
        }, status=400)
    
    try:
        challenge = AuthenticationChallenge.objects.get(challenge_id=challenge_id)
        
        return JsonResponse({
            'is_used': challenge.is_used,
            'is_expired': challenge.check_expired(),
            'authenticated': challenge.is_used and challenge.device is not None
        })
    
    except AuthenticationChallenge.DoesNotExist:
        return JsonResponse({
            'error': 'Challenge not found'
        }, status=404)


# ============================================================================
# SESSION VALIDATION
# ============================================================================

@csrf_exempt
@require_http_methods(["POST", "GET"])
def validate_session(request):
    """
    Validate a JWT session token.
    
    Headers:
        Authorization: Bearer <token>
    
    OR Cookie:
        session_token: <token>
    
    Returns:
        {
            "authenticated": true,
            "device_id": "unique-device-identifier",
            "device_name": "My Phone",
            "session_id": "unique-session-id"
        }
    """
    # Extract token from Authorization header or cookie
    auth_header = request.headers.get('Authorization', '')
    
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
    else:
        token = request.COOKIES.get('session_token')
    
    if not token:
        return JsonResponse({
            'authenticated': False,
            'error': 'No authentication token provided'
        }, status=401)
    
    # Decode JWT token
    payload, error = decode_jwt_token(token)
    
    if error:
        return JsonResponse({
            'authenticated': False,
            'error': error
        }, status=401)
    
    # Check if session exists in database
    try:
        session = UserSession.objects.get(
            session_token=token,
            is_active=True
        )
        
        # Check if session has expired
        if session.is_expired():
            session.terminate()
            return JsonResponse({
                'authenticated': False,
                'error': 'Session expired'
            }, status=401)
        
        # Session is valid
        return JsonResponse({
            'authenticated': True,
            'device_id': session.device.device_id,
            'device_name': session.device.device_name,
            'session_id': session.session_id
        })
    
    except UserSession.DoesNotExist:
        return JsonResponse({
            'authenticated': False,
            'error': 'Session not found'
        }, status=401)


# ============================================================================
# LOGOUT (CLEAR SESSION COOKIE)
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    """
    Terminate the current session and clear the session cookie.
    """
    # Extract token from Authorization header or cookie
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
    else:
        token = request.COOKIES.get('session_token')

    if token:
        try:
            session = UserSession.objects.get(session_token=token, is_active=True)
            session.terminate()
        except UserSession.DoesNotExist:
            pass

    response = JsonResponse({'success': True, 'message': 'Logged out'})
    response.delete_cookie('session_token')
    return response

@csrf_exempt
def validate_session(request):
    """
    Checks if the session_token cookie is valid.
    Used by the Frontend Navbar to toggle Login/Logout buttons.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    # 1. Get Token from Cookie
    token = request.COOKIES.get('session_token')
    if not token:
        return JsonResponse({'authenticated': False}, status=200)

    # 2. Decode Token
    payload, error = decode_jwt_token(token)
    if error:
        return JsonResponse({'authenticated': False, 'error': error}, status=200)

    # 3. Check if Session exists in DB and is Active
    try:
        session = UserSession.objects.get(
            session_id=payload['session_id'],
            is_active=True
        )
        
        # Success!
        return JsonResponse({
            'authenticated': True,
            'device_name': session.device.device_name,
            'session_id': session.session_id
        })

    except UserSession.DoesNotExist:
        return JsonResponse({'authenticated': False}, status=200)
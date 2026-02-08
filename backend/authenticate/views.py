"""
API Views for NullPass authentication system.
Handles device enrollment, login requests, signature verification, and session management.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
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
    get_request_metadata,
    validate_device_id,
    log_security_event,
    log_authentication_attempt
)

logger = logging.getLogger('authentication')

# ============================================================================
# CONFIGURATION
# ============================================================================

# This points QR codes to your React Frontend (Port 5173)
FRONTEND_BASE_URL = "http://localhost:5173"


# ============================================================================
# DEVICE ENROLLMENT
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def enroll_device(request):
    """
    Enroll a new trusted device in the NullPass system.
    """
    try:
        data = json.loads(request.body)
        device_id = data.get('device_id')
        public_key_pem = data.get('public_key')
        device_name = data.get('device_name', 'Unnamed Device')
        
        if not device_id or not public_key_pem:
            return JsonResponse({'success': False, 'error': 'Missing required fields'}, status=400)
        
        # Check if device already exists
        if TrustedDevice.objects.filter(device_id=device_id).exists():
            return JsonResponse({'success': False, 'error': 'Device already enrolled'}, status=400)
        
        # Create new trusted device
        device = TrustedDevice.objects.create(
            device_id=device_id,
            public_key=public_key_pem,
            device_name=device_name
        )
        
        metadata = get_request_metadata(request)
        AuthenticationEvent.objects.create(
            event_type='ENROLLMENT',
            device=device,
            success=True,
            ip_address=metadata['ip_address'],
            user_agent=metadata['user_agent']
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Device enrolled successfully',
            'device_id': device_id
        }, status=201)
    
    except Exception as e:
        logger.error(f"Enrollment error: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ============================================================================
# LOGIN REQUEST (QR CODE GENERATION)
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def request_login(request):
    """
    Generate a new authentication challenge and QR code for login.
    """
    try:
        # 1. Generate Challenge
        challenge_data = generate_challenge_nonce()
        challenge_id = challenge_data['challenge_id']
        nonce = challenge_data['nonce']
        
        metadata = get_request_metadata(request)
        
        AuthenticationChallenge.objects.create(
            challenge_id=challenge_id,
            nonce=nonce,
            ip_address=metadata['ip_address'],
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        
        # 2. Build URL pointing to FRONTEND (5173)
        # This fixes the "Click to Simulate" link
        auth_url = f"{FRONTEND_BASE_URL}/authenticate?challenge_id={challenge_id}&nonce={nonce}"
        
        # 3. Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(auth_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return JsonResponse({
            'success': True,
            'challenge_id': challenge_id,
            'nonce': nonce,          # Required for simulation
            'qr_code': f'data:image/png;base64,{img_base64}',
            'auth_url': auth_url
        })
    
    except Exception as e:
        logger.error(f"Login request error: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ============================================================================
# ENROLLMENT QR CODE GENERATION
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def request_enrollment(request):
    """
    Generate a QR code for device enrollment.
    """
    try:
        # Create a dummy challenge to track the "session" state
        challenge_data = generate_challenge_nonce()
        challenge_id = challenge_data['challenge_id']
        nonce = challenge_data['nonce']

        AuthenticationChallenge.objects.create(
            challenge_id=challenge_id,
            nonce=nonce,
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        # Build URL pointing to FRONTEND (5173) with action=enroll
        auth_url = f"{FRONTEND_BASE_URL}/authenticate?action=enroll&challenge_id={challenge_id}&nonce={nonce}"
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(auth_url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return JsonResponse({
            'success': True,
            'challenge_id': challenge_id,
            'qr_code': f'data:image/png;base64,{img_base64}',
            'enrollment_url': auth_url
        })
    
    except Exception as e:
        logger.error(f"Enrollment QR error: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ============================================================================
# SIGNATURE VERIFICATION (AUTHENTICATION)
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def verify_signature(request):
    """
    Verify the cryptographic signature from a trusted device.
    """
    try:
        data = json.loads(request.body)
        challenge_id = data.get('challenge_id')
        device_id = data.get('device_id')
        signature_base64 = data.get('signature')
        
        metadata = get_request_metadata(request)
        
        # 1. Validate Challenge
        try:
            challenge = AuthenticationChallenge.objects.get(challenge_id=challenge_id)
        except AuthenticationChallenge.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid challenge ID'}, status=404)
        
        if challenge.is_used:
            return JsonResponse({'success': False, 'error': 'Challenge already used'}, status=403)
            
        if challenge.check_expired():
            return JsonResponse({'success': False, 'error': 'Challenge expired'}, status=403)
        
        # 2. Validate Device
        try:
            device = TrustedDevice.objects.get(device_id=device_id)
        except TrustedDevice.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Device not registered'}, status=403)
        
        # 3. Verify Signature
        # The message signed is (ChallengeID + Nonce)
        message = challenge_id + challenge.nonce
        is_valid, error = verify_ecdsa_signature(
            device.public_key,
            message,
            signature_base64
        )
        
        if not is_valid:
            device.increment_failed_attempts()
            AuthenticationEvent.objects.create(
                event_type='INVALID_SIGNATURE',
                device=device,
                success=False,
                failure_reason=error
            )
            return JsonResponse({'success': False, 'error': 'Invalid signature'}, status=403)
        
        # 4. Success Logic
        challenge.mark_as_used(device)
        device.reset_failed_attempts()
        device.update_last_used()
        
        # Create Session
        from .utils import generate_random_string
        session_id = generate_random_string(32)
        session_token = create_jwt_token(device_id, session_id)
        
        UserSession.objects.create(
            session_id=session_id,
            session_token=session_token,
            device=device,
            ip_address=metadata['ip_address'],
            user_agent=metadata['user_agent']
        )
        
        AuthenticationEvent.objects.create(
            event_type='LOGIN_SUCCESS',
            device=device,
            success=True,
            ip_address=metadata['ip_address']
        )
        
        response = JsonResponse({
            'success': True,
            'message': 'Authentication successful',
            'session_token': session_token
        })

        # CRITICAL: Set cookie path to '/' so Dashboard can see it
        response.set_cookie(
            'session_token', 
            session_token, 
            httponly=True,
            samesite='Lax', 
            secure=False, # Set True in production with HTTPS
            path='/'      # This ensures cookie is visible on all pages
        )
        return response
    
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


# ============================================================================
# CHALLENGE STATUS CHECK (POLLING)
# ============================================================================

@require_http_methods(["GET"])
def check_challenge_status(request):
    challenge_id = request.GET.get('challenge_id')
    
    if not challenge_id:
        return JsonResponse({'error': 'Missing challenge_id'}, status=400)
    
    try:
        challenge = AuthenticationChallenge.objects.get(challenge_id=challenge_id)
        
        return JsonResponse({
            'is_used': challenge.is_used,
            'is_expired': challenge.check_expired(),
            'authenticated': challenge.is_used and challenge.device is not None
        })
    
    except AuthenticationChallenge.DoesNotExist:
        return JsonResponse({'error': 'Challenge not found'}, status=404)


# ============================================================================
# SESSION VALIDATION (NAVBAR CHECK)
# ============================================================================

@csrf_exempt
def validate_session(request):
    """
    Checks if the session_token cookie is valid.
    Used by the Frontend Navbar to toggle Login/Logout buttons.
    """
    # 1. Get Token from Cookie
    token = request.COOKIES.get('session_token')
    if not token:
        # Try Header as fallback
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
    
    if not token:
        return JsonResponse({'authenticated': False}, status=200)

    # 2. Decode Token
    payload, error = decode_jwt_token(token)
    if error:
        return JsonResponse({'authenticated': False, 'error': error}, status=200)

    # 3. Check DB
    try:
        session = UserSession.objects.get(
            session_id=payload['session_id'],
            is_active=True
        )
        return JsonResponse({
            'authenticated': True,
            'device_name': session.device.device_name,
            'session_id': session.session_id
        })
    except UserSession.DoesNotExist:
        return JsonResponse({'authenticated': False}, status=200)


# ============================================================================
# LOGOUT
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    token = request.COOKIES.get('session_token')
    if token:
        try:
            session = UserSession.objects.get(session_token=token, is_active=True)
            session.terminate()
        except UserSession.DoesNotExist:
            pass

    response = JsonResponse({'success': True})
    response.delete_cookie('session_token', path='/') # Clear cookie from root
    return response

# Clean up alias for logout view
logout_view = logout
from django.shortcuts import render

# Create your views here.

"""
Dashboard API Views for NullPass.
Provides endpoints for viewing sessions, devices, authentication events, and threat summary.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import json
import logging

from authenticate.models import TrustedDevice, AuthenticationEvent, UserSession, AuthenticationChallenge
from authenticate.utils import decode_jwt_token, get_client_ip, get_user_agent, calculate_trust_level

logger = logging.getLogger('dashboard')


# ============================================================================
# AUTHENTICATION DECORATOR
# ============================================================================

def require_auth(view_func):
    """
    Decorator to check if user is authenticated via JWT token.
    Attaches device_id and session_id to request object.
    """
    def wrapper(request, *args, **kwargs):
        # Extract token from Authorization header or cookie
        auth_header = request.headers.get('Authorization', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        else:
            token = request.COOKIES.get('session_token')
        
        if not token:
            return JsonResponse({
                'error': 'Unauthorized - No token provided'
            }, status=401)
        
        # Decode and validate token
        payload, error = decode_jwt_token(token)
        
        if error:
            return JsonResponse({
                'error': f'Unauthorized - {error}'
            }, status=401)
        
        # Verify session exists and is active
        try:
            session = UserSession.objects.get(
                session_token=token,
                is_active=True
            )
            
            if session.is_expired():
                session.terminate()
                return JsonResponse({
                    'error': 'Session expired'
                }, status=401)
            
            # Attach authentication info to request
            request.auth_device_id = payload['device_id']
            request.auth_session_id = payload['session_id']
            request.auth_device = session.device
            
            return view_func(request, *args, **kwargs)
        
        except UserSession.DoesNotExist:
            return JsonResponse({
                'error': 'Session not found'
            }, status=401)
    
    return wrapper


# ============================================================================
# ACTIVE SESSIONS API
# ============================================================================

@require_auth
@require_http_methods(["GET"])
def get_active_sessions(request):
    """
    Get all active sessions for the authenticated user's device.
    
    Returns:
        {
            "success": true,
            "sessions": [
                {
                    "session_id": "...",
                    "device_name": "My Phone",
                    "ip_address": "192.168.1.1",
                    "created_at": "2024-01-01T12:00:00Z",
                    "last_activity": "2024-01-01T12:30:00Z",
                    "is_current": true
                }
            ]
        }
    """
    try:
        device = request.auth_device
        
        # Get all active sessions for this device
        sessions = UserSession.objects.filter(
            device=device,
            is_active=True
        ).order_by('-created_at')
        
        sessions_data = []
        for session in sessions:
            sessions_data.append({
                'session_id': session.session_id,
                'device_name': session.device.device_name,
                'device_id': session.device.device_id,
                'ip_address': session.ip_address,
                'user_agent': session.user_agent,
                'created_at': session.created_at.isoformat(),
                'last_activity': session.last_activity.isoformat(),
                'expires_at': session.expires_at.isoformat(),
                'is_current': session.session_id == request.auth_session_id
            })
        
        logger.info(f"Retrieved {len(sessions_data)} active sessions for device {device.device_id}")
        
        return JsonResponse({
            'success': True,
            'sessions': sessions_data,
            'total_count': len(sessions_data)
        })
    
    except Exception as e:
        logger.error(f"Error retrieving sessions: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ============================================================================
# REGISTERED DEVICES API
# ============================================================================

@require_auth
@require_http_methods(["GET"])
def get_registered_devices(request):
    """
    Get all registered devices in the NullPass system.
    
    Returns:
        {
            "success": true,
            "devices": [
                {
                    "device_id": "...",
                    "device_name": "My Phone",
                    "enrolled_at": "2024-01-01T12:00:00Z",
                    "last_used_at": "2024-01-01T12:30:00Z",
                    "is_active": true,
                    "is_flagged": false,
                    "failed_attempts": 0
                }
            ]
        }
    """
    try:
        devices = TrustedDevice.objects.all().order_by('-enrolled_at')
        
        devices_data = []
        for device in devices:
            devices_data.append({
                'device_id': device.device_id,
                'device_name': device.device_name,
                'user_identifier': device.user_identifier,
                'enrolled_at': device.enrolled_at.isoformat(),
                'last_used_at': device.last_used_at.isoformat() if device.last_used_at else None,
                'is_active': device.is_active,
                'is_flagged': device.is_flagged,
                'failed_attempts': device.failed_attempts,
                'is_current': device.device_id == request.auth_device_id
            })
        
        logger.info(f"Retrieved {len(devices_data)} registered devices")
        
        return JsonResponse({
            'success': True,
            'devices': devices_data,
            'total_count': len(devices_data)
        })
    
    except Exception as e:
        logger.error(f"Error retrieving devices: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ============================================================================
# AUTHENTICATION EVENTS API
# ============================================================================

@require_auth
@require_http_methods(["GET"])
def get_authentication_events(request):
    """
    Get authentication events (audit log).
    
    Query Parameters:
        limit: Maximum number of events to return (default: 50)
        device_id: Filter by specific device (optional)
        event_type: Filter by event type (optional)
        success: Filter by success status (optional)
    
    Returns:
        {
            "success": true,
            "events": [...]
        }
    """
    try:
        # Get query parameters
        limit = int(request.GET.get('limit', 50))
        device_id = request.GET.get('device_id')
        event_type = request.GET.get('event_type')
        success_filter = request.GET.get('success')
        
        # Build query
        query = AuthenticationEvent.objects.all()
        
        if device_id:
            query = query.filter(device__device_id=device_id)
        
        if event_type:
            query = query.filter(event_type=event_type)
        
        if success_filter is not None:
            success_bool = success_filter.lower() == 'true'
            query = query.filter(success=success_bool)
        
        # Get events
        events = query.order_by('-timestamp')[:limit]
        
        events_data = []
        for event in events:
            events_data.append({
                'event_id': event.id,
                'event_type': event.event_type,
                'event_type_display': event.get_event_type_display(),
                'device_name': event.device.device_name if event.device else 'Unknown',
                'device_id': event.device.device_id if event.device else None,
                'timestamp': event.timestamp.isoformat(),
                'success': event.success,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'failure_reason': event.failure_reason,
                'attack_type': event.attack_type,
                'blockchain_hash': event.blockchain_hash,
                'blockchain_tx_hash': event.blockchain_tx_hash
            })
        
        logger.info(f"Retrieved {len(events_data)} authentication events")
        
        return JsonResponse({
            'success': True,
            'events': events_data,
            'total_count': len(events_data)
        })
    
    except Exception as e:
        logger.error(f"Error retrieving events: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ============================================================================
# THREAT SUMMARY API
# ============================================================================

@require_auth
@require_http_methods(["GET"])
def get_threat_summary(request):
    """
    Get security threat summary and statistics.
    
    Returns:
        {
            "success": true,
            "failed_attempts_24h": 5,
            "trust_level": "High",
            "flagged_devices": 0,
            "attack_summary": {...},
            "total_devices": 10,
            "active_sessions": 3
        }
    """
    try:
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        # Count failed attempts in last 24 hours
        failed_24h = AuthenticationEvent.objects.filter(
            timestamp__gte=last_24h,
            success=False
        ).count()
        
        # Count failed attempts in last 7 days
        failed_7d = AuthenticationEvent.objects.filter(
            timestamp__gte=last_7d,
            success=False
        ).count()
        
        # Count successful attempts in last 7 days
        success_7d = AuthenticationEvent.objects.filter(
            timestamp__gte=last_7d,
            success=True
        ).count()
        
        # Get attack types breakdown
        attacks_7d = AuthenticationEvent.objects.filter(
            timestamp__gte=last_7d,
            success=False,
            attack_type__isnull=False
        ).exclude(attack_type='').values('attack_type').annotate(count=Count('id'))
        
        attack_summary = {item['attack_type']: item['count'] for item in attacks_7d}
        
        # Calculate trust level
        total_attempts_7d = failed_7d + success_7d
        trust_level = calculate_trust_level(failed_7d, total_attempts_7d)
        
        # Get flagged devices count
        flagged_devices = TrustedDevice.objects.filter(is_flagged=True).count()
        
        # Get total devices
        total_devices = TrustedDevice.objects.count()
        
        # Get active sessions count
        active_sessions = UserSession.objects.filter(is_active=True).count()
        
        # Get recent high-risk events
        recent_threats = AuthenticationEvent.objects.filter(
            timestamp__gte=last_24h,
            success=False,
            event_type__in=['REPLAY_ATTACK', 'INVALID_SIGNATURE', 'UNREGISTERED_DEVICE']
        ).count()
        
        logger.info(f"Generated threat summary - Trust Level: {trust_level}")
        
        return JsonResponse({
            'success': True,
            'failed_attempts_24h': failed_24h,
            'failed_attempts_7d': failed_7d,
            'successful_attempts_7d': success_7d,
            'trust_level': trust_level,
            'flagged_devices': flagged_devices,
            'attack_summary': attack_summary,
            'total_devices': total_devices,
            'active_sessions': active_sessions,
            'recent_threats': recent_threats,
            'threat_level': 'High' if recent_threats > 5 else 'Medium' if recent_threats > 0 else 'Low'
        })
    
    except Exception as e:
        logger.error(f"Error generating threat summary: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ============================================================================
# SESSION MANAGEMENT API
# ============================================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def terminate_session(request):
    """
    Terminate a specific session.
    
    Request Body:
        {
            "session_id": "unique-session-id"
        }
    
    Returns:
        {
            "success": true,
            "message": "Session terminated successfully"
        }
    """
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        
        if not session_id:
            return JsonResponse({
                'success': False,
                'error': 'session_id is required'
            }, status=400)
        
        # Get the session
        try:
            session = UserSession.objects.get(session_id=session_id)
            
            # Terminate the session
            session.terminate()
            
            logger.info(f"Session {session_id} terminated by user")
            
            return JsonResponse({
                'success': True,
                'message': 'Session terminated successfully'
            })
        
        except UserSession.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Session not found'
            }, status=404)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON'
        }, status=400)
    
    except Exception as e:
        logger.error(f"Error terminating session: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ============================================================================
# DEVICE MANAGEMENT API
# ============================================================================

@csrf_exempt
@require_auth
@require_http_methods(["POST"])
def deactivate_device(request):
    """
    Deactivate a specific device.
    
    Request Body:
        {
            "device_id": "unique-device-id"
        }
    
    Returns:
        {
            "success": true,
            "message": "Device deactivated successfully"
        }
    """
    try:
        data = json.loads(request.body)
        device_id = data.get('device_id')
        
        if not device_id:
            return JsonResponse({
                'success': False,
                'error': 'device_id is required'
            }, status=400)
        
        # Get the device
        try:
            device = TrustedDevice.objects.get(device_id=device_id)
            
            # Deactivate the device
            device.deactivate()
            
            # Terminate all active sessions for this device
            active_sessions = UserSession.objects.filter(
                device=device,
                is_active=True
            )
            
            for session in active_sessions:
                session.terminate()
            
            # Log the deactivation event
            AuthenticationEvent.objects.create(
                event_type='DEVICE_DEACTIVATED',
                device=device,
                success=True,
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            logger.info(f"Device {device_id} deactivated and all sessions terminated")
            
            return JsonResponse({
                'success': True,
                'message': 'Device deactivated successfully',
                'sessions_terminated': active_sessions.count()
            })
        
        except TrustedDevice.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Device not found'
            }, status=404)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON'
        }, status=400)
    
    except Exception as e:
        logger.error(f"Error deactivating device: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ============================================================================
# STATISTICS API
# ============================================================================

@require_auth
@require_http_methods(["GET"])
def get_statistics(request):
    """
    Get overall system statistics.
    
    Returns:
        {
            "success": true,
            "total_devices": 10,
            "active_devices": 8,
            "total_sessions": 5,
            "total_events": 100,
            "success_rate": 95.5
        }
    """
    try:
        total_devices = TrustedDevice.objects.count()
        active_devices = TrustedDevice.objects.filter(is_active=True).count()
        flagged_devices = TrustedDevice.objects.filter(is_flagged=True).count()
        
        total_sessions = UserSession.objects.count()
        active_sessions = UserSession.objects.filter(is_active=True).count()
        
        total_events = AuthenticationEvent.objects.count()
        successful_events = AuthenticationEvent.objects.filter(success=True).count()
        
        success_rate = (successful_events / total_events * 100) if total_events > 0 else 0
        
        return JsonResponse({
            'success': True,
            'total_devices': total_devices,
            'active_devices': active_devices,
            'flagged_devices': flagged_devices,
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'total_events': total_events,
            'successful_events': successful_events,
            'failed_events': total_events - successful_events,
            'success_rate': round(success_rate, 2)
        })
    
    except Exception as e:
        logger.error(f"Error retrieving statistics: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
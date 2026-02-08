# authenticateurls.py

from django.urls import path
from . import views

urlpatterns = [
    # Defined in views.py
    path('enroll', views.enroll_device, name='api_enroll'),
    path('login/request', views.request_login, name='api_login_request'),
    path('verify', views.verify_signature, name='api_verify_signature'),
    path('logout', views.logout, name='api_logout'),
    
    # QR Code helpers
    path('enroll/qr', views.request_enrollment, name='api_enroll_qr'),
    
    # Session management
    path('session/validate', views.validate_session, name='validate_session'),
    path('challenge/status', views.check_challenge_status, name='api_challenge_status'),
]
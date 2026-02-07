"""
URL Configuration for NullPass dashboard API endpoints.
"""

from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Session management
    path('sessions', views.get_active_sessions, name='get_sessions'),
    path('terminate-session', views.terminate_session, name='terminate_session'),
    
    # Device management
    path('devices', views.get_registered_devices, name='get_devices'),
    path('deactivate-device', views.deactivate_device, name='deactivate_device'),
    
    # Authentication events (audit log)
    path('events', views.get_authentication_events, name='get_events'),
    
    # Security and threat information
    path('threat-summary', views.get_threat_summary, name='threat_summary'),
    path('statistics', views.get_statistics, name='statistics'),
]
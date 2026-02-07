"""
Django Admin configuration for NullPass authentication models.
"""

from django.contrib import admin
from .models import TrustedDevice, AuthenticationChallenge, AuthenticationEvent, UserSession


@admin.register(TrustedDevice)
class TrustedDeviceAdmin(admin.ModelAdmin):
    list_display = ['device_name', 'device_id_short', 'is_active', 'is_flagged', 'failed_attempts', 'enrolled_at', 'last_used_at']
    list_filter = ['is_active', 'is_flagged', 'enrolled_at']
    search_fields = ['device_name', 'device_id', 'user_identifier']
    readonly_fields = ['device_id', 'public_key', 'enrolled_at', 'last_used_at']
    
    fieldsets = (
        ('Device Information', {
            'fields': ('device_id', 'device_name', 'user_identifier')
        }),
        ('Cryptography', {
            'fields': ('public_key',),
            'classes': ('collapse',)
        }),
        ('Security Status', {
            'fields': ('is_active', 'is_flagged', 'failed_attempts')
        }),
        ('Timestamps', {
            'fields': ('enrolled_at', 'last_used_at')
        }),
    )
    
    def device_id_short(self, obj):
        """Display shortened device ID"""
        return f"{obj.device_id[:8]}..."
    device_id_short.short_description = 'Device ID'
    
    actions = ['activate_devices', 'deactivate_devices', 'unflag_devices']
    
    def activate_devices(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} device(s) activated.')
    activate_devices.short_description = 'Activate selected devices'
    
    def deactivate_devices(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} device(s) deactivated.')
    deactivate_devices.short_description = 'Deactivate selected devices'
    
    def unflag_devices(self, request, queryset):
        count = queryset.update(is_flagged=False, failed_attempts=0)
        self.message_user(request, f'{count} device(s) unflagged.')
    unflag_devices.short_description = 'Unflag selected devices'


@admin.register(AuthenticationChallenge)
class AuthenticationChallengeAdmin(admin.ModelAdmin):
    list_display = ['challenge_id_short', 'is_used', 'is_expired', 'device', 'created_at', 'expires_at']
    list_filter = ['is_used', 'is_expired', 'created_at']
    search_fields = ['challenge_id', 'device__device_name']
    readonly_fields = ['challenge_id', 'nonce', 'created_at', 'expires_at', 'device']
    
    fieldsets = (
        ('Challenge Information', {
            'fields': ('challenge_id', 'nonce')
        }),
        ('Status', {
            'fields': ('is_used', 'is_expired', 'device')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
        ('Request Metadata', {
            'fields': ('ip_address',)
        }),
    )
    
    def challenge_id_short(self, obj):
        """Display shortened challenge ID"""
        return f"{obj.challenge_id[:8]}..."
    challenge_id_short.short_description = 'Challenge ID'
    
    def has_add_permission(self, request):
        """Prevent manual creation of challenges"""
        return False


@admin.register(AuthenticationEvent)
class AuthenticationEventAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'event_type', 'device', 'success', 'ip_address', 'attack_type']
    list_filter = ['event_type', 'success', 'timestamp', 'attack_type']
    search_fields = ['device__device_name', 'device__device_id', 'ip_address', 'failure_reason']
    readonly_fields = ['event_type', 'device', 'timestamp', 'success', 'ip_address', 'user_agent', 
                      'failure_reason', 'attack_type', 'blockchain_hash', 'blockchain_tx_hash']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Event Information', {
            'fields': ('event_type', 'device', 'timestamp', 'success')
        }),
        ('Request Metadata', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Failure Details', {
            'fields': ('failure_reason', 'attack_type'),
            'classes': ('collapse',)
        }),
        ('Blockchain Audit', {
            'fields': ('blockchain_hash', 'blockchain_tx_hash'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Prevent manual creation of events"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of audit events"""
        return False


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id_short', 'device', 'is_active', 'created_at', 'expires_at', 'ip_address']
    list_filter = ['is_active', 'created_at']
    search_fields = ['session_id', 'device__device_name', 'ip_address']
    readonly_fields = ['session_id', 'session_token', 'device', 'created_at', 'expires_at', 
                      'last_activity', 'ip_address', 'user_agent']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Session Information', {
            'fields': ('session_id', 'device', 'is_active')
        }),
        ('Token', {
            'fields': ('session_token',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at', 'last_activity')
        }),
        ('Request Metadata', {
            'fields': ('ip_address', 'user_agent')
        }),
    )
    
    def session_id_short(self, obj):
        """Display shortened session ID"""
        return f"{obj.session_id[:8]}..."
    session_id_short.short_description = 'Session ID'
    
    actions = ['terminate_sessions']
    
    def terminate_sessions(self, request, queryset):
        count = 0
        for session in queryset:
            if session.is_active:
                session.terminate()
                count += 1
        self.message_user(request, f'{count} session(s) terminated.')
    terminate_sessions.short_description = 'Terminate selected sessions'
    
    def has_add_permission(self, request):
        """Prevent manual creation of sessions"""
        return False
from django.db import models

# Create your models here.

from django.db import models
from django.utils import timezone
from datetime import timedelta
import hashlib
import uuid


class TrustedDevice(models.Model):
    """
    Model to store trusted devices enrolled in the NullPass system.
    Each device has a unique cryptographic key pair (only public key stored).
    """
    device_id = models.CharField(max_length=64, unique=True, db_index=True)
    device_name = models.CharField(max_length=100)
    public_key = models.TextField(help_text="ECDSA public key in PEM format")
    user_identifier = models.CharField(max_length=100, blank=True, help_text="Optional user email or username")
    
    # Timestamps
    enrolled_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    # Security flags
    is_active = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False, help_text="Flagged for suspicious activity")
    failed_attempts = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-enrolled_at']
        verbose_name = 'Trusted Device'
        verbose_name_plural = 'Trusted Devices'
    
    def __str__(self):
        return f"{self.device_name} ({self.device_id[:8]}...)"
    
    def deactivate(self):
        """Deactivate the device"""
        self.is_active = False
        self.save()
    
    def flag_device(self):
        """Flag device for suspicious activity"""
        self.is_flagged = True
        self.save()
    
    def reset_failed_attempts(self):
        """Reset failed login attempts counter"""
        self.failed_attempts = 0
        self.save()
    
    def increment_failed_attempts(self):
        """Increment failed attempts and flag if threshold exceeded"""
        from django.conf import settings
        self.failed_attempts += 1
        
        # Flag device if exceeds threshold
        if self.failed_attempts >= settings.MAX_FAILED_ATTEMPTS:
            self.flag_device()
        
        self.save()
    
    def update_last_used(self):
        """Update last used timestamp"""
        self.last_used_at = timezone.now()
        self.save()


class AuthenticationChallenge(models.Model):
    """
    Model to store authentication challenges (nonces) for login requests.
    Each challenge is valid for a limited time and can only be used once.
    """
    challenge_id = models.CharField(max_length=64, unique=True, default=uuid.uuid4, db_index=True)
    nonce = models.CharField(max_length=64)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    # Status flags
    is_used = models.BooleanField(default=False)
    is_expired = models.BooleanField(default=False)
    
    # Related device (set when challenge is verified)
    device = models.ForeignKey(TrustedDevice, on_delete=models.CASCADE, null=True, blank=True)
    
    # Request metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Authentication Challenge'
        verbose_name_plural = 'Authentication Challenges'
    
    def __str__(self):
        return f"Challenge {self.challenge_id[:8]}... ({'Used' if self.is_used else 'Active'})"
    
    def save(self, *args, **kwargs):
        """Override save to set expiration time if not provided"""
        if not self.expires_at:
            from django.conf import settings
            expiration_minutes = settings.CHALLENGE_EXPIRATION_MINUTES
            self.expires_at = timezone.now() + timedelta(minutes=expiration_minutes)
        super().save(*args, **kwargs)
    
    def check_expired(self):
        """Check if challenge has expired and update status"""
        if timezone.now() > self.expires_at:
            self.is_expired = True
            self.save()
        return self.is_expired
    
    def is_valid(self):
        """Check if challenge is valid (not used and not expired)"""
        return not self.is_used and not self.check_expired()
    
    def mark_as_used(self, device):
        """Mark challenge as used and associate with device"""
        self.is_used = True
        self.device = device
        self.save()


class AuthenticationEvent(models.Model):
    """
    Model to store all authentication events for audit trail.
    Events are logged immutably and can be stored on blockchain.
    """
    EVENT_TYPES = [
        ('ENROLLMENT', 'Device Enrollment'),
        ('LOGIN_SUCCESS', 'Login Success'),
        ('LOGIN_FAILED', 'Login Failed'),
        ('REPLAY_ATTACK', 'Replay Attack Detected'),
        ('INVALID_SIGNATURE', 'Invalid Signature'),
        ('EXPIRED_CHALLENGE', 'Expired Challenge'),
        ('UNREGISTERED_DEVICE', 'Unregistered Device'),
        ('SESSION_TERMINATED', 'Session Terminated'),
        ('DEVICE_DEACTIVATED', 'Device Deactivated'),
    ]
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    device = models.ForeignKey(TrustedDevice, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    success = models.BooleanField()
    
    # Request metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    # Failure details
    failure_reason = models.TextField(blank=True)
    attack_type = models.CharField(max_length=50, blank=True)
    
    # Blockchain integration
    blockchain_hash = models.CharField(max_length=66, blank=True, null=True, help_text="SHA256 hash of event")
    blockchain_tx_hash = models.CharField(max_length=66, blank=True, null=True, help_text="Blockchain transaction hash")
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Authentication Event'
        verbose_name_plural = 'Authentication Events'
        indexes = [
            models.Index(fields=['-timestamp', 'success']),
            models.Index(fields=['event_type', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_event_type_display()} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
    
    def generate_event_hash(self):
        """Generate SHA256 hash of event data for blockchain storage"""
        device_id = self.device.device_id if self.device else 'None'
        data = f"{self.event_type}{device_id}{self.timestamp.isoformat()}{self.success}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def log_to_blockchain(self):
        """
        Log event hash to blockchain for immutable audit trail.
        This is optional and depends on BLOCKCHAIN_ENABLED setting.
        """
        from django.conf import settings
        
        if not settings.BLOCKCHAIN_ENABLED:
            return
        
        try:
            from blockchain_audit.blockchain_service import BlockchainService
            
            # Generate event hash
            event_hash = self.generate_event_hash()
            
            # Initialize blockchain service
            blockchain_service = BlockchainService()
            
            # Log to blockchain
            tx_hash = blockchain_service.log_event(
                event_hash=event_hash,
                event_type=self.event_type,
                success=self.success
            )
            
            # Store hashes in database
            self.blockchain_hash = event_hash
            self.blockchain_tx_hash = tx_hash
            self.save()
            
        except Exception as e:
            # Log error but don't fail the authentication process
            import logging
            logger = logging.getLogger('authentication')
            logger.error(f"Blockchain logging failed: {str(e)}")
    
    def classify_attack(self):
        """Classify the type of attack based on event type"""
        attack_classifications = {
            'REPLAY_ATTACK': 'Replay Attack',
            'INVALID_SIGNATURE': 'Signature Forgery Attempt',
            'UNREGISTERED_DEVICE': 'Unauthorized Device Access',
            'EXPIRED_CHALLENGE': 'Timing Attack Attempt',
        }
        
        if self.event_type in attack_classifications:
            self.attack_type = attack_classifications[self.event_type]
            self.save()


class UserSession(models.Model):
    """
    Model to store active user sessions after successful authentication.
    Each session is tied to a specific device and has an expiration time.
    """
    session_id = models.CharField(max_length=64, unique=True, default=uuid.uuid4, db_index=True)
    session_token = models.TextField(help_text="JWT token for API authentication")
    device = models.ForeignKey(TrustedDevice, on_delete=models.CASCADE)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_activity = models.DateTimeField(auto_now=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Session metadata
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
    
    def __str__(self):
        return f"Session for {self.device.device_name} - {self.session_id[:8]}..."
    
    def save(self, *args, **kwargs):
        """Override save to set expiration time if not provided"""
        if not self.expires_at:
            from django.conf import settings
            self.expires_at = timezone.now() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        """Check if session has expired"""
        return timezone.now() > self.expires_at
    
    def terminate(self):
        """Terminate the session and log event"""
        self.is_active = False
        self.save()
        
        # Log session termination event
        AuthenticationEvent.objects.create(
            event_type='SESSION_TERMINATED',
            device=self.device,
            success=True,
            ip_address=self.ip_address,
            user_agent=self.user_agent
        )

"""
API key generation and rotation for MYCELOFORGE services
Implements secure key management and rotation policies
"""

import secrets
import hashlib
import hmac
from typing import Optional
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class APIKey:
    """API key data structure"""

    key_id: str  # Public key ID
    key_hash: str  # Hashed key (never store plain key)
    service_id: str  # Service this key belongs to
    created_at: datetime
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    permissions: list[str] = None  # e.g., ['read', 'write']

    def __post_init__(self):
        if self.permissions is None:
            self.permissions = ['read']

    @property
    def is_active(self) -> bool:
        """Check if key is currently valid"""
        now = datetime.utcnow()

        # Check if revoked
        if self.revoked_at and self.revoked_at <= now:
            return False

        # Check if expired
        if self.expires_at and self.expires_at <= now:
            return False

        return True

    @property
    def is_expired(self) -> bool:
        """Check if key has expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() >= self.expires_at


def generate_api_key(length: int = 32) -> str:
    """
    Generate a secure random API key

    Args:
        length: Length of the key in bytes

    Returns:
        URL-safe random string
    """
    return secrets.token_urlsafe(length)


def hash_api_key(key: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash an API key using HMAC-SHA256

    Args:
        key: The API key to hash
        salt: Optional salt (generated if not provided)

    Returns:
        Tuple of (hash, salt)
    """
    if not salt:
        salt = secrets.token_hex(16)

    h = hmac.new(salt.encode(), key.encode(), hashlib.sha256)
    key_hash = h.hexdigest()

    return f"{salt}${key_hash}", salt


def verify_api_key(plain_key: str, stored_hash: str) -> bool:
    """
    Verify an API key against a stored hash

    Args:
        plain_key: The plain API key to verify
        stored_hash: The stored hash in format "salt$hash"

    Returns:
        True if key matches hash
    """
    try:
        salt, stored_key_hash = stored_hash.split('$', 1)
        h = hmac.new(salt.encode(), plain_key.encode(), hashlib.sha256)
        computed_hash = h.hexdigest()
        return hmac.compare_digest(computed_hash, stored_key_hash)
    except (ValueError, AttributeError):
        return False


class APIKeyManager:
    """Manages API key lifecycle (generation, rotation, validation)"""

    def __init__(self, rotation_days: int = 90, cleanup_days: int = 30):
        """
        Initialize API key manager

        Args:
            rotation_days: How often to rotate keys
            cleanup_days: How long to keep revoked keys
        """
        self.rotation_days = rotation_days
        self.cleanup_days = cleanup_days
        self.keys: list[APIKey] = []  # In production, use database

    def create_key(self, service_id: str, permissions: list[str] = None, expires_in_days: int = None) -> tuple[str, APIKey]:
        """
        Create a new API key

        Args:
            service_id: ID of the service
            permissions: List of permissions
            expires_in_days: Optional expiration time

        Returns:
            Tuple of (plain_key, api_key_record)
        """
        plain_key = generate_api_key()
        key_id = generate_api_key(16)  # Shorter public ID
        key_hash, salt = hash_api_key(plain_key)

        expires_at = None
        if expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        api_key = APIKey(
            key_id=key_id,
            key_hash=key_hash,
            service_id=service_id,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
            permissions=permissions or ['read'],
        )

        self.keys.append(api_key)
        return plain_key, api_key

    def rotate_keys(self, service_id: str, keep_old_keys: bool = True) -> tuple[str, APIKey]:
        """
        Rotate API keys for a service

        Args:
            service_id: ID of the service
            keep_old_keys: Whether to keep old keys (revoked) for backward compatibility

        Returns:
            Tuple of (new_plain_key, new_api_key_record)
        """
        # Revoke old keys if not keeping them
        if not keep_old_keys:
            for key in self.keys:
                if key.service_id == service_id and key.is_active:
                    key.revoked_at = datetime.utcnow()

        # Create new key with same permissions as the previous one
        old_key = next((k for k in self.keys if k.service_id == service_id), None)
        permissions = old_key.permissions if old_key else ['read']

        return self.create_key(service_id, permissions=permissions, expires_in_days=self.rotation_days)

    def validate_key(self, plain_key: str, service_id: str) -> bool:
        """
        Validate an API key

        Args:
            plain_key: The API key to validate
            service_id: Expected service ID

        Returns:
            True if key is valid and active
        """
        for key in self.keys:
            if key.service_id == service_id and key.is_active:
                if verify_api_key(plain_key, key.key_hash):
                    key.last_used_at = datetime.utcnow()
                    return True
        return False

    def revoke_key(self, key_id: str) -> bool:
        """
        Revoke an API key

        Args:
            key_id: ID of the key to revoke

        Returns:
            True if key was revoked
        """
        for key in self.keys:
            if key.key_id == key_id:
                key.revoked_at = datetime.utcnow()
                return True
        return False

    def cleanup_old_keys(self):
        """Remove very old revoked keys (configurable retention)"""
        cutoff = datetime.utcnow() - timedelta(days=self.cleanup_days)
        self.keys = [key for key in self.keys if not (key.revoked_at and key.revoked_at < cutoff)]

    def get_active_keys(self, service_id: str) -> list[APIKey]:
        """Get all active keys for a service"""
        return [key for key in self.keys if key.service_id == service_id and key.is_active]

    def get_key_info(self, key_id: str) -> Optional[APIKey]:
        """Get info about a specific key (without the hash)"""
        for key in self.keys:
            if key.key_id == key_id:
                return key
        return None


# Global key manager instance
_key_manager = APIKeyManager()


def create_api_key(service_id: str, permissions: list[str] = None) -> tuple[str, APIKey]:
    """Helper function to create API key"""
    return _key_manager.create_key(service_id, permissions)


def rotate_api_key(service_id: str) -> tuple[str, APIKey]:
    """Helper function to rotate API key"""
    return _key_manager.rotate_keys(service_id)


def validate_api_key(plain_key: str, service_id: str) -> bool:
    """Helper function to validate API key"""
    return _key_manager.validate_key(plain_key, service_id)

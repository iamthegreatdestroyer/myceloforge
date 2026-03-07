"""
Rate limiting for MYCELOFORGE backend services
Prevents brute force attacks and abuse
"""

from typing import Optional, Dict, Callable
from datetime import datetime, timedelta
from functools import wraps
from fastapi import Request, HTTPException


class RateLimiter:
    """Simple in-memory rate limiter"""

    def __init__(self):
        self.requests: Dict[str, list[datetime]] = {}

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check for proxy headers first
        if request.headers.get('x-forwarded-for'):
            return request.headers.get('x-forwarded-for').split(',')[0].strip()
        if request.headers.get('x-real-ip'):
            return request.headers.get('x-real-ip')
        # Fall back to direct connection
        return request.client.host if request.client else 'unknown'

    def is_allowed(self, key: str, limit: int, window_seconds: int) -> bool:
        """
        Check if request is allowed under rate limit

        Args:
            key: Unique identifier (e.g., client IP)
            limit: Number of requests allowed
            window_seconds: Time window in seconds

        Returns:
            True if allowed, False if rate limit exceeded
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=window_seconds)

        # Initialize if not exists
        if key not in self.requests:
            self.requests[key] = []

        # Remove old requests outside the window
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]

        # Check if limit exceeded
        if len(self.requests[key]) >= limit:
            return False

        # Add current request
        self.requests[key].append(now)
        return True

    def cleanup(self, older_than_hours: int = 1):
        """Remove old request records to prevent memory bloat"""
        cutoff = datetime.utcnow() - timedelta(hours=older_than_hours)
        keys_to_remove = []

        for key, requests in self.requests.items():
            self.requests[key] = [req for req in requests if req > cutoff]
            if not self.requests[key]:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self.requests[key]


# Global rate limiter instance
_rate_limiter = RateLimiter()


def rate_limit(
    limit: int = 100,
    window_seconds: int = 60,
    by_ip: bool = True,
    by_user: bool = False,
    error_message: str = 'Rate limit exceeded. Please try again later.',
) -> Callable:
    """
    Rate limiting decorator for FastAPI endpoints

    Args:
        limit: Number of requests allowed in the window
        window_seconds: Time window in seconds
        by_ip: Limit by client IP
        by_user: Limit by authenticated user ID
        error_message: Custom error message

    Usage:
        @app.post('/deploy')
        @rate_limit(limit=10, window_seconds=60, by_ip=True)
        async def deploy_empire(request: Request, req: DeployRequest):
            ...
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find Request object in arguments
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if request:
                # Determine rate limit key
                if by_user:
                    # Try to get user ID from request state or headers
                    user_id = getattr(request.state, 'user_id', None) or request.headers.get('x-user-id')
                    key = f"user:{user_id}" if user_id else f"ip:{_rate_limiter.get_client_ip(request)}"
                else:
                    key = f"ip:{_rate_limiter.get_client_ip(request)}"

                if not _rate_limiter.is_allowed(key, limit, window_seconds):
                    raise HTTPException(status_code=429, detail=error_message)

            return await func(*args, **kwargs)

        return wrapper

    return decorator


# Predefined rate limit configurations
RATE_LIMITS = {
    'general': {'limit': 100, 'window_seconds': 60},  # 100 req/min
    'auth': {'limit': 5, 'window_seconds': 900},  # 5 attempts per 15 min
    'deploy': {'limit': 10, 'window_seconds': 60},  # 10 deployments per minute
    'api': {'limit': 1000, 'window_seconds': 3600},  # 1000 req/hour
    'strict': {'limit': 10, 'window_seconds': 3600},  # 10 req/hour
}


def get_rate_limit(limit_type: str = 'general') -> Dict[str, int]:
    """Get predefined rate limit configuration"""
    return RATE_LIMITS.get(limit_type, RATE_LIMITS['general'])

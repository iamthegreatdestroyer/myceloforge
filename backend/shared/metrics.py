"""
Prometheus metrics collection for MYCELOFORGE backend services
Comprehensive metrics for monitoring and observability
"""

import time
import os
from functools import wraps
from typing import Callable, Any

# Only import prometheus_client if available, gracefully degrade otherwise
try:
    from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    # Create dummy classes if prometheus_client not installed
    class Counter:
        def __init__(self, *args, **kwargs):
            pass
        def labels(self, **kwargs):
            return self
        def inc(self, amount=1):
            pass

    class Histogram:
        def __init__(self, *args, **kwargs):
            pass
        def labels(self, **kwargs):
            return self
        def observe(self, value):
            pass

    class Gauge:
        def __init__(self, *args, **kwargs):
            pass
        def labels(self, **kwargs):
            return self
        def set(self, value):
            pass


# HTTP Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0)
)

# Business metrics
empire_deployments_total = Counter(
    'empire_deployments_total',
    'Total empire deployments',
    ['status']
)

empire_deployment_duration_seconds = Histogram(
    'empire_deployment_duration_seconds',
    'Empire deployment duration in seconds',
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0)
)

active_users_current = Gauge(
    'active_users_current',
    'Currently active users'
)

empires_created_total = Counter(
    'empires_created_total',
    'Total empires created'
)

# Database metrics
db_connections_active = Gauge(
    'db_connections_active',
    'Active database connections'
)

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration in seconds',
    ['query_type'],
    buckets=(0.001, 0.01, 0.05, 0.1, 0.5, 1.0)
)

# Cache metrics
cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits'
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses'
)

cache_size_bytes = Gauge(
    'cache_size_bytes',
    'Cache size in bytes'
)

# System metrics
service_up = Gauge(
    'service_up',
    'Service health status (1 = up, 0 = down)'
)


def track_request(endpoint: str) -> Callable:
    """
    Decorator to track HTTP request metrics

    Usage:
        @track_request('/v1/chat/completions')
        async def chat_completions(request: Request):
            return response
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract request from first argument (FastAPI convention)
            request = args[0] if args else None
            method = request.method if hasattr(request, 'method') else 'UNKNOWN'

            start_time = time.time()
            status = 'success'

            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                # Get status code from response if available
                status_code = getattr(result, 'status_code', 500) if status == 'success' else 500
                http_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status_code
                ).inc()
                http_request_duration_seconds.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(duration)

        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            request = args[0] if args else None
            method = request.method if hasattr(request, 'method') else 'UNKNOWN'

            start_time = time.time()
            status = 'success'

            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                status_code = getattr(result, 'status_code', 500) if status == 'success' else 500
                http_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status_code
                ).inc()
                http_request_duration_seconds.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(duration)

        # Return appropriate wrapper based on function type
        return async_wrapper if hasattr(func, '__await__') else sync_wrapper

    return decorator


def track_empire_deployment(func: Callable) -> Callable:
    """
    Decorator to track empire deployment metrics
    """
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            empire_deployments_total.labels(status='success').inc()
            empires_created_total.inc()
            return result
        except Exception as e:
            empire_deployments_total.labels(status='failure').inc()
            raise
        finally:
            duration = time.time() - start_time
            empire_deployment_duration_seconds.observe(duration)

    return wrapper


def get_metrics_response():
    """
    Generate Prometheus metrics response

    Returns:
        Tuple of (metrics_bytes, content_type)
    """
    if PROMETHEUS_AVAILABLE:
        return generate_latest(), CONTENT_TYPE_LATEST
    else:
        return b'# Prometheus metrics not available\n', 'text/plain; charset=utf-8'

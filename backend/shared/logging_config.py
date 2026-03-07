"""
Structured logging configuration for MYCELOFORGE backend services
JSON-based logging for centralized log aggregation
"""

import logging
import json
from datetime import datetime
from typing import Optional


class JSONFormatter(logging.Formatter):
    """JSON structured logging formatter"""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'service': record.name.split('.')[0],  # Get service name from logger name
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)

        # Add extra context if available
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'path'):
            log_entry['path'] = record.path
        if hasattr(record, 'method'):
            log_entry['method'] = record.method
        if hasattr(record, 'status_code'):
            log_entry['status_code'] = record.status_code
        if hasattr(record, 'duration_ms'):
            log_entry['duration_ms'] = record.duration_ms

        return json.dumps(log_entry)


def setup_logging(service_name: str, log_level: str = 'INFO') -> logging.Logger:
    """
    Configure structured logging for a service

    Args:
        service_name: Name of the service (e.g., 'ryzanstein')
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(service_name)
    logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers to avoid duplicates
    logger.handlers = []

    # Create console handler with JSON formatter
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


class LogContext:
    """Context manager for adding structured context to logs"""

    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def __call__(self, **kwargs):
        """Add context to the next log message"""
        for key, value in kwargs.items():
            # Attach to the logger's makeRecord method
            if not hasattr(self.logger, '_context'):
                self.logger._context = {}
            self.logger._context[key] = value
        return self

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if hasattr(self.logger, '_context'):
            self.logger._context = {}
        return False

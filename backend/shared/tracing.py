"""
Distributed tracing configuration for MYCELOFORGE backend services
OpenTelemetry integration with Jaeger exporter
"""

import os
from typing import Optional

# Gracefully handle optional dependencies
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.jaeger.thrift import JaegerExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
    from opentelemetry.instrumentation.requests import RequestsInstrumentor

    TRACING_AVAILABLE = True
except ImportError:
    TRACING_AVAILABLE = False


def setup_tracing(service_name: str, environment: str = 'development') -> Optional[object]:
    """
    Initialize distributed tracing with Jaeger exporter

    Args:
        service_name: Name of the service (e.g., 'ryzanstein')
        environment: Environment (development, staging, production)

    Returns:
        Tracer instance or None if tracing not available
    """
    if not TRACING_AVAILABLE:
        print(f"Warning: OpenTelemetry not installed. Tracing disabled.")
        return None

    jaeger_host = os.getenv('JAEGER_HOST', 'localhost')
    jaeger_port = int(os.getenv('JAEGER_PORT', '6831'))

    # Create Jaeger exporter
    jaeger_exporter = JaegerExporter(
        agent_host_name=jaeger_host,
        agent_port=jaeger_port,
    )

    # Create and set tracer provider
    tracer_provider = TracerProvider()
    tracer_provider.add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )
    trace.set_tracer_provider(tracer_provider)

    # Get tracer for this service
    tracer = trace.get_tracer(service_name)

    return tracer


def instrument_fastapi(app, service_name: str):
    """
    Instrument FastAPI application for tracing

    Args:
        app: FastAPI application instance
        service_name: Name of the service
    """
    if TRACING_AVAILABLE:
        FastAPIInstrumentor.instrument_app(app)


def instrument_sqlalchemy(engine):
    """
    Instrument SQLAlchemy for tracing

    Args:
        engine: SQLAlchemy engine instance
    """
    if TRACING_AVAILABLE:
        SQLAlchemyInstrumentor().instrument(engine=engine)


def instrument_requests():
    """
    Instrument requests library for tracing
    """
    if TRACING_AVAILABLE:
        RequestsInstrumentor().instrument()


class TraceContext:
    """Context manager for adding trace attributes"""

    def __init__(self, tracer, span_name: str, attributes: Optional[dict] = None):
        self.tracer = tracer
        self.span_name = span_name
        self.attributes = attributes or {}
        self.span = None

    def __enter__(self):
        if self.tracer:
            self.span = self.tracer.start_as_current_span(self.span_name)
            for key, value in self.attributes.items():
                self.span.set_attribute(key, value)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.span:
            if exc_type:
                self.span.set_attribute('error', True)
                self.span.set_attribute('error.type', exc_type.__name__)
                self.span.set_attribute('error.message', str(exc_val))
            self.span.end()
        return False

    def add_event(self, event_name: str, attributes: Optional[dict] = None):
        """Add event to current span"""
        if self.span:
            self.span.add_event(event_name, attributes=attributes or {})

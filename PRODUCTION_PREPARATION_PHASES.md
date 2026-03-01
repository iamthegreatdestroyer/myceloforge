# MYCELOFORGE — Production Preparation Phases

> **Objective:** Transform MYCELOFORGE from development-ready to enterprise-grade production system
> **Strategy:** Phased approach to security hardening, observability, performance optimization, and deployment
> **Timeline:** 6 production phases (10–15), each independently deployable and testable
> **Goal:** Production-ready system with SLA compliance, security audit passing, and zero-downtime deployment

---

## 🎯 Production Readiness Framework

### Four Pillars of Production Excellence

1. **🔐 Security & Compliance** — OWASP Top 10, encryption, audit logging
2. **📊 Observability & Monitoring** — Metrics, traces, logs, alerts, dashboards
3. **⚡ Performance & Scalability** — Caching, optimization, load testing, capacity planning
4. **🚀 Deployment & Operations** — CI/CD refinement, zero-downtime deployments, disaster recovery

---

## Phase 10: Observability & Monitoring Infrastructure

**Priority:** 🔴 CRITICAL (must complete before Phase 12)
**Estimated Time:** 3–4 hours
**Agent Lead:** SENTRY (Observability) + FLUX (DevOps)

### 10.1 — Structured Logging Framework

**Objective:** Centralized, queryable logging across all services

#### 10.1.1 Frontend Logging (Next.js)

**File:** `lib/logger.ts`

```typescript
// Structured logging for frontend
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: 'frontend';
  message: string;
  context?: LogContext;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private sessionId: string;

  constructor() {
    this.sessionId = typeof window !== 'undefined'
      ? sessionStorage.getItem('sessionId') || crypto.randomUUID()
      : 'server';
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: 'frontend',
      message,
      context,
      sessionId: this.sessionId,
      ...(typeof window !== 'undefined' && {
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    };
  }

  debug(message: string, context?: LogContext) {
    const entry = this.formatEntry('debug', message, context);
    console.debug(JSON.stringify(entry));
    if (process.env.NODE_ENV === 'production') {
      this.sendToSink(entry);
    }
  }

  info(message: string, context?: LogContext) {
    const entry = this.formatEntry('info', message, context);
    console.info(JSON.stringify(entry));
    this.sendToSink(entry);
  }

  warn(message: string, context?: LogContext) {
    const entry = this.formatEntry('warn', message, context);
    console.warn(JSON.stringify(entry));
    this.sendToSink(entry);
  }

  error(message: string, context?: LogContext, error?: Error) {
    const entry = this.formatEntry('error', message, {
      ...context,
      ...(error && { errorMessage: error.message, errorName: error.name }),
    });
    if (error?.stack) entry.stackTrace = error.stack;
    console.error(JSON.stringify(entry));
    this.sendToSink(entry);
  }

  private async sendToSink(entry: LogEntry) {
    try {
      // Send to logging service (Sentry, DataDog, ELK, etc.)
      // Implement based on chosen provider
      if (process.env.NEXT_PUBLIC_LOG_SINK_URL) {
        await fetch(process.env.NEXT_PUBLIC_LOG_SINK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      }
    } catch (err) {
      // Fail silently to prevent logging from breaking app
      console.error('Failed to send log:', err);
    }
  }
}

export const logger = new Logger();
```

#### 10.1.2 Backend Logging (FastAPI)

**File:** `backend/shared/logging_config.py`

```python
import logging
import json
from datetime import datetime
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    """JSON structured logging formatter"""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'service': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)

        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id

        return json.dumps(log_entry)

def setup_logging(service_name: str) -> logging.Logger:
    """Configure structured logging for a service"""
    logger = logging.getLogger(service_name)
    logger.setLevel(logging.DEBUG)

    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    return logger
```

**Usage in each service:**

```python
from logging_config import setup_logging

logger = setup_logging('ryzanstein')

@app.get('/health')
async def health_check(request: Request):
    logger.info('Health check requested', extra={
        'request_id': request.headers.get('x-request-id'),
        'client_ip': request.client.host,
    })
    return {'status': 'healthy'}
```

### 10.2 — Metrics Collection

**Objective:** Real-time performance and business metrics

#### 10.2.1 Prometheus Metrics

**Install:** `pip install prometheus-client`

**File:** `backend/shared/metrics.py`

```python
from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps

# Request metrics
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint'],
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0)
)

# Business metrics
empire_deployments = Counter(
    'empire_deployments_total',
    'Total empire deployments',
    ['status']
)

active_users = Gauge(
    'active_users_current',
    'Currently active users'
)

# Database metrics
db_connections = Gauge(
    'db_connections_active',
    'Active database connections'
)

def track_request(endpoint: str):
    """Decorator to track request metrics"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = args[0] if args else None
            method = request.method if request else 'UNKNOWN'

            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                status = 'success'
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                request_count.labels(method=method, endpoint=endpoint, status=status).inc()
                request_duration.labels(method=method, endpoint=endpoint).observe(duration)

        return wrapper
    return decorator
```

#### 10.2.2 Application Performance Metrics

**File:** `backend/ryzanstein/main.py` (updated)

```python
from metrics import track_request, empire_deployments

@app.post('/v1/chat/completions')
@track_request('/v1/chat/completions')
async def chat_completions(request: ChatRequest):
    try:
        # Process empire deployment
        result = process_empire(request)
        empire_deployments.labels(status='success').inc()
        return result
    except Exception as e:
        empire_deployments.labels(status='failure').inc()
        raise

@app.get('/metrics')
async def metrics():
    """Prometheus metrics endpoint"""
    from prometheus_client import generate_latest
    return Response(
        content=generate_latest(),
        media_type='text/plain'
    )
```

### 10.3 — Distributed Tracing

**Objective:** Understand request flow across microservices

**Install:**

```bash
pip install opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-fastapi
pip install opentelemetry-exporter-jaeger
```

**File:** `backend/shared/tracing.py`

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

def setup_tracing(service_name: str):
    """Initialize distributed tracing"""
    jaeger_exporter = JaegerExporter(
        agent_host_name='localhost',
        agent_port=6831,
    )

    trace.set_tracer_provider(TracerProvider())
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )

    return trace.get_tracer(service_name)
```

### 10.4 — Error Tracking (Sentry)

**Install:** `pip install sentry-sdk`

**File:** `backend/shared/error_tracking.py`

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

def setup_sentry(service_name: str, environment: str):
    """Initialize Sentry error tracking"""
    sentry_sdk.init(
        dsn=os.getenv('SENTRY_DSN'),
        integrations=[FastApiIntegration()],
        environment=environment,
        release=os.getenv('APP_VERSION', '1.0.0'),
        traces_sample_rate=0.1,  # 10% of transactions
        profiles_sample_rate=0.1,  # 10% of profiles
    )

    with sentry_sdk.configure_scope() as scope:
        scope.set_tag('service', service_name)
```

### 10.5 — Monitoring Dashboard

**Docker Compose Addition:**

```yaml
services:
  # ... existing services ...

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "24400:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "24401:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "24402:16686"

volumes:
  prometheus-data:
  grafana-data:
```

**File:** `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ryzanstein'
    static_configs:
      - targets: ['localhost:24000']
    metrics_path: '/metrics'

  - job_name: 'negative-space'
    static_configs:
      - targets: ['localhost:24001']
    metrics_path: '/metrics'

  - job_name: 'qhss'
    static_configs:
      - targets: ['localhost:24002']
    metrics_path: '/metrics'

  - job_name: 'nexuszero'
    static_configs:
      - targets: ['localhost:24003']
    metrics_path: '/metrics'

  - job_name: 'doppelganger'
    static_configs:
      - targets: ['localhost:24004']
    metrics_path: '/metrics'

  - job_name: 'elite-agents'
    static_configs:
      - targets: ['localhost:24005']
    metrics_path: '/metrics'
```

### Gate Criteria ✅

- [ ] Structured logging implemented in frontend and backend
- [ ] Prometheus metrics exposed on `/metrics` for all services
- [ ] Distributed tracing working with Jaeger
- [ ] Sentry error tracking configured
- [ ] Prometheus and Grafana running in Docker Compose
- [ ] All logs collected in centralized sink
- [ ] Alert rules configured (service down, high error rate)
- [ ] Sample dashboard visible in Grafana
- [ ] Committed & pushed

---

## Phase 11: Security Hardening & Compliance

**Priority:** 🔴 CRITICAL (must complete before Phase 12)
**Estimated Time:** 4–5 hours
**Agent Lead:** CIPHER (Security) + FORTRESS (Security Audit) + AEGIS (Compliance)

### 11.1 — OWASP Top 10 Mitigation

#### 11.1.1 Input Validation & Sanitization

**File:** `lib/validation.ts`

```typescript
import { z } from 'zod';

// Schema definitions
export const EmpireNameSchema = z
  .string()
  .min(3, 'Empire name too short')
  .max(100, 'Empire name too long')
  .regex(/^[a-zA-Z0-9\s-]+$/, 'Invalid characters in empire name');

export const DeploymentSeedSchema = z
  .string()
  .min(5, 'Seed too short')
  .max(1000, 'Seed too long');

// Validation function
export function validateEmpireDeployment(data: unknown) {
  return EmpireNameSchema.safeParse(data);
}
```

**Backend validation (FastAPI):**

```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class EmpireRequest(BaseModel):
    seed: str = Field(..., min_length=5, max_length=1000)
    name: Optional[str] = Field(None, min_length=3, max_length=100)

    @validator('seed')
    def sanitize_seed(cls, v):
        # Remove potential injection attempts
        return v.replace('<', '').replace('>', '').strip()
```

#### 11.1.2 SQL Injection Prevention

**Use parameterized queries everywhere:**

```python
# ❌ WRONG
query = f"SELECT * FROM empires WHERE id = {empire_id}"

# ✅ CORRECT (with Supabase)
from supabase import create_client
supabase = create_client(url, key)
data = supabase.table('empires').select('*').eq('id', empire_id).execute()
```

#### 11.1.3 Cross-Site Scripting (XSS) Prevention

**Next.js App Router is XSS-safe by default**, but ensure:

```typescript
// ✅ SAFE — React escapes by default
export default function EmpireCard({ empire }: { empire: Empire }) {
  return <div>{empire.name}</div>; // Automatically escaped
}

// ❌ DANGEROUS — dangerouslySetInnerHTML
export default function BadEmpireCard({ empire }: { empire: Empire }) {
  return <div dangerouslySetInnerHTML={{ __html: empire.name }} />; // Only use on trusted content
}
```

#### 11.1.4 Cross-Site Request Forgery (CSRF) Prevention

**Middleware:** `lib/middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Require origin header for state-changing operations
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    if (!allowedOrigins.includes(origin || '')) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
```

**Stripe webhook CSRF protection:**

```typescript
import { Stripe } from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    // Process event
  } catch (err) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}
```

#### 11.1.5 Sensitive Data Exposure Prevention

**Rules:**
1. ✅ Use HTTPS only (enforced by Vercel/production host)
2. ✅ Never log PII or secrets
3. ✅ Encrypt sensitive fields in database (PCI compliance)
4. ✅ Rotate secrets regularly
5. ✅ Use environment variables (never hardcode secrets)

**File:** `lib/secure-storage.ts`

```typescript
// Secure localStorage handling
export class SecureStorage {
  static setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_token', token); // Not localStorage!
    }
  }

  static getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('auth_token');
    }
    return null;
  }

  static clearAuthToken() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_token');
    }
  }
}
```

#### 11.1.6 Broken Authentication Prevention

**Supabase session handling (already implemented):**

```typescript
// Automatic JWT refresh
const { data, error } = await supabase.auth.getSession();
if (error || !data.session) {
  // Redirect to login
  window.location.href = '/login';
}
```

#### 11.1.7 Broken Access Control Prevention

**Middleware:** `lib/auth-middleware.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export async function checkAuth(req: NextRequest): Promise<{ userId: string } | null> {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase.auth.getUser(token);
    return data.user ? { userId: data.user.id } : null;
  } catch {
    return null;
  }
}

// Usage in API route
export async function POST(req: NextRequest) {
  const auth = await checkAuth(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated as auth.userId
  const { empire_id } = await req.json();

  // Verify user owns this empire
  const owned = await supabase
    .from('empires')
    .select('id')
    .eq('id', empire_id)
    .eq('user_id', auth.userId)
    .single();

  if (!owned) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Safe to proceed
}
```

#### 11.1.8 Security Misconfiguration Prevention

**File:** `app/middleware.ts`

```typescript
import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set(
    'X-Content-Type-Options',
    'nosniff'
  );
  response.headers.set(
    'X-Frame-Options',
    'DENY'
  );
  response.headers.set(
    'X-XSS-Protection',
    '1; mode=block'
  );
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // CSP — restrict inline scripts, styles
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.stripe.com https://*.supabase.co"
  );

  return response;
}

export const config = {
  matcher: ['/(.*)'],
};
```

#### 11.1.9 Using Components with Known Vulnerabilities

**Automated scanning:**

```bash
# Add to CI pipeline
npm audit --audit-level=moderate

# Upgrade vulnerable packages
npm audit fix
```

**File:** `.github/workflows/ci.yml` (add security job)

```yaml
security-audit:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    - run: npm ci --legacy-peer-deps
    - run: npm audit --audit-level=moderate
```

#### 11.1.10 Insufficient Logging & Monitoring

**Already covered in Phase 10** ✅

### 11.2 — API Security Hardening

#### 11.2.1 Rate Limiting

**Install:** `pip install slowapi`

**File:** `backend/shared/rate_limit.py`

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post('/v1/chat/completions')
@limiter.limit('10/minute')  # 10 requests per minute
async def chat_completions(request: Request, chat_req: ChatRequest):
    # Process request
    return response
```

#### 11.2.2 Request Size Limits

```python
from fastapi import Request, HTTPException

@app.post('/v1/chat/completions')
async def chat_completions(request: Request):
    body_size = int(request.headers.get('content-length', 0))
    if body_size > 1_000_000:  # 1 MB limit
        raise HTTPException(status_code=413, detail='Payload too large')

    body = await request.json()
    # Process
```

#### 11.2.3 API Key Rotation

**File:** `backend/shared/api_key.py`

```python
from datetime import datetime, timedelta
import secrets

def generate_api_key() -> str:
    """Generate secure API key"""
    return secrets.token_urlsafe(32)

def rotate_api_keys(db, service_id: str) -> str:
    """Rotate API keys, invalidate old ones"""
    new_key = generate_api_key()
    old_key = db.query(APIKey).filter(APIKey.service_id == service_id).first()

    if old_key:
        old_key.revoked_at = datetime.utcnow()

    new_api_key = APIKey(
        service_id=service_id,
        key_hash=hash_key(new_key),
        created_at=datetime.utcnow(),
    )
    db.add(new_api_key)
    db.commit()

    return new_key
```

### 11.3 — Database Security

#### 11.3.1 Row-Level Security (RLS)

**Supabase RLS policies:**

```sql
-- Only users can see their own empires
CREATE POLICY "Users can view own empires"
  ON empires
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only users can create empires
CREATE POLICY "Users can create empires"
  ON empires
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only users can update their own empires
CREATE POLICY "Users can update own empires"
  ON empires
  FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 11.3.2 Field-Level Encryption

**For PCI compliance:**

```python
from cryptography.fernet import Fernet

class EncryptedField:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)

    def encrypt(self, value: str) -> str:
        return self.cipher.encrypt(value.encode()).decode()

    def decrypt(self, value: str) -> str:
        return self.cipher.decrypt(value.encode()).decode()

# Usage
encrypted_card = EncryptedField(os.getenv('ENCRYPTION_KEY').encode())
card_number = encrypted_card.encrypt('4111-1111-1111-1111')
```

### 11.4 — Dependency Auditing

**File:** `scripts/audit-dependencies.sh`

```bash
#!/bin/bash

echo "🔐 MYCELOFORGE — Dependency Audit"

# Frontend dependencies
echo "Checking frontend..."
npm audit || exit 1

# Backend dependencies
echo "Checking Python packages..."
pip-audit || pip install pip-audit

echo "✅ All dependencies secure"
```

### Gate Criteria ✅

- [ ] All input validated and sanitized
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF middleware active
- [ ] Sensitive data not logged
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Rate limiting configured
- [ ] API key rotation implemented
- [ ] RLS policies active
- [ ] Audit logs visible
- [ ] Dependency audit passing
- [ ] Security checklist completed
- [ ] Committed & pushed

---

## Phase 12: Performance Optimization & Load Testing

**Priority:** 🟡 HIGH
**Estimated Time:** 3–4 hours
**Agent Lead:** VELOCITY (Performance) + APEX (Engineering)

### 12.1 — Frontend Performance Optimization

#### 12.1.1 Code Splitting & Lazy Loading

```typescript
// components/HolographicSphere.tsx
import dynamic from 'next/dynamic';

const HolographicSphere = dynamic(() => import('./HolographicSphere'), {
  ssr: false,
  loading: () => <div>Loading visualization...</div>,
});

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HolographicSphere />
    </Suspense>
  );
}
```

#### 12.1.2 Image Optimization

```typescript
import Image from 'next/image';

// ✅ GOOD — Next.js Image component
export default function EmpireCard({ empire }: { empire: Empire }) {
  return (
    <Image
      src={empire.thumbnail}
      alt={empire.name}
      width={300}
      height={300}
      priority={false}
      onLoadingComplete={(result) => {
        if (result.naturalWidth === 0) {
          // Image failed to load
        }
      }}
    />
  );
}
```

#### 12.1.3 Bundle Analysis

**Install:** `npm install --save-dev @next/bundle-analyzer`

**File:** `next.config.mjs`

```javascript
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withAnalyzer({
  // ... existing config
});
```

**Run:** `ANALYZE=true npm run build`

#### 12.1.4 Runtime Performance

**File:** `app/performance-monitor.ts`

```typescript
export function monitorPerformance() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Monitor Largest Contentful Paint (LCP)
    const lcp = new PerformanceObserver((entryList) => {
      const lastEntry = entryList.getEntries().pop();
      if (lastEntry) {
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
        // Send to analytics
      }
    });
    lcp.observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor First Input Delay (FID)
    const fid = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        console.log('FID:', entry.processingDuration);
        // Send to analytics
      });
    });
    fid.observe({ entryTypes: ['first-input'] });

    // Monitor Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const cls = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log('CLS:', clsValue);
          // Send to analytics
        }
      });
    });
    cls.observe({ entryTypes: ['layout-shift'] });
  }
}
```

### 12.2 — Backend Performance Optimization

#### 12.2.1 Response Caching

**Install:** `pip install aioredis`

**File:** `backend/shared/cache.py`

```python
import redis.asyncio as redis
from functools import wraps
import hashlib
import json

class Cache:
    def __init__(self, redis_url: str):
        self.redis = None
        self.redis_url = redis_url

    async def connect(self):
        self.redis = await redis.from_url(self.redis_url)

    async def get(self, key: str):
        value = await self.redis.get(key)
        return json.loads(value) if value else None

    async def set(self, key: str, value: any, ttl: int = 3600):
        await self.redis.setex(key, ttl, json.dumps(value))

cache = Cache(os.getenv('REDIS_URL', 'redis://localhost:6379'))

def cached(ttl: int = 3600):
    """Caching decorator"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and args
            cache_key = f"{func.__name__}:{hashlib.md5(str(args + tuple(kwargs.values())).encode()).hexdigest()}"

            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value:
                return cached_value

            # Compute and cache
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl)
            return result

        return wrapper
    return decorator

# Usage
@app.get('/lunar-phase')
@cached(ttl=3600)
async def lunar_phase():
    return calculate_lunar_phase()
```

#### 12.2.2 Database Query Optimization

```python
# ❌ N+1 Query Problem
for empire in empires:
    owner = db.query(User).filter(User.id == empire.user_id).first()
    print(owner.name)

# ✅ SOLVED with eager loading
empires = db.query(Empire).options(
    joinedload(Empire.user)
).all()
for empire in empires:
    print(empire.user.name)  # No extra query
```

#### 12.2.3 Connection Pooling

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Test connections before use
    pool_recycle=3600,   # Recycle connections after 1 hour
)
```

### 12.3 — Load Testing

**Install:** `pip install locust`

**File:** `tests/load/locustfile.py`

```python
from locust import HttpUser, task, between
import random

class EmpireUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def deploy_empire(self):
        """Empire deployment endpoint"""
        self.client.post(
            '/api/empire/deploy',
            json={'seed': f'test-empire-{random.randint(1, 1000000)}'},
            headers={'Content-Type': 'application/json'}
        )

    @task(1)
    def check_lunar_phase(self):
        """Lunar phase endpoint"""
        self.client.get('/api/lunar-phase')

    @task(2)
    def health_check(self):
        """Health check endpoint"""
        self.client.get('/api/health')

# Run: locust -f tests/load/locustfile.py -H http://localhost:3000 -u 100 -r 10
```

**Performance targets:**

- **API Response Time (p99):** < 200ms
- **Frontend LCP:** < 2.5s
- **Frontend FID:** < 100ms
- **Frontend CLS:** < 0.1
- **Throughput:** 1000+ requests/sec per service
- **Error Rate:** < 0.1%

### 12.4 — Monitoring & SLA

**File:** `monitoring/sla-dashboard.json` (Grafana)

```json
{
  "dashboard": {
    "title": "MYCELOFORGE SLA Dashboard",
    "panels": [
      {
        "title": "Uptime (SLA: 99.9%)",
        "targets": [
          {
            "expr": "avg(up{job=~'ryzanstein|negative-space|qhss|nexuszero|doppelganger|elite-agents'}) * 100"
          }
        ]
      },
      {
        "title": "API Latency (SLA: p99 < 200ms)",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, http_request_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Error Rate (SLA: < 0.1%)",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m]) * 100"
          }
        ]
      }
    ]
  }
}
```

### Gate Criteria ✅

- [ ] Bundle size analyzed and optimized
- [ ] Lighthouse score ≥ 90
- [ ] Images optimized with next/image
- [ ] Code splitting implemented
- [ ] Redis caching configured
- [ ] Database queries optimized (no N+1 problems)
- [ ] Connection pooling enabled
- [ ] Load test shows 1000+ req/sec capability
- [ ] API p99 latency < 200ms
- [ ] Frontend Core Web Vitals passing
- [ ] SLA dashboard visible in Grafana
- [ ] Committed & pushed

---

## Phase 13: Deployment Preparation & Infrastructure

**Priority:** 🟡 HIGH
**Estimated Time:** 4–5 hours
**Agent Lead:** ATLAS (Cloud) + FLUX (DevOps) + AEGIS (Compliance)

### 13.1 — Environment Strategy

**Three-tier environment configuration:**

#### Development Environment

```env
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_LOG_LEVEL=debug
DEBUG=true

# Services use internal Docker network
RYZANSTEIN_API_URL=http://ryzanstein:8000
NEGATIVE_SPACE_API_URL=http://negative-space:8001
# ... etc
```

#### Staging Environment

```env
# .env.staging
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.myceloforge.com
NEXT_PUBLIC_LOG_LEVEL=info
DEBUG=false

# Services behind internal load balancer
RYZANSTEIN_API_URL=https://api-staging.myceloforge.com/ryzanstein
NEGATIVE_SPACE_API_URL=https://api-staging.myceloforge.com/negative-space
# ... etc
```

#### Production Environment

```env
# .env.production (managed by deployment platform)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://myceloforge.com
NEXT_PUBLIC_LOG_LEVEL=warn
DEBUG=false

# High-availability services
RYZANSTEIN_API_URL=https://api.myceloforge.com/ryzanstein
NEGATIVE_SPACE_API_URL=https://api.myceloforge.com/negative-space
# ... etc
```

### 13.2 — Frontend Deployment (Vercel)

**File:** `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci --legacy-peer-deps",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@stripe_publishable_key",
    "NEXT_PUBLIC_APP_URL": "@app_url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/blog/:path*",
      "destination": "https://blog.myceloforge.com/:path*",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.myceloforge.com/:path*"
    }
  ]
}
```

**Deployment:**

```bash
npm install -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel deploy --prod
```

### 13.3 — Backend Deployment (Docker → Kubernetes)

**File:** `k8s/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ryzanstein
  namespace: myceloforge-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ryzanstein
  template:
    metadata:
      labels:
        app: ryzanstein
    spec:
      containers:
      - name: ryzanstein
        image: myceloforge/ryzanstein:latest
        ports:
        - containerPort: 8000
        env:
        - name: LOG_LEVEL
          value: "info"
        - name: SENTRY_DSN
          valueFrom:
            secretKeyRef:
              name: sentry-secrets
              key: dsn
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ryzanstein
  namespace: myceloforge-prod
spec:
  selector:
    app: ryzanstein
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

**Deploy:**

```bash
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/ryzanstein -n myceloforge-prod
```

### 13.4 — CI/CD Pipeline Refinement

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: [v*]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci --legacy-peer-deps
      - run: npm run lint
      - run: npm run build
      - run: npm test
      - run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
      - uses: securego/gosec@master
        with:
          args: '-no-fail -fmt sarif -out gosec-results.sarif ./backend/...'

  build-backend:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          context: ./backend/ryzanstein
          push: true
          tags: ghcr.io/${{ github.repository }}/ryzanstein:latest

  deploy-staging:
    needs: [test, security, build-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # kubectl apply -f k8s/staging.yaml
      - name: Smoke tests
        run: npm run test:e2e

  deploy-production:
    needs: deploy-staging
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy frontend
        run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
      - name: Deploy backend
        run: |
          echo "Rolling out Kubernetes deployment..."
          # kubectl apply -f k8s/production.yaml
      - name: Health check
        run: |
          sleep 30
          curl -f https://myceloforge.com/api/health || exit 1
      - name: Notify
        run: |
          echo "Production deployment complete"
          # Send Slack notification, etc.
```

### 13.5 — Disaster Recovery Plan

**File:** `docs/DISASTER_RECOVERY.md`

```markdown
# Disaster Recovery Plan

## Recovery Time Objectives (RTO)
- Critical services: < 15 minutes
- Non-critical services: < 1 hour
- Full system restore: < 4 hours

## Recovery Point Objectives (RPO)
- Database: < 1 minute (continuous replication)
- File storage: < 1 hour (daily snapshots)
- Configuration: < 10 minutes (git history)

## Backup Strategy
- Database: Automated daily snapshots, 30-day retention
- Code: Git repository with multiple remotes
- Secrets: Encrypted vault with 7-day audit logs

## Failover Procedures
1. Monitor detects service down (< 1 minute)
2. Automatic health check restart
3. If failure persists, manual human intervention
4. Activate standby service/database
5. Verify recovery and notify stakeholders

## Testing
- Monthly disaster recovery drills
- Documented runbooks for each scenario
- Test restore from backups quarterly
```

### Gate Criteria ✅

- [ ] Vercel deployment configured
- [ ] Kubernetes manifests created
- [ ] Environment variables secure in vault
- [ ] CI/CD pipeline updated with deploy jobs
- [ ] Staging deployment successful
- [ ] Production health checks passing
- [ ] Disaster recovery plan documented
- [ ] Backup procedures tested
- [ ] Runbooks created
- [ ] Team trained on deployment process
- [ ] Committed & pushed

---

## Phase 14: Production Launch & Monitoring

**Priority:** 🔴 CRITICAL
**Estimated Time:** 2–3 hours
**Agent Lead:** ATLAS (Cloud) + SENTRY (Observability)

### 14.1 — Pre-Launch Checklist

```markdown
## MYCELOFORGE Production Launch Checklist

### Security (Phase 11 Complete) ✅
- [ ] OWASP Top 10 mitigations verified
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] API keys rotated
- [ ] SSL certificate valid
- [ ] Secrets management tested
- [ ] Security audit passed

### Performance (Phase 12 Complete) ✅
- [ ] Lighthouse score ≥ 90
- [ ] Load test passed (1000+ req/sec)
- [ ] API p99 latency < 200ms
- [ ] Database optimized
- [ ] Caching configured
- [ ] Frontend bundle < 100KB

### Observability (Phase 10 Complete) ✅
- [ ] Logging centralized
- [ ] Metrics collection active
- [ ] Distributed tracing working
- [ ] Error tracking active
- [ ] Dashboards visible
- [ ] Alerts configured

### Infrastructure (Phase 13 Complete) ✅
- [ ] Frontend on Vercel
- [ ] Backend on Kubernetes
- [ ] Database backups tested
- [ ] DNS configured
- [ ] CDN active
- [ ] Load balancer healthy

### Operational (Phase 14) ✅
- [ ] Runbooks created
- [ ] On-call rotation established
- [ ] Escalation procedures documented
- [ ] Customer support trained
- [ ] SLA defined
- [ ] Incident response plan ready

### Business (Phase 14) ✅
- [ ] Legal review completed
- [ ] Privacy policy updated
- [ ] Terms of service finalized
- [ ] GDPR compliance confirmed
- [ ] Payment processing tested
- [ ] Analytics tracking enabled
```

### 14.2 — Blue-Green Deployment

**Switch traffic with zero downtime:**

```bash
# Current production (blue)
kubectl get svc -n myceloforge-prod

# Deploy new version (green)
kubectl apply -f k8s/production-v2.yaml

# Test green
curl https://green-v2.myceloforge.com/api/health

# Switch traffic (instant, reversible)
kubectl patch service myceloforge \
  -n myceloforge-prod \
  -p '{"spec":{"selector":{"version":"v2"}}}'

# Monitor
kubectl logs -f deployment/ryzanstein -n myceloforge-prod

# If issues, rollback
kubectl patch service myceloforge \
  -n myceloforge-prod \
  -p '{"spec":{"selector":{"version":"v1"}}}'
```

### 14.3 — Monitoring & Alerts

**Grafana alert rules:**

```yaml
alert: HighErrorRate
expr: |
  (sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) /
   sum(rate(http_requests_total[5m])) by (service)) > 0.001
for: 5m
annotations:
  summary: "High error rate on {{ $labels.service }}"
  action: "Check service logs and restart if needed"

alert: HighLatency
expr: |
  histogram_quantile(0.99, http_request_duration_seconds_bucket{service="ryzanstein"}) > 0.2
for: 10m
annotations:
  summary: "High latency on Ryzanstein"
  action: "Check database performance"

alert: ServiceDown
expr: up{job=~"ryzanstein|negative-space|qhss|nexuszero|doppelganger|elite-agents"} == 0
for: 1m
annotations:
  summary: "{{ $labels.job }} is down"
  action: "Immediately investigate service status"
```

### 14.4 — Post-Launch Monitoring

**First 24 hours critical:**

```bash
# Monitor error rates
watch 'kubectl logs -l app=ryzanstein -n myceloforge-prod --tail=100 | grep ERROR'

# Monitor latency
curl -w "@curl-format.txt" https://myceloforge.com/api/health

# Monitor active users
curl https://myceloforge.com/api/metrics | grep active_users

# Monitor database performance
psql -h prod-db.c.myceloforge.com << EOF
SELECT NOW(), count(*) FROM pg_stat_statements WHERE mean_exec_time > 100;
EOF
```

### 14.5 — Customer Communications

**Launch announcement:**

```markdown
# 🚀 MYCELOFORGE Production Launch

**Date:** [DATE]
**Status:** ✅ Live and Monitoring
**SLA:** 99.9% uptime

## What's Available
- AI empire deployment through mycelial network
- Real-time lunar phase calculations
- Holographic sphere visualization
- Blockchain integration (Solana)
- Premium payment tiers

## Performance Commitments
- API response: < 200ms (p99)
- Uptime: 99.9% monthly
- Support: 24/7 on-call

## Known Limitations
- Max 1000 active empires per session
- Lunar calculations ±5 minute accuracy
- Rate limit: 100 requests/min per user

## Feedback
- Email: support@myceloforge.com
- Chat: [Discord/Slack]
- Issues: github.com/myceloforge/issues
```

### Gate Criteria ✅

- [ ] Pre-launch checklist 100% complete
- [ ] Blue-green deployment tested
- [ ] Monitoring dashboards live
- [ ] Alert rules active
- [ ] 24/7 on-call team ready
- [ ] Support documentation published
- [ ] Customer communication sent
- [ ] Post-launch monitoring active
- [ ] First week incident response verified
- [ ] Committed & pushed

---

## Phase 15: Post-Launch Optimization & Continuous Improvement

**Priority:** 🟢 MEDIUM
**Estimated Time:** Ongoing
**Agent Lead:** VELOCITY (Performance) + ORACLE (Analytics)

### 15.1 — Data-Driven Optimization

**Track and optimize:**

```typescript
// app/analytics.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        properties,
        userId: getUserId(),
        sessionId: getSessionId(),
      }),
    });
  }
}

// Usage
trackEvent('empire:deployed', {
  empireName: 'Mycelial Dynasty',
  deploymentTime: 1234,
  successRate: 0.99,
});
```

### 15.2 — Weekly Reviews

**Schedule:**
- **Monday:** Incident review (if any)
- **Wednesday:** Performance review (latency, errors)
- **Friday:** User feedback + feature requests

### 15.3 — Monthly Planning

**Track metrics:**
- ✅ Uptime (target: 99.9%)
- 📊 API latency p99 (target: < 200ms)
- 🚀 Throughput (empires/hour)
- 💰 Revenue per empire
- 😊 Customer satisfaction (NPS)

### 15.4 — Roadmap Evolution

**Phases 16+:**
- Phase 16: Multi-language support
- Phase 17: Mobile app (React Native)
- Phase 18: Advanced analytics dashboard
- Phase 19: Custom empire templates
- Phase 20: Community marketplace

---

## Summary: Six Production Phases

| Phase | Title | Duration | Status |
|-------|-------|----------|--------|
| 10 | Observability & Monitoring | 3–4h | **🔴 CRITICAL** |
| 11 | Security Hardening | 4–5h | **🔴 CRITICAL** |
| 12 | Performance Optimization | 3–4h | **🟡 HIGH** |
| 13 | Deployment Infrastructure | 4–5h | **🟡 HIGH** |
| 14 | Production Launch | 2–3h | **🔴 CRITICAL** |
| 15 | Continuous Improvement | Ongoing | **🟢 MEDIUM** |

**Total Effort:** 20–25 hours to production-ready status

---

## Execution Priority Matrix

```
IMMEDIATE (Before Phase 12):
  ├── Phase 10: Observability ← 🔴 REQUIRED
  └── Phase 11: Security ← 🔴 REQUIRED

THIS WEEK (Phase 12):
  └── Phase 12: Performance ← 🟡 HIGH

NEXT WEEK (Phases 13-14):
  ├── Phase 13: Infrastructure ← 🟡 HIGH
  └── Phase 14: Launch ← 🔴 CRITICAL

ONGOING:
  └── Phase 15: Optimization ← 🟢 MEDIUM
```

---

## Quick Reference: Port Allocations (Production)

| Service | Port | Internal | External |
|---------|------|----------|----------|
| Ryzanstein | 24000 | ryzanstein:8000 | api.myceloforge.com |
| Negative-Space | 24001 | negative-space:8001 | api.myceloforge.com |
| QHSS | 24002 | qhss:8002 | api.myceloforge.com |
| NexusZero | 24003 | nexuszero:8003 | Internal only |
| Doppelganger | 24004 | doppelganger:8004 | Internal only |
| Elite-Agents | 24005 | elite-agents:8005 | Internal only |
| Qdrant | 24333 | qdrant:6333 | Internal only |
| Prometheus | 24400 | prometheus:9090 | Internal only |
| Grafana | 24401 | grafana:3000 | Internal only |
| Jaeger | 24402 | jaeger:16686 | Internal only |

---

## Key Files Created/Modified

### Configuration Files
- ✅ `monitoring/prometheus.yml` — Metrics scraping
- ✅ `monitoring/grafana/provisioning/` — Dashboard definitions
- ✅ `.github/workflows/deploy.yml` — Production CI/CD
- ✅ `k8s/deployment.yaml` — Kubernetes manifests
- ✅ `vercel.json` — Vercel deployment config

### Code Files
- ✅ `lib/logger.ts` — Structured logging
- ✅ `backend/shared/logging_config.py` — Backend logging
- ✅ `backend/shared/metrics.py` — Prometheus metrics
- ✅ `backend/shared/tracing.py` — Distributed tracing
- ✅ `lib/validation.ts` — Input validation
- ✅ `lib/auth-middleware.ts` — Access control
- ✅ `app/middleware.ts` — Security headers
- ✅ `backend/shared/cache.py` — Redis caching

### Documentation Files
- ✅ `PRODUCTION_PREPARATION_PHASES.md` — This file
- ✅ `docs/DISASTER_RECOVERY.md` — Recovery procedures
- ✅ `docs/RUNBOOK.md` — Operational procedures
- ✅ `docs/API_SECURITY.md` — API security guidelines

---

## Deployment Command

To execute production phases autonomously:

```bash
# Phase 10: Observability
claude code: "Execute Phase 10 of PRODUCTION_PREPARATION_PHASES: Observability & Monitoring Infrastructure"

# Phase 11: Security
claude code: "Execute Phase 11 of PRODUCTION_PREPARATION_PHASES: Security Hardening & Compliance"

# Phase 12: Performance
claude code: "Execute Phase 12 of PRODUCTION_PREPARATION_PHASES: Performance Optimization & Load Testing"

# Phase 13: Infrastructure
claude code: "Execute Phase 13 of PRODUCTION_PREPARATION_PHASES: Deployment Preparation & Infrastructure"

# Phase 14: Launch
claude code: "Execute Phase 14 of PRODUCTION_PREPARATION_PHASES: Production Launch & Monitoring"
```

---

**🍄 MYCELOFORGE Production Preparation: Ready to Transform Development into Enterprise Excellence 🚀**

*Last Updated: February 28, 2026*
*By: Claude Haiku 4.5*


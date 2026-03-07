/**
 * Security middleware for MYCELOFORGE
 * Implements OWASP security headers and CSRF protection
 */

import { NextResponse, NextRequest } from 'next/server';

/**
 * Security headers to add to all responses
 * Prevents: XSS, clickjacking, MIME type sniffing, etc.
 */
const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking (UI redressing)
  'X-Frame-Options': 'DENY',

  // Enable XSS protection in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Restrict browser features (geolocation, camera, microphone)
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

  // Content Security Policy (strict XSS protection)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.stripe.com https://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    'base-uri "self"',
    'form-action "self"',
    'upgrade-insecure-requests',
  ].join('; '),

  // HTTP Strict Transport Security (HTTPS only in production)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CSRF Protection: Validate origin for state-changing operations
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Allowed origins (add your domains here)
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://myceloforge.com',
      'https://www.myceloforge.com',
    ];

    // Check origin header
    if (origin && !allowedOrigins.some((allowed) => origin.includes(new URL(allowed).origin))) {
      return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
    }

    // Check referer header as fallback
    if (referer) {
      const refererUrl = new URL(referer);
      const allowedOriginUrls = allowedOrigins.map((url) => new URL(url).origin);

      if (!allowedOriginUrls.some((allowed) => refererUrl.origin === allowed)) {
        return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
      }
    }
  }

  // Add request ID for tracing
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  response.headers.set('x-request-id', requestId);

  // Add security timestamp header
  response.headers.set('x-request-time', new Date().toISOString());

  // Prevent caching of sensitive pages
  if (request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/dashboard')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    // Include all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

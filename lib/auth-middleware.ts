/**
 * Authentication and authorization middleware for MYCELOFORGE
 * Implements broken access control prevention and verified ownership checks
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Check if request is authenticated and return user info
 */
export async function checkAuth(req: NextRequest): Promise<{ userId: string; email: string } | null> {
  try {
    // Extract authorization header (Bearer token)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserById(token);

    if (error || !user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email || '',
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Check if user owns the specified empire (prevents IDOR)
 */
export async function checkEmpireOwnership(
  userId: string,
  empireId: string
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await supabase
      .from('empires')
      .select('id')
      .eq('id', empireId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Ownership check failed:', error);
    return false;
  }
}

/**
 * Middleware function to require authentication
 *
 * Usage in API routes:
 * export async function POST(req: NextRequest) {
 *   const auth = await requireAuth(req);
 *   if (!auth) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // Safe to use auth.userId
 * }
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ userId: string; email: string } | null> {
  const auth = await checkAuth(req);

  if (!auth) {
    return null;
  }

  return auth;
}

/**
 * Middleware to require authentication AND resource ownership
 * Prevents Broken Access Control attacks (OWASP #5)
 */
export async function requireAuthAndOwnership(
  req: NextRequest,
  resourceUserId: string
): Promise<boolean> {
  const auth = await checkAuth(req);

  if (!auth) {
    return false;
  }

  // Verify user owns the resource
  if (auth.userId !== resourceUserId) {
    return false;
  }

  return true;
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(req: NextRequest, allowedOrigins: string[]): boolean {
  const origin = req.headers.get('origin');

  if (!origin) {
    // Allow same-site requests (no origin header)
    return true;
  }

  return allowedOrigins.some((allowed) => {
    try {
      const allowedUrl = new URL(allowed);
      const originUrl = new URL(origin);
      return allowedUrl.origin === originUrl.origin;
    } catch {
      return false;
    }
  });
}

/**
 * Extract and validate request ID for logging/tracing
 */
export function getRequestId(req: NextRequest): string {
  const requestId = req.headers.get('x-request-id') || req.headers.get('x-correlation-id');

  if (requestId && /^[a-f0-9\-]{36}$/i.test(requestId)) {
    return requestId;
  }

  // Generate new request ID if not provided
  return crypto.randomUUID();
}

/**
 * Check for admin role (broken access control prevention)
 */
export async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}

/**
 * Audit log for sensitive operations
 */
export async function auditLog(userId: string, action: string, resource: string, details?: Record<string, unknown>) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Audit log failed:', error);
    // Don't throw - audit failures shouldn't block operations
  }
}

/**
 * Session security configuration
 */
export const SessionConfig = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  httpOnly: true, // Prevent XSS access to session
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const, // CSRF protection
};

/**
 * Secure cookie options
 */
export const SecureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

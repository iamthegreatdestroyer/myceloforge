/**
 * Input validation and sanitization for MYCELOFORGE
 * Uses Zod for schema validation with strong type safety
 */

import { z } from 'zod';

/**
 * Empire name validation schema
 * - 3-100 characters
 * - Alphanumeric, spaces, and hyphens only
 * - No special characters or injection attempts
 */
export const EmpireNameSchema = z
  .string()
  .min(3, 'Empire name must be at least 3 characters')
  .max(100, 'Empire name cannot exceed 100 characters')
  .regex(/^[a-zA-Z0-9\s\-]+$/, 'Empire name can only contain letters, numbers, spaces, and hyphens')
  .transform((val) => val.trim());

/**
 * Deployment seed validation schema
 * - 5-1000 characters
 * - Base validation, content is sanitized server-side
 */
export const DeploymentSeedSchema = z
  .string()
  .min(5, 'Deployment seed must be at least 5 characters')
  .max(1000, 'Deployment seed cannot exceed 1000 characters')
  .transform((val) => val.trim());

/**
 * User email validation schema
 * - Standard email format
 * - Internationalized domain names supported
 */
export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .max(255, 'Email cannot exceed 255 characters');

/**
 * Password validation schema
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

/**
 * Solana wallet address validation
 * - 44 characters
 * - Base58 encoding
 */
export const SolanaAddressSchema = z
  .string()
  .length(44, 'Invalid Solana address')
  .regex(/^[1-9A-HJ-NP-Z]{44}$/, 'Invalid Solana address format');

/**
 * API key validation
 * - Minimum 32 characters
 * - Alphanumeric with underscores
 */
export const ApiKeySchema = z
  .string()
  .min(32, 'API key must be at least 32 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'API key can only contain alphanumeric characters and underscores');

/**
 * Validate empire deployment request
 */
export const EmpireDeploymentRequestSchema = z.object({
  seed: DeploymentSeedSchema,
  name: EmpireNameSchema.optional(),
  userId: z.string().uuid().optional(),
});

export type EmpireDeploymentRequest = z.infer<typeof EmpireDeploymentRequestSchema>;

/**
 * Validate user registration
 */
export const UserRegistrationSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
});

export type UserRegistration = z.infer<typeof UserRegistrationSchema>;

/**
 * Validate user login
 */
export const UserLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;

/**
 * Generic validation function with error handling
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { valid: false, error: messages };
    }
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Sanitize string input to prevent XSS
 * Note: React automatically escapes by default, but this is for extra safety
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .trim();
}

/**
 * Validate and sanitize empire deployment input
 */
export function validateEmpireDeployment(data: unknown) {
  const result = validateData(EmpireDeploymentRequestSchema, data);
  if (result.valid) {
    // Additional server-side sanitization (defense in depth)
    return {
      valid: true,
      data: {
        ...result.data,
        seed: sanitizeString(result.data.seed),
        name: result.data.name ? sanitizeString(result.data.name) : undefined,
      },
    };
  }
  return result;
}

/**
 * Rate limiting configuration
 */
export const RateLimitConfig = {
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  // Empire deployment (moderate)
  deploy: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 deployments per minute
  },
};

/**
 * Security headers configuration
 */
export const SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

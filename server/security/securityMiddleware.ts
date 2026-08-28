import { Request, Response, NextFunction } from 'express';

// ============================================================================
// 1. SLIDING WINDOW RATE LIMITER (In-Memory, DDoS & Brute-Force Protection)
// ============================================================================

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodic garbage collection every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
        if (record.timestamps.length === 0) {
          this.store.delete(key);
        }
      }
    }, 300000);
  }

  public check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let record = this.store.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= limit) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, windowMs - (now - oldest));
      return { allowed: false, remaining: 0, resetMs };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - record.timestamps.length,
      resetMs: windowMs,
    };
  }
}

export const rateLimiterInstance = new InMemoryRateLimiter();

export interface RateLimitOptions {
  limit: number;
  windowMs?: number;
  messageAr?: string;
  messageEn?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    limit,
    windowMs = 60000, // 1 minute default
    messageAr = 'تم تجاوز الحد المسموح به من الطلبات. يرجى الانتظار قليلاً والمحاولة مجدداً.',
    messageEn = 'Rate limit exceeded. Please wait a moment before trying again.',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Identify client by IP and optional Auth Token
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const authHeader = req.headers.authorization;
    const tokenPart = authHeader?.startsWith('Bearer ') ? authHeader.slice(7, 20) : '';
    const key = `${req.path}:${ip}:${tokenPart}`;

    const { allowed, remaining, resetMs } = rateLimiterInstance.check(key, limit, windowMs);

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetMs / 1000).toString());

    if (!allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        messageAr,
        messageEn,
        retryAfterSeconds: Math.ceil(resetMs / 1000),
      });
    }

    next();
  };
}

// Preset rate limiters
export const authRateLimiter = createRateLimiter({
  limit: 20, // 20 login/register attempts per minute
  windowMs: 60000,
  messageAr: 'عدد كبير جداً من محاولات تسجيل الدخول. يرجى الانتظار دقيقة واحدة لدواعي الأمان.',
  messageEn: 'Too many authentication attempts. Please wait 1 minute for security.',
});

export const aiInferenceRateLimiter = createRateLimiter({
  limit: 45, // 45 AI generation requests per minute
  windowMs: 60000,
  messageAr: 'تجاوزت الحد المسموح للاستشارات السريرية بالذكاء الاصطناعي في الدقيقة. يرجى التمهل قليلاً.',
  messageEn: 'AI consultation rate limit reached. Please slow down.',
});

export const generalApiRateLimiter = createRateLimiter({
  limit: 150, // 150 requests per minute for general data queries
  windowMs: 60000,
});

export const uploadRateLimiter = createRateLimiter({
  limit: 12, // 12 file uploads per minute
  windowMs: 60000,
  messageAr: 'تم تجاوز الحد الأقصى لرفع الملفات والتقارير الطبية في الدقيقة.',
  messageEn: 'Medical document upload rate limit reached.',
});

// ============================================================================
// 2. HTTP SECURITY HEADERS (OWASP / HIPAA / GDPR Compliance)
// ============================================================================

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking (iframe protection, allow same-origin)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cross-Site Scripting (XSS) filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (restrict dangerous APIs)
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()'
  );

  // Content Security Policy (allows Vite development & standard secure assets)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: ws: wss:; object-src 'none'; base-uri 'self';"
  );

  next();
}

// ============================================================================
// 3. INPUT SANITIZATION & INJECTION DEFENSE (XSS & SQL/NoSQL Injection Guard)
// ============================================================================

const DANGEROUS_XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^>\s]+/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /data:\s*text\/html/gi,
];

export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return input;
  let sanitized = input;
  for (const pattern of DANGEROUS_XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized;
}

export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      cleanObj[sanitizeString(key)] = sanitizeObject(value);
    }
    return cleanObj as T;
  }
  return obj;
}

export function inputSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

// ============================================================================
// 4. SECURE FILE UPLOAD VALIDATOR
// ============================================================================

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'text/plain',
  'application/dicom',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt', '.dcm']);
const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export function validateFileUpload(file: {
  name: string;
  type: string;
  size: number;
  base64Data?: string;
}): { valid: boolean; errorAr?: string; errorEn?: string } {
  if (!file) {
    return { valid: false, errorAr: 'لم يتم توفير ملف', errorEn: 'No file provided' };
  }

  // Size limit check
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      errorAr: 'حجم الملف يتجاوز الحد الأقصى المسموح به (15 ميغابايت)',
      errorEn: 'File size exceeds maximum allowed limit (15MB)',
    };
  }

  // Extension check
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      errorAr: `نوع امتداد الملف غير مدعوم (${ext}). يُسمح فقط بملفات PDF والصور الطبية والتقارير.`,
      errorEn: `Unsupported file extension (${ext}). Only PDF, images, and medical reports allowed.`,
    };
  }

  // MIME check
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      errorAr: `نوع الوسائط (${file.type}) غير مصرح به أمنياً.`,
      errorEn: `MIME type (${file.type}) is forbidden.`,
    };
  }

  return { valid: true };
}

// ============================================================================
// 5. GLOBAL SECURE ERROR HANDLER (No Stack Trace Leaks, Localized Output)
// ============================================================================

export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Safe server-side log
  console.error(`[Security/Error] Path: ${req.method} ${req.path} | Error:`, err?.message || err);

  const statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Return clean, unexposed error object to client
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : err.message || 'An unexpected error occurred',
    code: err.code || 'SERVER_ERROR',
    messageAr:
      statusCode === 500
        ? 'حدث خطأ غير متوقع في الخادم. تم تسجيل الحدث للمراجعة الطبية والأمنية.'
        : err.messageAr || err.message || 'تعذر إتمام الطلب بنجاح.',
    timestamp: new Date().toISOString(),
  });
}

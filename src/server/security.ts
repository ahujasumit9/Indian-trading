import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// In-Memory Rate Limiter (Sliding Window per IP)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function createRateLimiter(windowMs: number = 60000, maxRequests: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      logSecurityAudit('RATE_LIMIT_EXCEEDED', { ip, url: req.originalUrl });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please throttle requests.',
        retryAfterMs: record.resetTime - now,
      });
    }

    record.count++;
    next();
  };
}

// Webhook Secret Validation Middleware
export function validateWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const configuredSecret = process.env.TRADINGVIEW_WEBHOOK_SECRET || 'india-ai-trader-secret-2026';
  const providedSecret =
    req.headers['x-tradingview-secret'] ||
    req.headers['x-webhook-secret'] ||
    (req.query.secret as string) ||
    req.body.secret;

  // Allow open demo mode if explicitly configured, otherwise require match
  if (configuredSecret && configuredSecret !== 'none') {
    if (!providedSecret || providedSecret !== configuredSecret) {
      logSecurityAudit('WEBHOOK_AUTH_FAILED', {
        ip: req.ip,
        provided: providedSecret ? '[REDACTED]' : 'MISSING',
      });
      return res.status(401).json({
        error: 'Unauthorized Webhook',
        message: 'Invalid or missing X-TradingView-Secret header or secret parameter.',
      });
    }
  }

  next();
}

// Idempotency & Duplicate Webhook/Order Protection
const seenPayloadHashes = new Map<string, number>();

export function isDuplicatePayload(payload: any, windowSec: number = 60): boolean {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      ticker: payload.ticker,
      price: payload.price,
      action: payload.action,
      timeframe: payload.timeframe,
      id: payload.alert_id || payload.id || '',
    }))
    .digest('hex');

  const now = Date.now();
  const expiresAt = seenPayloadHashes.get(hash);

  if (expiresAt && now < expiresAt) {
    return true; // Duplicate detected within window
  }

  // Clean old hashes periodically
  if (seenPayloadHashes.size > 1000) {
    for (const [k, exp] of seenPayloadHashes.entries()) {
      if (now > exp) seenPayloadHashes.delete(k);
    }
  }

  seenPayloadHashes.set(hash, now + windowSec * 1000);
  return false;
}

// Security Audit Logger
export interface AuditLogEntry {
  timestamp: string;
  eventType: string;
  details: Record<string, any>;
}

const auditLogs: AuditLogEntry[] = [];

export function logSecurityAudit(eventType: string, details: Record<string, any>) {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    details,
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 200) auditLogs.pop();
  console.log(`[SECURITY AUDIT] [${entry.timestamp}] ${eventType}:`, JSON.stringify(details));
}

export function getAuditLogs(): AuditLogEntry[] {
  return auditLogs;
}

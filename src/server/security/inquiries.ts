import { createHash } from 'node:crypto';

const MIN_FORM_FILL_MS = 2_500;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;

const globalForInquirySecurity = globalThis as unknown as {
  inquiryRateLimitStore?: Map<string, { count: number; resetAt: number }>;
};

function getRateLimitStore(): Map<string, { count: number; resetAt: number }> {
  if (!globalForInquirySecurity.inquiryRateLimitStore) {
    globalForInquirySecurity.inquiryRateLimitStore = new Map();
  }

  return globalForInquirySecurity.inquiryRateLimitStore;
}

function extractClientIp(headersLike: Pick<Headers, 'get'>): string | null {
  const forwardedFor = headersLike.get('x-forwarded-for');
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',');
    if (firstIp?.trim()) {
      return firstIp.trim();
    }
  }

  const realIp = headersLike.get('x-real-ip');
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return null;
}

export function getInquiryRequestMeta(headersLike: Pick<Headers, 'get'>): {
  ipHash: string | null;
  userAgent: string | null;
} {
  const ip = extractClientIp(headersLike);
  const ipHash = ip
    ? createHash('sha256').update(ip).digest('hex').slice(0, 32)
    : null;
  const userAgent = headersLike.get('user-agent')?.trim() || null;

  return { ipHash, userAgent };
}

export function validateInquirySubmission(input: {
  formStartedAt?: string | null;
  ipHash?: string | null;
  now?: number;
}): { ok: true } | { ok: false; code: 'SPAM_DETECTED' | 'RATE_LIMITED' } {
  const now = input.now ?? Date.now();

  if (input.formStartedAt) {
    const startedAt = Number.parseInt(input.formStartedAt, 10);
    if (Number.isFinite(startedAt) && startedAt > 0) {
      if (now - startedAt < MIN_FORM_FILL_MS) {
        return { ok: false, code: 'SPAM_DETECTED' };
      }
    }
  }

  if (!input.ipHash) {
    return { ok: true };
  }

  const store = getRateLimitStore();
  const current = store.get(input.ipHash);

  if (!current || current.resetAt <= now) {
    store.set(input.ipHash, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return { ok: true };
  }

  if (current.count >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return { ok: false, code: 'RATE_LIMITED' };
  }

  store.set(input.ipHash, {
    count: current.count + 1,
    resetAt: current.resetAt,
  });

  return { ok: true };
}

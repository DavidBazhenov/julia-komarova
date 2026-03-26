import { NextRequest, NextResponse } from 'next/server';

import { createInquiry, listInquiries } from '@/features/inquiries';
import { inquiryCreateInputSchema } from '@/features/inquiries/schemas';
import { assertAdminSession } from '@/server/auth';
import { getInquiryRequestMeta, validateInquirySubmission } from '@/server/security';

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'INVALID_JSON' } },
      { status: 400 },
    );
  }

  const bodyObject = typeof body === 'object' && body !== null ? body : {};
  const requestMeta = getInquiryRequestMeta(request.headers);
  const formStartedAt = typeof (bodyObject as { formStartedAt?: unknown }).formStartedAt === 'string'
    ? (bodyObject as { formStartedAt?: string }).formStartedAt
    : null;
  const antiSpam = validateInquirySubmission({
    formStartedAt,
    ipHash: requestMeta.ipHash,
  });

  if (!antiSpam.ok) {
    return NextResponse.json(
      { ok: false, error: { code: antiSpam.code } },
      { status: antiSpam.code === 'RATE_LIMITED' ? 429 : 400 },
    );
  }

  const parsed = inquiryCreateInputSchema.safeParse({
    ...bodyObject,
    userAgent: requestMeta.userAgent,
    ipHash: requestMeta.ipHash,
    source: typeof (bodyObject as { source?: unknown }).source === 'string'
      ? (bodyObject as { source?: string }).source
      : request.headers.get('referer'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const created = await createInquiry(parsed.data);

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  try {
    await assertAdminSession();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;

  const items = await listInquiries({
    status: status === 'NEW' || status === 'READ' || status === 'ARCHIVED' ? status : undefined,
    limit: parseLimit(url.searchParams.get('limit')),
  });

  return NextResponse.json({ ok: true, items });
}

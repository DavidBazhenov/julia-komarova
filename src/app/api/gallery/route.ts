import { NextRequest, NextResponse } from 'next/server';

import { loadLocalizedGalleryPage } from '@/app/[locale]/content';
import { normalizeLocale } from '@/shared/lib/i18n';

function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const categorySlug = url.searchParams.get('categorySlug') ?? url.searchParams.get('category') ?? undefined;
  const cursor = url.searchParams.get('cursor') ?? undefined;
  const locale = normalizeLocale(url.searchParams.get('locale'));

  const result = await loadLocalizedGalleryPage(locale, {
    categorySlug,
    cursor,
    limit: parseLimit(url.searchParams.get('limit')),
  });

  return NextResponse.json(result);
}

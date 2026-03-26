import { prisma } from '@/server/db';
import { notifyTelegram } from '@/server/telegram';

import type {
  InquiryCreateInput,
  InquiryListInput,
  InquiryListItem,
  InquiryUpdateStatusInput,
} from './types';
import {
  inquiryCreateInputSchema,
  inquiryListInputSchema,
} from './schemas';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function mapInquiry(record: {
  id: string;
  name: string;
  contact: string;
  message: string;
  status: 'NEW' | 'READ' | 'ARCHIVED';
  artworkId: string | null;
  artworkTitle: string | null;
  source: string | null;
  createdAt: Date;
}): InquiryListItem {
  return {
    id: record.id,
    name: record.name,
    contact: record.contact,
    message: record.message,
    status: record.status,
    artworkId: record.artworkId,
    artworkTitle: record.artworkTitle,
    source: record.source,
    createdAt: record.createdAt.toISOString(),
  };
}

function buildTelegramMessage(inquiry: InquiryListItem): string {
  const parts = [
    '<b>New inquiry</b>',
    `Name: ${escapeHtml(inquiry.name)}`,
    `Contact: ${escapeHtml(inquiry.contact)}`,
    `Message: ${escapeHtml(inquiry.message)}`,
  ];

  if (inquiry.artworkTitle) {
    parts.push(`Artwork: ${escapeHtml(inquiry.artworkTitle)}`);
  }

  if (inquiry.source) {
    parts.push(`Source: ${escapeHtml(inquiry.source)}`);
  }

  parts.push(`Created: ${escapeHtml(new Date(inquiry.createdAt).toISOString())}`);

  return parts.join('\n');
}

export async function createInquiry(input: InquiryCreateInput): Promise<{ id: string }> {
  const data = inquiryCreateInputSchema.parse(input);

  let artworkTitle: string | null = null;
  if (data.artworkId) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: data.artworkId },
      select: { title: true },
    });

    if (!artwork) {
      throw new Error(`Artwork does not exist: ${data.artworkId}`);
    }

    artworkTitle = artwork.title;
  }

  const created = await prisma.inquiry.create({
    data: {
      name: data.name,
      contact: data.contact,
      message: data.message,
      artworkId: data.artworkId ?? null,
      artworkTitle,
      source: data.source ?? null,
      userAgent: data.userAgent ?? null,
      ipHash: data.ipHash ?? null,
    },
  });

  try {
    await notifyTelegram(buildTelegramMessage(mapInquiry(created)));
  } catch {
    // Inquiries must persist even if Telegram is unavailable.
  }

  return { id: created.id };
}

export async function listInquiries(
  input: InquiryListInput = {},
): Promise<InquiryListItem[]> {
  const { status, limit } = inquiryListInputSchema.parse(input);

  const items = await prisma.inquiry.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      contact: true,
      message: true,
      status: true,
      artworkId: true,
      artworkTitle: true,
      source: true,
      createdAt: true,
    },
  });

  return items.map(mapInquiry);
}

export async function updateInquiryStatus(
  input: InquiryUpdateStatusInput,
): Promise<InquiryListItem> {
  const updated = await prisma.inquiry.update({
    where: { id: input.inquiryId },
    data: { status: input.status },
    select: {
      id: true,
      name: true,
      contact: true,
      message: true,
      status: true,
      artworkId: true,
      artworkTitle: true,
      source: true,
      createdAt: true,
    },
  });

  return mapInquiry(updated);
}

export async function getInquiryById(
  inquiryId: string,
): Promise<InquiryListItem | null> {
  const item = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      name: true,
      contact: true,
      message: true,
      status: true,
      artworkId: true,
      artworkTitle: true,
      source: true,
      createdAt: true,
    },
  });

  return item ? mapInquiry(item) : null;
}

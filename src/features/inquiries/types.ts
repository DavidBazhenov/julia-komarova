export type InquiryStatus = 'NEW' | 'READ' | 'ARCHIVED';

export type InquiryCreateInput = {
  name: string;
  contact: string;
  message: string;
  artworkId?: string | null;
  source?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
};

export type InquiryListItem = {
  id: string;
  name: string;
  contact: string;
  message: string;
  status: InquiryStatus;
  artworkId: string | null;
  artworkTitle: string | null;
  source: string | null;
  createdAt: string;
};

export type InquiryListInput = {
  status?: InquiryStatus;
  limit?: number;
};

export type InquiryUpdateStatusInput = {
  inquiryId: string;
  status: InquiryStatus;
};

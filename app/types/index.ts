// Chat types
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
};

export type ChatRequest = {
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[];
};

export type ChatResponse = {
  role: "assistant";
  content: string;
  id: string;
  timestamp: string | Date;
};

// Invoice types
export type Invoice = {
  id: string;
  clientName: string;
  clientVat?: string;
  clientAddress?: string;
  items: InvoiceItem[];
  total: number;
  tax: number;
  grandTotal: number;
  date: Date;
  status: "draft" | "sent" | "paid";
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

// Lead types
export type Lead = {
  id: string;
  businessName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  source: string;
  notes?: string;
  status: "new" | "contacted" | "qualified" | "converted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

// Website knowledge types
export type WebsiteContent = {
  id: string;
  url: string;
  title: string;
  content: string;
  type: "page" | "product" | "service" | "blog" | "other";
  lastCrawled: Date;
  embedding?: number[];
};

export type SearchQuery = {
  query: string;
  filters?: {
    type?: "page" | "product" | "service" | "blog" | "other";
    url?: string;
  };
}; 
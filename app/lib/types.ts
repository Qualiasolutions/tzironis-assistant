// Locale type
export type LocaleType = "en" | "el";

// Message interface for chat
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
  timestamp?: Date;
  isStreaming?: boolean;
  isError?: boolean;
  sources?: {
    url?: string;
    title?: string;
    score?: number;
    filename?: string;
  }[];
}

// Knowledge Base types
export interface Document {
  id: string;
  content: string;
  metadata: {
    source: string;
    [key: string]: any;
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: {
    source: string;
    [key: string]: any;
  };
  score: number;
}

// Invoice types
export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientVat?: string;
  clientAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "paid" | "overdue";
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Lead types
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  notes?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
} 
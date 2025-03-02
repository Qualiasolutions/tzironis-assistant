import { NextRequest, NextResponse } from "next/server";
import { Invoice, InvoiceItem } from "@/app/lib/types";
import { generateId } from "@/app/lib/utils";
import MistralClient from "@mistralai/mistralai";
import { extractInvoiceData } from '@/app/lib/invoice-extractor';

// Initialize the AI client
const mistralClient = new MistralClient(process.env.MISTRAL_API_KEY || "");

// Sample invoice counter (would be stored in a database in production)
let invoiceCounter = 3;

// Sample invoices (would be stored in a database in production)
const invoices: Invoice[] = [
  {
    id: "INV-001",
    number: "INV-2023-001",
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: "Acme Corp",
    clientVat: "EL123456789",
    clientAddress: "123 Business St, Athens",
    items: [
      {
        description: "Consulting Services",
        quantity: 10,
        unitPrice: 80,
        amount: 800,
      },
    ],
    subtotal: 800,
    tax: 192,
    total: 992,
    status: "pending",
  },
  {
    id: "INV-002",
    number: "INV-2023-002",
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    clientName: "TechSolutions Ltd",
    clientVat: "EL987654321",
    clientAddress: "456 Tech Ave, Thessaloniki",
    items: [
      {
        description: "Web Development",
        quantity: 1,
        unitPrice: 2000,
        amount: 2000,
      },
      {
        description: "SEO Services",
        quantity: 1,
        unitPrice: 500,
        amount: 500,
      },
    ],
    subtotal: 2500,
    tax: 600,
    total: 3100,
    status: "paid",
  },
];

// Function to parse invoice commands
async function parseInvoiceCommand(command: string): Promise<Invoice | null> {
  try {
    // In a real implementation, we would use LLM to parse the command
    // Here's a simplified version of what we'd do with advanced AI
    const response = await mistralClient.chat({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: "You are an invoice parser. Extract invoice details from the user's command.",
        },
        {
          role: "user",
          content: command,
        },
      ],
    });

    // For demo purposes, we'll just create a sample invoice
    const invoiceId = `INV-${generateId(6)}`;
    const itemTotal = 10 * 100; // quantity * unitPrice
    
    return {
      id: invoiceId,
      number: `INV-${new Date().getFullYear()}-${generateId(3)}`,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      clientName: "Demo Client",
      clientVat: "EL123456789",
      clientAddress: "123 Demo Street, Athens",
      items: [
        {
          description: "Professional Services",
          quantity: 10,
          unitPrice: 100,
          amount: itemTotal,
        },
      ],
      subtotal: itemTotal,
      tax: itemTotal * 0.24,
      total: itemTotal * 1.24,
      status: "pending",
    };
  } catch (error) {
    console.error("Error parsing invoice command:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    // Return a specific invoice if ID is provided
    if (id) {
      const invoice = invoices.find(inv => inv.id === id);
      
      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(invoice);
    }
    
    // Filter invoices if status is provided
    const status = searchParams.get("status");
    
    let filteredInvoices = [...invoices];
    
    // Apply filters if provided
    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }
    
    return NextResponse.json(filteredInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { command, invoice } = await req.json();
    
    // Handle natural language command
    if (command) {
      const newInvoice = await parseInvoiceCommand(command);
      
      if (!newInvoice) {
        return NextResponse.json(
          { error: "Could not parse invoice command" },
          { status: 400 }
        );
      }
      
      // Add to our in-memory array
      invoices.push(newInvoice);
      
      return NextResponse.json({ 
        message: "Invoice created successfully", 
        invoice: newInvoice 
      });
    }
    
    // Handle direct invoice submission
    if (invoice) {
      // Validate required fields
      if (!invoice.clientName || !invoice.items || invoice.items.length === 0) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
      
      // Generate ID if not provided
      const newInvoice: Invoice = {
        ...invoice,
        id: invoice.id || `INV-${generateId(6)}`,
        number: invoice.number || `INV-${new Date().getFullYear()}-${generateId(3)}`,
        date: invoice.date || new Date().toISOString(),
        dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: invoice.status || "pending",
      };
      
      // Calculate subtotal if not provided
      if (!newInvoice.subtotal) {
        newInvoice.subtotal = newInvoice.items.reduce((sum, item) => sum + item.amount, 0);
      }
      
      // Calculate tax if not provided
      if (!newInvoice.tax) {
        newInvoice.tax = newInvoice.subtotal * 0.24; // 24% VAT in Greece
      }
      
      // Calculate total if not provided
      if (!newInvoice.total) {
        newInvoice.total = newInvoice.subtotal + newInvoice.tax;
      }
      
      // Add to our in-memory array
      invoices.push(newInvoice);
      
      return NextResponse.json({ 
        message: "Invoice created successfully", 
        invoice: newInvoice 
      });
    }
    
    return NextResponse.json(
      { error: "No command or invoice data provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
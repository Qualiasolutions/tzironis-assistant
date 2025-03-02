import { NextRequest, NextResponse } from "next/server";
import { Invoice, InvoiceItem } from "@/app/types";
import { generateId } from "@/app/lib/utils";
import MistralClient from "@mistralai/mistralai";

// Initialize the Mistral AI client
const mistralClient = new MistralClient(process.env.MISTRAL_API_KEY || "");

// Sample invoice counter (would be stored in a database in production)
let invoiceCounter = 3;

// Sample stored invoices (would be stored in a database in production)
const storedInvoices: Invoice[] = [
  {
    id: "INV-001",
    clientName: "Acme Corp",
    clientVat: "EL123456789",
    clientAddress: "123 Business St, Athens",
    items: [
      {
        id: "item-1",
        description: "Consulting Services",
        quantity: 10,
        unitPrice: 80,
        total: 800,
      },
    ],
    total: 800,
    tax: 192,
    grandTotal: 992,
    date: new Date(2023, 11, 15),
    status: "paid",
  },
  {
    id: "INV-002",
    clientName: "TechStart Ltd",
    clientVat: "EL987654321",
    clientAddress: "456 Innovation Ave, Thessaloniki",
    items: [
      {
        id: "item-1",
        description: "Web Development",
        quantity: 1,
        unitPrice: 1500,
        total: 1500,
      },
    ],
    total: 1500,
    tax: 360,
    grandTotal: 1860,
    date: new Date(2024, 0, 20),
    status: "sent",
  },
];

// Function to parse natural language commands for invoice creation
async function parseInvoiceCommand(command: string): Promise<Invoice | null> {
  try {
    // In a real implementation, we would use LLM to parse the command
    // Here's a simplified version of what we'd do with Mistral AI
    const response = await mistralClient.chat({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: 
            "You are an invoice parsing assistant. Extract the following information from the user's command: " +
            "client name, items (with description, quantity, and unit price for each), and any additional details. " +
            "Respond in JSON format only with these fields: clientName, items (array of {description, quantity, unitPrice}), " +
            "clientVat (if present), clientAddress (if present)."
        },
        {
          role: "user",
          content: command
        }
      ],
      temperature: 0.2,
    });
    
    // In a real implementation, we'd parse the LLM response into structured data
    // For demo purposes, we'll do a simple parsing of the command
    
    // Try to extract client name
    const clientNameMatch = command.match(/for\s+([^,]+)/i);
    const clientName = clientNameMatch ? clientNameMatch[1].trim() : "New Client";
    
    // Try to extract service/item details
    let description = "Services";
    let quantity = 1;
    let unitPrice = 100;
    
    const hoursMatch = command.match(/(\d+)\s*hours?/i);
    if (hoursMatch) {
      quantity = parseInt(hoursMatch[1], 10);
      description = "Consulting Hours";
    }
    
    const priceMatch = command.match(/(\d+)(?:\.\d+)?\s*(?:€|EUR|euros?)?(?:\/|\s+per\s+)(?:hour|hr)/i);
    if (priceMatch) {
      unitPrice = parseFloat(priceMatch[1]);
    }
    
    // Calculate totals
    const itemTotal = quantity * unitPrice;
    const tax = itemTotal * 0.24; // 24% VAT in Greece
    
    // Create invoice object
    const invoice: Invoice = {
      id: `INV-00${++invoiceCounter}`,
      clientName,
      items: [
        {
          id: `item-1`,
          description,
          quantity,
          unitPrice,
          total: itemTotal,
        },
      ],
      total: itemTotal,
      tax,
      grandTotal: itemTotal + tax,
      date: new Date(),
      status: "draft",
    };
    
    return invoice;
  } catch (error) {
    console.error("Error parsing invoice command:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const clientName = searchParams.get("client");
    const status = searchParams.get("status");
    
    let filteredInvoices = [...storedInvoices];
    
    // Apply filters if provided
    if (clientName) {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.clientName.toLowerCase().includes(clientName.toLowerCase())
      );
    }
    
    if (status) {
      filteredInvoices = filteredInvoices.filter(invoice => 
        invoice.status === status
      );
    }
    
    // Sort by date, newest first
    filteredInvoices.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return NextResponse.json({ invoices: filteredInvoices });
  } catch (error) {
    console.error("Error retrieving invoices:", error);
    return NextResponse.json(
      { error: "Failed to retrieve invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { command, invoice: manualInvoice } = await req.json();
    
    // There are two ways to create an invoice:
    // 1. Via natural language command
    // 2. Via structured invoice data
    
    let newInvoice: Invoice | null = null;
    
    if (command) {
      // Parse the natural language command
      newInvoice = await parseInvoiceCommand(command);
      
      if (!newInvoice) {
        return NextResponse.json(
          { error: "Could not parse invoice command" },
          { status: 400 }
        );
      }
    } else if (manualInvoice) {
      // Use the provided invoice data
      newInvoice = {
        ...manualInvoice,
        id: `INV-00${++invoiceCounter}`,
        date: new Date(),
        status: "draft",
      };
      
      // Calculate totals if not provided
      if (!newInvoice.total) {
        newInvoice.total = newInvoice.items.reduce((sum, item) => sum + item.total, 0);
      }
      
      if (!newInvoice.tax) {
        newInvoice.tax = newInvoice.total * 0.24; // 24% VAT in Greece
      }
      
      if (!newInvoice.grandTotal) {
        newInvoice.grandTotal = newInvoice.total + newInvoice.tax;
      }
    } else {
      return NextResponse.json(
        { error: "Either command or invoice data is required" },
        { status: 400 }
      );
    }
    
    // In a real implementation, we would:
    // 1. Save the invoice to a database
    // 2. Submit it to the union.gr API
    // For now, we'll just add it to our in-memory array
    storedInvoices.push(newInvoice);
    
    return NextResponse.json({ 
      message: `Invoice ${newInvoice.id} created for ${newInvoice.clientName}`,
      invoice: newInvoice 
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
} 
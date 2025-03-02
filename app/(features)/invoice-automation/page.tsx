"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Send, Plus, Check, AlertCircle } from "lucide-react";
import { Invoice } from "@/app/types";
import { formatDate, formatCurrency } from "@/app/lib/utils";
import axios from "axios";

export default function InvoiceAutomationPage() {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load invoices when the component mounts
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get("/api/invoices");
      if (response.data.invoices) {
        // Convert date strings to Date objects
        const processedInvoices = response.data.invoices.map((invoice: any) => ({
          ...invoice,
          date: new Date(invoice.date),
        }));
        setInvoices(processedInvoices);
      } else {
        // Fallback for demo purposes
        setInvoices([
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
        ]);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError("Failed to load invoices. Please try again later.");
      
      // Fallback for demo purposes
      setInvoices([
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
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsProcessing(true);
    setStatus("idle");
    setStatusMessage("");
    setError(null);

    try {
      const response = await axios.post("/api/invoices", {
        command: command,
      });

      if (response.data.invoice) {
        // Convert date string to Date object
        const newInvoice = {
          ...response.data.invoice,
          date: new Date(response.data.invoice.date),
        };
        
        setInvoices((prev) => [...prev, newInvoice]);
        setStatus("success");
        setStatusMessage(response.data.message || `Invoice ${newInvoice.id} created successfully`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Error processing invoice command:", err);
      setStatus("error");
      setStatusMessage(err.response?.data?.error || "An error occurred while processing your request");
      
      // If we couldn't connect to the API, simulate success for demo purposes
      if (!err.response) {
        // Simple parsing logic for demo purposes
        const commandLower = command.toLowerCase();
        
        if (commandLower.includes("invoice") && commandLower.includes("create")) {
          // Extract client name (very basic extraction)
          const clientNameMatch = command.match(/for\s+([^,]+)/i);
          const clientName = clientNameMatch ? clientNameMatch[1].trim() : "New Client";
          
          // Create a new invoice
          const newInvoice: Invoice = {
            id: `INV-00${invoices.length + 1}`,
            clientName,
            items: [
              {
                id: `item-1`,
                description: "Services",
                quantity: 1,
                unitPrice: 100,
                total: 100,
              },
            ],
            total: 100,
            tax: 24,
            grandTotal: 124,
            date: new Date(),
            status: "draft",
          };
          
          setInvoices((prev) => [...prev, newInvoice]);
          setStatus("success");
          setStatusMessage(`Invoice ${newInvoice.id} created for ${clientName}`);
        } else {
          setStatus("error");
          setStatusMessage("I couldn't understand that command. Please try something like 'Create an invoice for Client Name'");
        }
      }
    } finally {
      setIsProcessing(false);
      setCommand("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="mr-2 rounded-full p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">Invoice Automation</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Automate Your Invoicing
            </h2>
            <p className="mt-2 text-muted-foreground">
              Create invoices on union.gr with simple natural language commands
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-medium">Create New Invoice</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Create an invoice for Acme Corp for 3 consulting hours at €80/hour plus VAT"
                  className="w-full rounded-md border border-input bg-background py-2 px-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  disabled={isProcessing || !command.trim()}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Process Command
                    </>
                  )}
                </button>
              </div>
            </form>

            {status !== "idle" && (
              <div
                className={`mt-4 rounded-md p-3 ${
                  status === "success"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <div className="flex items-center">
                  {status === "success" ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  <p className="text-sm">{statusMessage}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-medium">Recent Invoices</h3>
              <Link
                href="#"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <Plus className="mr-1 h-4 w-4" />
                New Invoice
              </Link>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2">Loading invoices...</span>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Invoice #
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b">
                          <td className="px-4 py-3 text-sm">{invoice.id}</td>
                          <td className="px-4 py-3 text-sm">{invoice.clientName}</td>
                          <td className="px-4 py-3 text-sm">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {formatCurrency(invoice.grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : invoice.status === "sent"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No invoices found. Create your first invoice using the form above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
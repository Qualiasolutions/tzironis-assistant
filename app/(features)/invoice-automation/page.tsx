"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Send, Plus, Check, AlertCircle } from "lucide-react";
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
    <div className="flex-1">
      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white">
              Automate Your Invoicing
            </h2>
            <p className="mt-2 text-black dark:text-white">
              Create invoices on union.gr with simple natural language commands
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <div className="mb-8 rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-medium text-black dark:text-white">Create Invoice</h3>
            <div className="relative">
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Example: Create an invoice for Acme Corp for website design services for 1500 euros due in 30 days"
                className="min-h-[100px] w-full rounded-md border border-gray-300 p-3 text-black dark:text-white dark:border-gray-700 dark:bg-gray-900"
                disabled={isProcessing}
              />
              <button
                onClick={handleSubmit}
                disabled={!command.trim() || isProcessing}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-50 sm:mt-0 sm:w-auto"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Process
                  </>
                )}
              </button>
            </div>

            {status === "success" && (
              <div className="mt-4 rounded-md bg-green-50 p-3 text-black dark:bg-green-900/30">
                <div className="flex">
                  <Check className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
                  <p>{statusMessage}</p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-black dark:bg-red-900/30">
                <div className="flex">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
                  <p>{statusMessage}</p>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <h3 className="mb-4 text-lg font-medium text-black dark:text-white">Recent Invoices</h3>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  <span className="ml-2 text-black dark:text-white">Loading invoices...</span>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-black dark:text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b">
                        <td className="px-4 py-3 text-sm text-black dark:text-white">{invoice.id}</td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">{invoice.clientName}</td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                          {formatDate(invoice.date)}
                        </td>
                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                          {formatCurrency(invoice.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-black`}
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
                        className="px-4 py-8 text-center text-black dark:text-white"
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
      </main>
    </div>
  );
} 
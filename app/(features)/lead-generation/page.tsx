"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Filter, Download, Clock } from "lucide-react";
import { Lead } from "@/app/types";
import { formatDate } from "@/app/lib/utils";
import axios from "axios";

export default function LeadGenerationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial leads when the component mounts
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, we'd load from the API
      // For demo purposes, we'll use static data to avoid API errors
      setLeads([
        {
          id: "lead-1",
          businessName: "GlobalTech Solutions",
          contactPerson: "Maria Papadopoulos",
          email: "maria@globaltech.com",
          phone: "+30 210 1234567",
          address: "45 Innovation Street, Athens",
          website: "https://globaltech.com",
          industry: "Technology",
          source: "LinkedIn",
          notes: "Potential client for digital transformation services",
          status: "new",
          createdAt: new Date(2024, 2, 15),
          updatedAt: new Date(2024, 2, 15),
        },
        {
          id: "lead-2",
          businessName: "Mediterranean Exports",
          contactPerson: "Nikos Andreou",
          email: "nikos@medexports.gr",
          phone: "+30 210 9876543",
          address: "12 Harbor Avenue, Piraeus",
          website: "https://medexports.gr",
          industry: "Logistics",
          source: "Industry Conference",
          notes: "Interested in process optimization",
          status: "contacted",
          createdAt: new Date(2024, 2, 10),
          updatedAt: new Date(2024, 2, 12),
        },
        {
          id: "lead-3",
          businessName: "Olive Grove Estates",
          contactPerson: "Eleni Georgiou",
          email: "eleni@olivegrove.gr",
          phone: "+30 210 4567890",
          address: "78 Rural Road, Kalamata",
          website: "https://olivegrove.gr",
          industry: "Agriculture",
          source: "Google Search",
          notes: "Looking for digital marketing solutions",
          status: "qualified",
          createdAt: new Date(2024, 2, 5),
          updatedAt: new Date(2024, 2, 18),
        },
      ]);

      // Uncomment for real API implementation
      /*
      const response = await axios.get("/api/leads");
      if (response.data.leads) {
        // Convert date strings to Date objects
        const processedLeads = response.data.leads.map((lead: any) => ({
          ...lead,
          createdAt: new Date(lead.createdAt),
          updatedAt: new Date(lead.updatedAt),
        }));
        setLeads(processedLeads);
      }
      */
    } catch (err) {
      console.error("Error loading leads:", err);
      setError("Failed to load leads. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLeads = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await axios.post("/api/leads", {
        source: "Web Scraping",
        count: 1,
      });
      
      if (response.data.leads) {
        // Convert date strings to Date objects
        const newLeads = response.data.leads.map((lead: any) => ({
          ...lead,
          createdAt: new Date(lead.createdAt),
          updatedAt: new Date(lead.updatedAt),
        }));
        
        setLeads((prev) => [...prev, ...newLeads]);
      }
    } catch (err) {
      console.error("Error generating leads:", err);
      setError("Failed to generate leads. Please try again later.");
      
      // Fallback for demo purposes
      const newLead: Lead = {
        id: `lead-${leads.length + 1}`,
        businessName: "Aegean Innovations",
        contactPerson: "Dimitri Stavros",
        email: "dimitri@aegeaninnovations.gr",
        phone: "+30 210 5432109",
        address: "23 Coastal Road, Rhodes",
        website: "https://aegeaninnovations.gr",
        industry: "Tourism",
        source: "Web Scraping",
        notes: "New startup in the tourism technology space",
        status: "new",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setLeads((prev) => [...prev, newLead]);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      (lead.businessName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.contactPerson && lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportLeads = () => {
    // In a real implementation, this would generate a CSV file
    const csvContent = "data:text/csv;charset=utf-8," +
      "Business Name,Contact Person,Email,Phone,Status\n" +
      filteredLeads.map(lead => 
        `${lead.businessName},${lead.contactPerson || ""},${lead.email || ""},${lead.phone || ""},${lead.status}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tzironis_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="mr-2 rounded-full p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">Lead Generation</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Business Lead Management
              </h2>
              <p className="mt-1 text-muted-foreground">
                Generate and manage potential business leads
              </p>
            </div>
            <div className="mt-4 flex space-x-3 sm:mt-0">
              <button
                onClick={handleGenerateLeads}
                disabled={isGenerating}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Generate Leads
                  </>
                )}
              </button>
              <button
                onClick={handleExportLeads}
                disabled={filteredLeads.length === 0}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border bg-white shadow-sm">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2">Loading leads...</span>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Business
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Industry
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Source
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Date Added
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-b">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{lead.businessName}</div>
                              {lead.website && (
                                <div className="text-xs text-muted-foreground">
                                  {lead.website}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              {lead.contactPerson && (
                                <div className="font-medium">{lead.contactPerson}</div>
                              )}
                              {lead.email && (
                                <div className="text-xs text-muted-foreground">
                                  {lead.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{lead.industry || "—"}</td>
                          <td className="px-4 py-3 text-sm">{lead.source || "—"}</td>
                          <td className="px-4 py-3 text-sm">
                            {formatDate(lead.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                lead.status === "new"
                                  ? "bg-blue-100 text-blue-800"
                                  : lead.status === "contacted"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : lead.status === "qualified"
                                  ? "bg-purple-100 text-purple-800"
                                  : lead.status === "converted"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {lead.status.charAt(0).toUpperCase() +
                                lead.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No leads found. Try adjusting your search or generate new
                          leads.
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
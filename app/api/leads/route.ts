import { NextRequest, NextResponse } from "next/server";
import { Lead } from "@/app/types";
import { generateId } from "@/app/lib/utils";

// Sample data sources we'll scrape (in a real implementation, these would be actual URLs)
const BUSINESS_SOURCES = [
  { name: "Business Directory", url: "https://example.com/directory" },
  { name: "Industry Association", url: "https://example.com/association" },
  { name: "Chamber of Commerce", url: "https://example.com/chamber" },
  { name: "Professional Network", url: "https://example.com/network" }
];

// Sample industries for our demo data
const INDUSTRIES = [
  "Technology", 
  "Finance", 
  "Healthcare", 
  "Retail", 
  "Manufacturing", 
  "Education", 
  "Hospitality", 
  "Real Estate"
];

// Function to generate random business names (for demo purposes)
function generateBusinessName() {
  const prefixes = ["Global", "Euro", "Tech", "Med", "Elite", "Prime", "Aegean", "Athenian"];
  const nouns = ["Solutions", "Systems", "Innovations", "Technologies", "Enterprises", "Group", "Partners", "Services"];
  
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

// Function to generate random emails (for demo purposes)
function generateEmail(businessName: string) {
  const domains = ["company.com", "business.gr", "enterprise.eu", "corp.gr", "group.com"];
  const prefix = businessName.toLowerCase().replace(/\s+/g, "");
  return `info@${prefix}.${domains[Math.floor(Math.random() * domains.length)]}`;
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const count = parseInt(searchParams.get("count") || "5", 10);
    const industry = searchParams.get("industry");
    
    // In a real implementation, this would scrape data from external sources
    // For this demo, we'll generate random leads
    const leads: Lead[] = [];
    
    for (let i = 0; i < count; i++) {
      const businessName = generateBusinessName();
      const selectedIndustry = industry || INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
      const source = BUSINESS_SOURCES[Math.floor(Math.random() * BUSINESS_SOURCES.length)];
      
      leads.push({
        id: generateId(),
        businessName,
        contactPerson: null,
        email: generateEmail(businessName),
        phone: null,
        address: null,
        website: `https://www.${businessName.toLowerCase().replace(/\s+/g, "")}.com`,
        industry: selectedIndustry,
        source: source.name,
        notes: `Lead generated from ${source.name}`,
        status: "new",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Error in leads API:", error);
    return NextResponse.json(
      { error: "Failed to generate leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { source, industry, count = 5 } = await req.json();
    
    if (!source) {
      return NextResponse.json(
        { error: "Source is required" },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would initiate a scraping job
    // For this demo, we'll simulate a scraping process with random data
    const leads: Lead[] = [];
    
    for (let i = 0; i < count; i++) {
      const businessName = generateBusinessName();
      const selectedIndustry = industry || INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
      
      leads.push({
        id: generateId(),
        businessName,
        contactPerson: null,
        email: generateEmail(businessName),
        phone: null,
        address: null,
        website: `https://www.${businessName.toLowerCase().replace(/\s+/g, "")}.com`,
        industry: selectedIndustry,
        source,
        notes: `Lead generated from ${source}`,
        status: "new",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({ 
      message: `Successfully generated ${leads.length} leads from ${source}`,
      leads 
    });
  } catch (error) {
    console.error("Error in leads generation API:", error);
    return NextResponse.json(
      { error: "Failed to generate leads" },
      { status: 500 }
    );
  }
} 
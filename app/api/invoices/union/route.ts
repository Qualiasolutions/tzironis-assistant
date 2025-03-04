import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { captureException } from "@/app/lib/monitoring/sentry";
import { createLogger } from "@/app/lib/monitoring/logger";

const logger = createLogger('union-invoice');

export async function POST(req: NextRequest) {
  try {
    const { clientName, clientVat, clientAddress, items } = await req.json();

    // Validate required fields
    if (!clientName || !clientVat || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: clientName, clientVat, and items" },
        { status: 400 }
      );
    }

    // Check for Union.gr credentials
    const username = process.env.UNION_USERNAME;
    const password = process.env.UNION_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Union.gr credentials not configured" },
        { status: 500 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxRate = 0.24; // 24% VAT in Greece
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new", // Use new headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Set default timeout
      page.setDefaultTimeout(30000);
      
      // Log navigation events for debugging
      page.on('console', (msg) => logger.debug('Browser console:', msg.text()));
      
      // Step 1: Navigate to login page
      logger.info('Navigating to Union.gr login page');
      await page.goto('https://www.union.gr/login', { waitUntil: 'networkidle2' });
      
      // Step 2: Login
      logger.info('Logging in to Union.gr');
      await page.type('#username', username);
      await page.type('#password', password);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('button[type="submit"]')
      ]);
      
      // Check if login was successful
      const loginFailed = await page.evaluate(() => {
        return document.body.textContent?.includes('Invalid username or password');
      });
      
      if (loginFailed) {
        throw new Error('Failed to login to Union.gr');
      }
      
      // Step 3: Navigate to invoice creation page
      logger.info('Navigating to invoice creation page');
      await page.goto('https://www.union.gr/invoices/new', { waitUntil: 'networkidle2' });
      
      // Step 4: Fill in client details
      logger.info('Filling client details');
      await page.type('#client-name', clientName);
      await page.type('#client-vat', clientVat);
      
      if (clientAddress) {
        await page.type('#client-address', clientAddress);
      }
      
      // Step 5: Add items
      logger.info('Adding invoice items');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (i > 0) {
          // Click "Add Item" button for subsequent items
          await page.click('#add-item-button');
          await page.waitForSelector(`.item-row:nth-child(${i + 1})`);
        }
        
        // Fill item details
        await page.type(`#item-description-${i + 1}`, item.description);
        await page.type(`#item-quantity-${i + 1}`, item.quantity.toString());
        await page.type(`#item-price-${i + 1}`, item.unitPrice.toString());
      }
      
      // Step 6: Submit the form
      logger.info('Submitting invoice');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click('#submit-invoice')
      ]);
      
      // Step 7: Get invoice confirmation and number
      logger.info('Getting invoice confirmation');
      const invoiceNumber = await page.evaluate(() => {
        const element = document.querySelector('.invoice-number');
        return element ? element.textContent?.trim() : null;
      });
      
      // Take a screenshot of the confirmation page
      const screenshot = await page.screenshot({ encoding: 'base64' });
      
      // Close the browser
      await browser.close();
      
      return NextResponse.json({
        success: true,
        message: `Invoice created successfully for ${clientName}`,
        invoiceNumber,
        details: {
          subtotal,
          tax,
          total,
          items: items.length
        },
        screenshot: `data:image/png;base64,${screenshot}`
      });
    } catch (error) {
      // Make sure to close the browser in case of errors
      await browser.close();
      
      // Log and rethrow
      logger.error('Error in Union.gr automation', { error });
      captureException(error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during invoice creation';
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error processing invoice request', { error });
    captureException(error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process invoice request'
      },
      { status: 500 }
    );
  }
} 
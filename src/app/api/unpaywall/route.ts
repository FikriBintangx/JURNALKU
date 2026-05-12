import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Unpaywall API Route
 * Purpose: Find free PDF links for journals that are normally paywalled.
 * Endpoint: https://api.unpaywall.org/v2/${doi}?email=unpaywall@jurnalstar.com
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doi = searchParams.get('doi');

  if (!doi) {
    return NextResponse.json({ success: false, message: "DOI is required" }, { status: 400 });
  }

  try {
    const email = "contact@jurnalstar.id"; // Required by Unpaywall
    const url = `https://api.unpaywall.org/v2/${doi}?email=${email}`;
    
    console.log(`[UNPAYWALL] Checking DOI: ${doi}`);
    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    // Check if there is a free version
    const bestOaLocation = data.best_oa_location;
    
    if (bestOaLocation && bestOaLocation.url_for_pdf) {
      console.log(`[UNPAYWALL] Found free PDF: ${bestOaLocation.url_for_pdf}`);
      return NextResponse.json({
        success: true,
        pdfUrl: bestOaLocation.url_for_pdf,
        landingPage: bestOaLocation.url_for_landing_page,
        isOa: data.is_oa,
        version: bestOaLocation.version // publishedVersion, submittedVersion, etc.
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: "No free PDF found via Unpaywall." 
    });

  } catch (error: any) {
    console.error(`[UNPAYWALL] Error for DOI ${doi}:`, error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Unpaywall service unavailable." 
    }, { status: 500 });
  }
}

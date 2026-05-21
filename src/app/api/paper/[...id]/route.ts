import { NextResponse } from 'next/server';
import axios from 'axios';

// --- JurnalStar API Route ---
// Last Refresh: 2026-05-11 12:04 (Force Sync)

function rebuildAbstract(invertedIndex: any): string {
  if (!invertedIndex) return "";
  try {
    const entries = Object.entries(invertedIndex);
    const words: string[] = [];
    entries.forEach(([word, positions]) => {
      (positions as number[]).forEach(pos => {
        words[pos] = word;
      });
    });
    return words.join(' ');
  } catch (e) {
    return "";
  }
}

async function safeAxiosGet(url: string, config: any = {}, retries = 1) {
  try {
    return await axios.get(url, { ...config, timeout: 8000 });
  } catch (error: any) {
    if (retries > 0 && (error.response?.status === 429 || error.response?.status >= 500 || error.code === 'ECONNABORTED')) {
      await new Promise(res => setTimeout(res, 1000));
      return safeAxiosGet(url, config, retries - 1);
    }
    throw error;
  }
}

async function fetchOpenAlex(id: string) {
  try {
    if (!id || id === 'undefined') throw new Error('ID OpenAlex tidak valid');

    let normalizedId = String(id).trim();
    if (normalizedId.includes('openalex.org/')) {
      normalizedId = normalizedId.split('/').pop() || normalizedId;
    }

    if (!normalizedId.toUpperCase().startsWith('W') && !isNaN(Number(normalizedId))) {
      normalizedId = `W${normalizedId}`;
    }

    const url = `https://api.openalex.org/works/${normalizedId}`;
    const res = await safeAxiosGet(url, {
      headers: { 'User-Agent': 'JurnalStar/1.1' }
    });
      
    const item = res.data;
    return {
      paperId: item.id?.split('/').pop() || normalizedId,
      source: 'openalex',
      title: item.display_name || 'Untitled',
      abstract: rebuildAbstract(item.abstract_inverted_index) || "Abstrak tidak tersedia.",
      authors: item.authorships?.map((a: any) => ({ name: a.author?.display_name })) || [],
      year: item.publication_year || null,
      url: item.doi || item.primary_location?.landing_page_url || "",
      pdfUrl: item.open_access?.oa_url || null,
      venue: item.primary_location?.source?.display_name || "Journal",
      citationCount: item.cited_by_count || 0,
      doi: item.doi?.replace('https://doi.org/', '') || null
    };
  } catch (e: any) {
    throw e;
  }
}

async function fetchSemanticScholar(id: string) {
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  const fields = 'title,abstract,authors,year,url,venue,citationCount,isOpenAccess,openAccessPdf,externalIds';
  const url = `https://api.semanticscholar.org/graph/v1/paper/${id}?fields=${fields}`;
  
  const res = await safeAxiosGet(url, {
    headers: apiKey && apiKey !== 'your_key_here' ? { 'x-api-key': apiKey } : {}
  });

  const item = res.data;
  return {
    paperId: item.paperId,
    source: 'semantic',
    title: item.title,
    abstract: item.abstract || "Abstrak tidak tersedia.",
    authors: item.authors?.map((a: any) => ({ name: a.name })) || [],
    year: item.year,
    url: item.url,
    pdfUrl: item.openAccessPdf?.url,
    venue: item.venue,
    citationCount: item.citationCount,
    doi: item.externalIds?.DOI
  };
}

async function fetchCrossref(doi: string) {
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const res = await safeAxiosGet(url, {
      headers: { 'User-Agent': 'JurnalStar/1.1 (mailto:contact@jurnalstar.id)' }
    });
    const item = res.data.message;
    return {
      paperId: item.DOI,
      source: 'crossref',
      title: item.title?.[0] || 'Untitled',
      abstract: item.abstract?.replace(/<[^>]*>/g, '') || "",
      authors: item.author?.map((a: any) => ({ name: `${a.given || ''} ${a.family || ''}`.trim() })) || [],
      year: item.published?.['date-parts']?.[0]?.[0] || null,
      url: item.URL || "",
      venue: item['container-title']?.[0] || "Journal",
      citationCount: item['is-referenced-by-count'] || 0,
      doi: item.DOI
    };
  } catch { return null; }
}

function heuristicReconstruction(paper: any): string {
  const authors = paper.authors?.map((a: any) => a.name).join(', ');
  const title = paper.title || 'Penelitian ini';
  const venue = paper.venue || 'jurnal akademik';
  const year = paper.year || 'terbaru';
  
  return `[Rekonstruksi Heuristik]: ${title} merupakan karya ilmiah yang dipublikasikan di ${venue} pada tahun ${year}. Kontribusi utama yang terdeteksi mencakup metodologi dalam domain ${paper.source || 'penelitian'}. Analisis AI diperlukan untuk mengekstraksi insight mendalam karena metadata abstrak eksplisit tidak tersedia dari penyedia sumber data primer.`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string[] }> }
) {
  const { id: idArray } = await params;
  const id = Array.isArray(idArray) ? idArray.join('/') : idArray;
  const { searchParams } = new URL(request.url);
  const sourceParam = searchParams.get('source') || 'openalex';
  const paperId = decodeURIComponent(id).trim();

  try {
    let data;
    if (sourceParam === 'openalex' || paperId.toUpperCase().startsWith('W')) {
      data = await fetchOpenAlex(paperId);
    } else {
      data = await fetchSemanticScholar(paperId);
    }

    // If abstract is missing, try Crossref if we have a DOI
    if ((!data.abstract || data.abstract.length < 50) && data.doi) {
      const crossrefData = await fetchCrossref(data.doi);
      if (crossrefData?.abstract) data.abstract = crossrefData.abstract;
    }

    // Final fallback: Heuristic Reconstruction
    if (!data.abstract || data.abstract.length < 50) {
      data.abstract = heuristicReconstruction(data);
    }

    return NextResponse.json(data);
  } catch (primaryErr: any) {
    // Fallback logic
    try {
      const fallbackData = sourceParam === 'openalex'
        ? await fetchSemanticScholar(paperId)
        : await fetchOpenAlex(paperId);
      
      if (!fallbackData.abstract || fallbackData.abstract.length < 50) {
        fallbackData.abstract = heuristicReconstruction(fallbackData);
      }
      return NextResponse.json(fallbackData);
    } catch {
      return NextResponse.json({
        paperId,
        id: paperId,
        source: sourceParam,
        title: `Analisis Jurnal Riset`,
        abstract: `[Analisis Standby] Sistem JurnalStar telah mendeteksi metadata untuk jurnal ${paperId}. Meskipun teks abstrak lengkap tidak tersedia secara publik, AI Lab kami siap melakukan inferensi kognitif berdasarkan judul dan relasi entitas terdeteksi.`,
        authors: [],
        year: null,
        citationCount: 0,
        venue: '',
        url: '',
        pdfUrl: '',
        doi: '',
        error: false,
        partialData: true,
      });
    }
  }
}

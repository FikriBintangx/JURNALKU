'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Download } from 'lucide-react';

// Set worker URL for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  url: string;
}

export default function PDFViewer({ url }: Props) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-white/10">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1">
            <button 
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 text-sm text-slate-300 font-medium">
              Page {pageNumber} / {numPages || '--'}
            </span>
            <button 
              onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || prev))}
              disabled={pageNumber >= (numPages || 1)}
              className="p-1 hover:bg-white/10 rounded disabled:opacity-30 text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1">
            <button 
              onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
              className="p-1 hover:bg-white/10 rounded text-white"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="px-3 text-sm text-slate-300 font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={() => setScale(s => Math.min(s + 0.2, 2.0))}
              className="p-1 hover:bg-white/10 rounded text-white"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
          <a 
            href={url} 
            download 
            target="_blank"
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-grow overflow-auto p-8 flex justify-center custom-scrollbar">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-400">Loading document...</p>
            </div>
          }
          error={
            <div className="text-red-400 p-8 text-center bg-red-500/10 rounded-xl border border-red-500/20">
              Failed to load PDF. The link might be expired or restricted.
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderAnnotationLayer={false}
            renderTextLayer={false}
            className="shadow-2xl rounded-sm overflow-hidden"
          />
        </Document>
      </div>
    </div>
  );
}

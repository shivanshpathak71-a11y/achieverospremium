import { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize, Download, Bookmark, Search, ChevronUp, ChevronDown, X } from 'lucide-react';

export function PdfViewer({ url }: { url: string }) {
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() || 'document.pdf';
    a.target = '_blank';
    a.click();
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-ink-950">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-white/5 glass">
        <button onClick={zoomOut} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-gray-500 w-12 text-center">{zoom}%</span>
        <button onClick={zoomIn} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-100 mx-1" />

        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${showSearch ? 'text-cyan-400 bg-gray-100' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${bookmarked ? 'text-cyan-400 bg-gray-100' : 'text-gray-700 hover:bg-gray-100'}`}
          title="Bookmark"
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-cyan-400' : ''}`} />
        </button>

        <div className="flex-1" />

        <button onClick={handleDownload} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors" title="Download">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={toggleFullscreen} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors" title="Fullscreen">
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 p-3 border-b border-white/5 glass animate-fade-in-down">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            className="input-field text-sm flex-1"
            autoFocus
          />
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => setShowSearch(false)} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PDF iframe */}
      <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
        <iframe
          src={url}
          className="bg-white rounded-lg shadow-2xl transition-all duration-300"
          style={{
            width: `${zoom}%`,
            maxWidth: '100%',
            height: '100%',
            border: 'none',
          }}
          title="PDF Viewer"
        />
      </div>
    </div>
  );
}

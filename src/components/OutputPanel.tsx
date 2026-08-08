import React, { useState } from 'react';
import {
  Code,
  Eye,
  Columns,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Monitor,
  Tablet,
  Smartphone,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { ValidationResult } from '../types';

interface OutputPanelProps {
  outputHtml: string;
  validation?: ValidationResult;
  detectedPrefix?: string | null;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  outputHtml,
  validation,
  detectedPrefix,
}) => {
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'split'>('split');
  const [copied, setCopied] = useState(false);
  const [deviceWidth, setDeviceWidth] = useState<'full' | 'tablet' | 'mobile'>('full');

  if (!outputHtml) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 h-full flex flex-col items-center justify-center min-h-[350px]">
        <Code className="w-12 h-12 mb-3 text-slate-700 opacity-60" />
        <h3 className="text-sm font-bold text-slate-400">Hasil Konversi Elementor Widget</h3>
        <p className="text-xs text-slate-600 max-w-sm mt-1 leading-relaxed">
          Masukkan source code HTML dari Gemini Canvas di sebelah kiri, lalu klik tombol <strong className="text-amber-500">Konversi ke Elementor Widget</strong>.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([outputHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const prefix = detectedPrefix || 'elementor-widget';
    a.download = `${prefix}-elementor-widget.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const charCount = outputHtml.length;
  const prefixToShow = detectedPrefix || validation?.detectedPrefix || 'auto-brand';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">2. Output Widget Elementor</h2>
              <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                <Tag className="w-3 h-3 text-emerald-400 inline" />
                Prefix: {prefixToShow}-
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'code'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Code View"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Live Preview View"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              copied
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Copy to Clipboard'}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
            title="Download file .html"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Report Banner (§8.3) */}
      {validation && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Laporan Validasi Otomatis Output
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {charCount.toLocaleString()} karakter
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span
              className={`px-2 py-0.5 rounded border ${
                validation.isValidDocStructure
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              Structure Utuh: {validation.isValidDocStructure ? '✓ Lengkap' : '⚠ Warning'}
            </span>

            <span
              className={`px-2 py-0.5 rounded border ${
                validation.isTailwindCdnRemoved
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}
            >
              Tailwind CDN: {validation.isTailwindCdnRemoved ? '✓ Dihapus' : '❌ Masih Ada'}
            </span>

            <span
              className={`px-2 py-0.5 rounded border ${
                validation.isJsProtected
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              JS Protection: {validation.isJsProtected ? '✓ Aman' : '⚠ Perlu Check'}
            </span>
          </div>

          {/* Validation Issues List */}
          {validation.issues.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-900 space-y-1">
              {validation.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-amber-300/90 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span>{issue.message}</span>
                    {issue.details && issue.details.length > 0 && (
                      <span className="ml-1 font-mono text-[10px] text-amber-200/80">
                        ({issue.details.join(', ')})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 min-h-[400px] flex flex-col">
        {/* Device Switcher Bar for Preview Modes */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-t-xl flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              Live Preview (Iframe Sandbox)
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDeviceWidth('full')}
                className={`p-1 rounded ${
                  deviceWidth === 'full' ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:text-white'
                }`}
                title="Desktop (100%)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceWidth('tablet')}
                className={`p-1 rounded ${
                  deviceWidth === 'tablet' ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:text-white'
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceWidth('mobile')}
                className={`p-1 rounded ${
                  deviceWidth === 'mobile' ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:text-white'
                }`}
                title="Mobile (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Content Views */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
          {/* Code View Block */}
          {(viewMode === 'code' || viewMode === 'split') && (
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto font-mono text-xs text-emerald-300 leading-relaxed max-h-[500px]">
              <pre className="whitespace-pre-wrap break-all">{outputHtml}</pre>
            </div>
          )}

          {/* Live Preview Iframe Block */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div
              className={`flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex justify-center items-center p-2 min-h-[350px] ${
                viewMode === 'split' ? 'lg:max-w-[50%]' : ''
              }`}
            >
              <div
                className={`transition-all duration-300 h-full bg-white rounded-lg shadow-2xl overflow-hidden ${
                  deviceWidth === 'mobile'
                    ? 'w-[375px]'
                    : deviceWidth === 'tablet'
                    ? 'w-[768px]'
                    : 'w-full'
                }`}
              >
                <iframe
                  srcDoc={outputHtml}
                  title="Elementor Widget Live Preview"
                  sandbox="allow-scripts allow-modals allow-same-origin"
                  className="w-full h-[480px] border-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

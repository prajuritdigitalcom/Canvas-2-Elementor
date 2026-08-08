import React, { useState } from 'react';
import {
  Code,
  Eye,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Monitor,
  Tablet,
  Smartphone,
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
  const [copied, setCopied] = useState(false);
  const [deviceWidth, setDeviceWidth] = useState<'full' | 'tablet' | 'mobile'>('full');

  if (!outputHtml) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[350px] shadow-sm">
        <div className="p-3 rounded-2xl bg-slate-100 text-[#fe4c6f] border border-slate-200 mb-3">
          <Code className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Hasil Konversi Elementor Widget (Side-by-Side 2 Kolom)</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          Masukkan source code HTML dari Gemini Canvas di atas, lalu klik tombol <strong className="text-[#fe4c6f]">Konversi ke Elementor Widget</strong> untuk melihat Kode & Preview secara bersamaan.
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
    <div className="space-y-4">
      {/* Validation Report Banner (§8.3) */}
      {validation && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              Laporan Validasi Otomatis Output
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-[#fe4c6f] border border-slate-200 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#fe4c6f] inline" />
                Prefix: {prefixToShow}-
              </span>
              <span className="text-[11px] text-slate-600 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {charCount.toLocaleString()} karakter
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1 font-medium">
            <span
              className={`px-2.5 py-1 rounded-lg border ${
                validation.isValidDocStructure
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              Structure Utuh: {validation.isValidDocStructure ? '✓ Lengkap' : '⚠ Warning'}
            </span>

            <span
              className={`px-2.5 py-1 rounded-lg border ${
                validation.isTailwindCdnRemoved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              Tailwind CDN: {validation.isTailwindCdnRemoved ? '✓ Dihapus' : '❌ Masih Ada'}
            </span>

            <span
              className={`px-2.5 py-1 rounded-lg border ${
                validation.isJsProtected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              JS Protection: {validation.isJsProtected ? '✓ Aman' : '⚠ Perlu Check'}
            </span>
          </div>

          {/* Validation Issues List */}
          {validation.issues.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
              {validation.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-amber-800 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span>{issue.message}</span>
                    {issue.details && issue.details.length > 0 && (
                      <span className="ml-1 font-mono text-[10px] text-amber-700">
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

      {/* 2-Column Permanent Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Kolom 1: Mode Code */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-slate-100 text-[#fe4c6f] border border-slate-200">
                <Code className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Output Widget — Mode Code</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-[#fe4c6f] hover:bg-[#e03a5c] text-white shadow-md shadow-[#fe4c6f]/25 active:scale-95'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors border border-slate-200"
                title="Download file .html"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto font-mono text-xs text-rose-300 leading-relaxed max-h-[520px] min-h-[380px]">
            <pre className="whitespace-pre-wrap break-all">{outputHtml}</pre>
          </div>
        </div>

        {/* Kolom 2: Mode Preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-slate-100 text-[#fe4c6f] border border-slate-200">
                <Eye className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Output Widget — Mode Preview</h2>
            </div>

            {/* Device Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDeviceWidth('full')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  deviceWidth === 'full' ? 'bg-[#fe4c6f] text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Desktop (100%)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceWidth('tablet')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  deviceWidth === 'tablet' ? 'bg-[#fe4c6f] text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceWidth('mobile')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  deviceWidth === 'mobile' ? 'bg-[#fe4c6f] text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Mobile (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-100/80 border border-slate-200 rounded-xl overflow-hidden flex justify-center items-center p-2 min-h-[380px]">
            <div
              className={`transition-all duration-300 h-full bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden w-full ${
                deviceWidth === 'mobile'
                  ? 'max-w-[375px]'
                  : deviceWidth === 'tablet'
                  ? 'max-w-[768px]'
                  : 'max-w-full'
              }`}
            >
              <iframe
                srcDoc={outputHtml}
                title="Elementor Widget Live Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full h-[500px] border-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

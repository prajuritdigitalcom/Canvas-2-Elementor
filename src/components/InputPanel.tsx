import React, { useRef } from 'react';
import { Upload, Sparkles, Trash2, FileCode } from 'lucide-react';

interface InputPanelProps {
  rawHtml: string;
  onChangeRawHtml: (val: string) => void;
  onConvert: () => void;
  isLoading: boolean;
  onSelectPreset?: (preset: any) => void;
  selectedPresetId?: string | null;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  rawHtml,
  onChangeRawHtml,
  onConvert,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = rawHtml.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onChangeRawHtml(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/html' || file.name.endsWith('.html'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onChangeRawHtml(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full">
      {/* Panel Top Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-slate-100 text-[#fe4c6f] border border-slate-200">
            <FileCode className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Input HTML Gemini Canvas</h2>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".html,.htm"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors border border-slate-200 font-semibold"
            title="Upload File .html"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          {charCount > 0 && (
            <button
              type="button"
              onClick={() => onChangeRawHtml('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Bersihkan Input"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea Area with Drag-and-Drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative flex-1 min-h-[320px] flex flex-col"
      >
        <textarea
          value={rawHtml}
          onChange={(e) => onChangeRawHtml(e.target.value)}
          placeholder="Paste source code HTML lengkap dari Gemini Canvas di sini (lengkap dengan <!DOCTYPE html>, <head>, <script src='https://cdn.tailwindcss.com'>, dll)..."
          className="w-full flex-1 bg-slate-50/80 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#fe4c6f] focus:ring-2 focus:ring-[#fe4c6f]/20 transition-all resize-none leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Convert Action Button */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end">
        <button
          type="button"
          onClick={onConvert}
          disabled={isLoading || charCount === 0}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
            isLoading || charCount === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-gradient-to-r from-[#fe4c6f] via-[#ff6584] to-[#fe4c6f] hover:brightness-105 text-white shadow-[#fe4c6f]/25 active:scale-95'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Mengonversi HTML...' : 'Konversi ke Elementor Widget'}</span>
        </button>
      </div>
    </div>
  );
};

import React, { useRef } from 'react';
import { Upload, Sparkles, Trash2, FileCode, CheckCircle, Lightbulb } from 'lucide-react';
import { SAMPLE_PRESETS, SamplePreset } from '../data/samplePresets';

interface InputPanelProps {
  rawHtml: string;
  onChangeRawHtml: (val: string) => void;
  onConvert: () => void;
  isLoading: boolean;
  onSelectPreset: (preset: SamplePreset) => void;
  selectedPresetId: string | null;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  rawHtml,
  onChangeRawHtml,
  onConvert,
  isLoading,
  onSelectPreset,
  selectedPresetId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = rawHtml.length;
  // Rough token estimation (~4 chars per token for HTML code)
  const estTokens = Math.round(charCount / 4);

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Panel Top Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white">1. Input HTML Gemini Canvas</h2>
        </div>

        {/* Stats Counter & Clear */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {charCount > 0 && (
            <span className="font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
              <strong className="text-amber-400">{charCount.toLocaleString()}</strong> kar | ~<strong className="text-amber-300">{estTokens.toLocaleString()}</strong> token
            </span>
          )}

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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Upload File .html"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Upload File</span>
          </button>

          {charCount > 0 && (
            <button
              type="button"
              onClick={() => onChangeRawHtml('')}
              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Bersihkan Input"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sample Presets Buttons */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Coba Sample Nyata (1-Click Preset):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {isSelected && <CheckCircle className="w-3 h-3 text-amber-400 shrink-0" />}
                <span>{preset.title}</span>
              </button>
            );
          })}
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
          className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none leading-relaxed"
          spellCheck={false}
        />

        {charCount === 0 && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center text-slate-600">
            <Upload className="w-8 h-8 mb-2 opacity-50 text-slate-500" />
            <p className="text-xs font-medium">Paste HTML atau Drag & Drop file <code className="text-slate-400">.html</code> ke sini</p>
          </div>
        )}
      </div>

      {/* Convert Action Button */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <p className="text-[11px] text-slate-500 hidden sm:block">
          Output dikonversi ke HTML widget Elementor tanpa mengubah visual 1:1.
        </p>

        <button
          type="button"
          onClick={onConvert}
          disabled={isLoading || charCount === 0}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-extrabold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
            isLoading || charCount === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 active:scale-95'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Mengonversi HTML...' : 'Konversi ke Elementor Widget'}</span>
        </button>
      </div>
    </div>
  );
};

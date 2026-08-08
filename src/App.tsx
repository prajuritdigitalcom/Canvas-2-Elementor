import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { InputPanel } from './components/InputPanel';
import { ConversionStatus } from './components/ConversionStatus';
import { OutputPanel } from './components/OutputPanel';
import { HistoryModal } from './components/HistoryModal';
import { SAMPLE_PRESETS, SamplePreset } from './data/samplePresets';
import { parseKeysFromText, validateConvertedHtml } from './utils/converterValidation';
import {
  KeyStatus,
  ValidationResult,
  ConvertResponse,
  ConversionHistoryItem,
} from './types';
import { Sparkles, ShieldCheck, Zap, Layers } from 'lucide-react';

export default function App() {
  // Server state
  const [serverKeyCount, setServerKeyCount] = useState(0);
  const [serverKeysAvailable, setServerKeysAvailable] = useState(false);

  // User API Keys state
  const [userKeysText, setUserKeysText] = useState(() => {
    return localStorage.getItem('c2e_user_keys') || '';
  });

  // Modal open states
  const [isKeysModalOpen, setIsKeysModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Input HTML & Preset state
  const [rawHtml, setRawHtml] = useState(SAMPLE_PRESETS[0].rawHtml);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(SAMPLE_PRESETS[0].id);

  // Conversion result & progress state
  const [isLoading, setIsLoading] = useState(false);
  const [outputHtml, setOutputHtml] = useState('');
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>([]);
  const [validation, setValidation] = useState<ValidationResult | undefined>(undefined);
  const [durationMs, setDurationMs] = useState<number | undefined>(undefined);
  const [usedSource, setUsedSource] = useState<'user' | 'server' | undefined>(undefined);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<ConversionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('c2e_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch server health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setServerKeyCount(data.serverKeysCount || 0);
          setServerKeysAvailable(data.serverKeysAvailable || false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch /api/health:', err);
      });
  }, []);

  const parsedUserKeys = parseKeysFromText(userKeysText);

  // Save API keys handler
  const handleSaveKeys = (keysText: string, remember: boolean) => {
    setUserKeysText(keysText);
    if (remember) {
      localStorage.setItem('c2e_user_keys', keysText);
      localStorage.setItem('c2e_remember_keys', 'true');
    } else {
      localStorage.removeItem('c2e_user_keys');
      localStorage.removeItem('c2e_remember_keys');
    }
  };

  // Preset selection handler
  const handleSelectPreset = (preset: SamplePreset) => {
    setRawHtml(preset.rawHtml);
    setSelectedPresetId(preset.id);
  };

  const handleRawHtmlChange = (newHtml: string) => {
    setRawHtml(newHtml);
    if (selectedPresetId) {
      setSelectedPresetId(null); // User modified preset
    }
  };

  // Main Conversion Handler
  const handleConvert = async () => {
    if (!rawHtml.trim()) return;

    setIsLoading(true);
    setConversionError(null);
    setKeyStatuses([]);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawHtml,
          userKeys: parsedUserKeys,
        }),
      });

      const responseText = await response.text();
      let data: ConvertResponse;

      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('[C2E_FRONTEND_PARSE_ERROR] Non-JSON response received:', responseText);
        setConversionError(
          `Respon Server Tidak Valid (HTTP ${response.status}): ${responseText.slice(0, 150)}... Silakan periksa Vercel / Cloud Run logs dengan tag [C2E_CRACK_SERVER_EXPRESS_ERROR]`
        );
        return;
      }

      if (data.keyStatuses) {
        setKeyStatuses(data.keyStatuses);
      }
      if (data.durationMs !== undefined) {
        setDurationMs(data.durationMs);
      }
      if (data.usedSource) {
        setUsedSource(data.usedSource);
      }

      if (data.success && data.html) {
        setOutputHtml(data.html);

        const valResult = data.validation || validateConvertedHtml(data.html);
        setValidation(valResult);

        // Add to history
        const titleMatch = rawHtml.match(/<title>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'Konversi Canvas';

        const newItem: ConversionHistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          title,
          detectedPrefix: valResult.detectedPrefix || 'wn2',
          rawLength: rawHtml.length,
          outputLength: data.html.length,
          rawHtml,
          outputHtml: data.html,
          validation: valResult,
        };

        const updatedHistory = [newItem, ...history.slice(0, 19)]; // Keep last 20
        setHistory(updatedHistory);
        localStorage.setItem('c2e_history', JSON.stringify(updatedHistory));
      } else {
        setConversionError(data.error || 'Konversi gagal diproses.');
      }
    } catch (err: any) {
      setConversionError(err.message || 'Gagal terhubung ke server API konversi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: ConversionHistoryItem) => {
    setRawHtml(item.rawHtml);
    setOutputHtml(item.outputHtml);
    setValidation(item.validation);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('c2e_history');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        userKeyCount={parsedUserKeys.length}
        serverKeyCount={serverKeyCount}
        serverKeysAvailable={serverKeysAvailable}
        onOpenKeysModal={() => setIsKeysModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Intro Tagline */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Re-Packaging HTML Canvas 1:1 Tanpa Perubahan Visual
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Mengubah dokumen HTML Gemini Canvas (Tailwind CDN runtime) menjadi HTML statis dengan prefix CSS otomatis yang siap ditempel ke <strong>Elementor HTML Widget</strong> di WordPress.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0 font-medium border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Key Rotasi 429</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Tailwind → CSS Statis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>JS Proteksi DOM</span>
            </div>
          </div>
        </div>

        {/* Realtime Status Log Bar (When Loading / Done / Error) */}
        <ConversionStatus
          isLoading={isLoading}
          keyStatuses={keyStatuses}
          durationMs={durationMs}
          error={conversionError}
          usedSource={usedSource}
        />

        {/* Workspace Dual Panel Grid */}
        <div className="grid lg:grid-cols-2 gap-6 items-start min-h-[550px]">
          {/* Left: Input Panel */}
          <InputPanel
            rawHtml={rawHtml}
            onChangeRawHtml={handleRawHtmlChange}
            onConvert={handleConvert}
            isLoading={isLoading}
            onSelectPreset={handleSelectPreset}
            selectedPresetId={selectedPresetId}
          />

          {/* Right: Output & Validation Panel */}
          <OutputPanel
            outputHtml={outputHtml}
            validation={validation}
            detectedPrefix={validation?.detectedPrefix}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800 text-slate-500 py-4 text-center text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Prajurit Digital — Canvas2Elementor Converter (Gemini Multi-Key Engine)</p>
          <p className="text-[11px] text-slate-600">
            Didesain khusus untuk workflow WordPress Elementor Passang Konstruksi & Interior Client.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isKeysModalOpen}
        onClose={() => setIsKeysModalOpen(false)}
        userKeysText={userKeysText}
        onSaveKeys={handleSaveKeys}
        serverKeyCount={serverKeyCount}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

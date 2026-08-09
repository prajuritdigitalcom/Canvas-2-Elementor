import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ApiKeyPanel } from './components/ApiKeyPanel';
import { InputPanel } from './components/InputPanel';
import { ConversionStatus } from './components/ConversionStatus';
import { OutputPanel } from './components/OutputPanel';
import { SAMPLE_PRESETS, SamplePreset } from './data/samplePresets';
import { parseKeysFromText, validateConvertedHtml } from './utils/converterValidation';
import {
  KeyStatus,
  ValidationResult,
  ConvertResponse,
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

  // Input HTML & Preset state
  const [rawHtml, setRawHtml] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Conversion result & progress state
  const [isLoading, setIsLoading] = useState(false);
  const [outputHtml, setOutputHtml] = useState('');
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>([]);
  const [validation, setValidation] = useState<ValidationResult | undefined>(undefined);
  const [durationMs, setDurationMs] = useState<number | undefined>(undefined);
  const [usedSource, setUsedSource] = useState<'user' | 'server' | undefined>(undefined);
  const [conversionError, setConversionError] = useState<string | null>(null);

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

        const valResult = data.validation || validateConvertedHtml(data.html, rawHtml);
        setValidation(valResult);
      } else {
        setConversionError(data.error || 'Konversi gagal diproses.');
      }
    } catch (err: any) {
      setConversionError(err.message || 'Gagal terhubung ke server API konversi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrollToKeys = () => {
    const elem = document.getElementById('api-keys-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsKeysModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-[#fe4c6f] selection:text-white">
      {/* Top Header */}
      <Header
        userKeyCount={parsedUserKeys.length}
        serverKeyCount={serverKeyCount}
        serverKeysAvailable={serverKeysAvailable}
        onOpenKeysModal={handleScrollToKeys}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Intro Tagline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#fe4c6f]/10 text-[#fe4c6f] border border-[#fe4c6f]/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Re-Packaging HTML Canvas 1:1 Tanpa Perubahan Visual
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Ubah HTML Gemini Canvas menjadi HTML statis siap ditempel ke <strong className="text-[#fe4c6f] font-semibold">Elementor HTML Widget WordPress</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 font-medium border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-Key Rotasi 429</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#fe4c6f]" />
              <span>Tailwind → CSS Statis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
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

        {/* Input Area (2 Columns Grid: Kolom 1 = Gemini API Keys, Kolom 2 = HTML Gemini Canvas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Kolom 1: Input API Keys Gemini */}
          <ApiKeyPanel
            userKeysText={userKeysText}
            onSaveKeys={handleSaveKeys}
            serverKeyCount={serverKeyCount}
            serverKeysAvailable={serverKeysAvailable}
          />

          {/* Kolom 2: Input HTML Gemini Canvas */}
          <InputPanel
            rawHtml={rawHtml}
            onChangeRawHtml={handleRawHtmlChange}
            onConvert={handleConvert}
            isLoading={isLoading}
            onSelectPreset={handleSelectPreset}
            selectedPresetId={selectedPresetId}
          />
        </div>

        {/* Output Area (2 Columns Grid: Kolom 1 = Code Mode, Kolom 2 = Live Preview Mode) */}
        <OutputPanel
          outputHtml={outputHtml}
          validation={validation}
          detectedPrefix={validation?.detectedPrefix}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 text-center text-xs mt-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <p>© 2026 Karya Prajurit Digital. Hak Cipta Dilindungi.</p>
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
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Key, Save, Trash2, Info, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { parseKeysFromText, maskApiKey } from '../utils/converterValidation';

interface ApiKeyPanelProps {
  userKeysText: string;
  onSaveKeys: (keysText: string, remember: boolean) => void;
  serverKeyCount: number;
  serverKeysAvailable: boolean;
}

export const ApiKeyPanel: React.FC<ApiKeyPanelProps> = ({
  userKeysText,
  onSaveKeys,
  serverKeyCount,
  serverKeysAvailable,
}) => {
  const [text, setText] = useState(userKeysText);
  const [showRawKeys, setShowRawKeys] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setText(userKeysText);
  }, [userKeysText]);

  const parsedKeys = parseKeysFromText(text);

  const handleSave = () => {
    onSaveKeys(text, true);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClear = () => {
    setText('');
    onSaveKeys('', false);
    localStorage.removeItem('c2e_user_keys');
    localStorage.removeItem('c2e_remember_keys');
  };

  return (
    <div id="api-keys-section" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-slate-100 text-[#fe4c6f] border border-slate-200">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Input API Keys Gemini</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-[#fe4c6f] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
            {parsedKeys.length} Key User
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
        <div className="flex items-center gap-2 text-[#fe4c6f] font-semibold text-[11px]">
          <Info className="w-3.5 h-3.5 text-[#fe4c6f] shrink-0" />
          <span>Prioritas Key Pool & Rotasi</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          {parsedKeys.length > 0 ? (
            <span>
              Sistem akan menggunakan <strong className="text-[#fe4c6f] font-bold">{parsedKeys.length} API Key milik Anda</strong> secara berurutan saat terjadi limit (429).
            </span>
          ) : serverKeysAvailable ? (
            <span>
              Tidak ada key user. Sistem memakai <strong className="text-emerald-700 font-bold">{serverKeyCount} Key Server Pool</strong> default.
            </span>
          ) : (
            <span className="text-rose-600 font-semibold">
              Masukkan minimal 1 API Key Gemini Anda di bawah ini untuk memulai konversi.
            </span>
          )}
        </p>
      </div>

      {/* Textarea Input with Show/Hide toggle */}
      <div className="space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Multi API Key (Satu Per Baris / Koma)</span>
          <button
            type="button"
            onClick={() => setShowRawKeys(!showRawKeys)}
            className="text-[11px] text-slate-500 hover:text-[#fe4c6f] flex items-center gap-1 transition-colors font-medium"
          >
            {showRawKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showRawKeys ? 'Sembunyikan' : 'Tampilkan'}</span>
          </button>
        </div>

        <div className="relative flex-1 min-h-[140px] flex flex-col">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // auto-save to localStorage as user types
              onSaveKeys(e.target.value, true);
            }}
            placeholder={`AIzaSyKey1xxxxxxxx\nAIzaSyKey2xxxxxxxx\nAIzaSyKey3xxxxxxxx`}
            rows={5}
            style={{ WebkitTextSecurity: showRawKeys ? 'none' : 'disc' } as any}
            className="w-full flex-1 bg-slate-50/80 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#fe4c6f] focus:ring-2 focus:ring-[#fe4c6f]/20 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Parsed Keys Preview Badges */}
      {parsedKeys.length > 0 && (
        <div className="space-y-1.5">
          <span className="block text-[11px] font-semibold text-slate-500">
            Preview Active Key Pool ({parsedKeys.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200">
            {parsedKeys.map((k, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[#fe4c6f] border border-slate-200 text-[11px] font-mono font-medium"
              >
                <CheckCircle2 className="w-3 h-3 text-[#fe4c6f] shrink-0" />
                Key #{idx + 1}: {maskApiKey(k)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
        {text && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1"
            title="Hapus Key"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md ${
            savedSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-[#fe4c6f] hover:bg-[#e03a5c] text-white shadow-[#fe4c6f]/25 active:scale-95'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Key'}</span>
        </button>
      </div>
    </div>
  );
};

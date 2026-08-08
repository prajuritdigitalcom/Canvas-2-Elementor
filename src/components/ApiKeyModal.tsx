import React, { useState, useEffect } from 'react';
import { Key, X, Save, Trash2, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import { parseKeysFromText, maskApiKey } from '../utils/converterValidation';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userKeysText: string;
  onSaveKeys: (keysText: string, remember: boolean) => void;
  serverKeyCount: number;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  userKeysText,
  onSaveKeys,
  serverKeyCount,
}) => {
  const [text, setText] = useState(userKeysText);
  const [remember, setRemember] = useState(() => {
    return localStorage.getItem('c2e_remember_keys') === 'true';
  });

  useEffect(() => {
    setText(userKeysText);
  }, [userKeysText, isOpen]);

  if (!isOpen) return null;

  const parsedKeys = parseKeysFromText(text);

  const handleSave = () => {
    onSaveKeys(text, remember);
    onClose();
  };

  const handleClear = () => {
    setText('');
    onSaveKeys('', false);
    localStorage.removeItem('c2e_user_keys');
    localStorage.removeItem('c2e_remember_keys');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-[#fe4c6f] border border-slate-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengaturan Gemini API Key</h2>
              <p className="text-xs text-slate-500">Multi-Key Rotation Engine (Tier Gratis / Paid)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Info Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-start gap-2 text-[#fe4c6f] font-semibold">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Sistem Prioritas Key & Rotasi Otomatis</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              1. Jika Anda memasukkan key di sini, sistem <strong className="text-slate-800">hanya memakai key milik Anda</strong>.<br />
              2. Jika bidang ini dikosongkan, sistem memakai <strong className="text-slate-800">{serverKeyCount} key default</strong> dari server environment.<br />
              3. Tempel banyak key (1 key per baris atau dipisah koma) untuk mengaktifkan sistem rotasi saat rate limit (429).
            </p>
          </div>

          {/* Textarea Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Paste Multi API Key (Satu Per Baris / Koma)</span>
              <span className="text-[#fe4c6f] font-bold">{parsedKeys.length} Key Terdeteksi</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`AIzaSyKey1xxxxxxxx\nAIzaSyKey2xxxxxxxx\nAIzaSyKey3xxxxxxxx`}
              rows={4}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#fe4c6f] focus:ring-2 focus:ring-[#fe4c6f]/20 transition-all resize-none"
            />
          </div>

          {/* Parsed Keys Preview Badges */}
          {parsedKeys.length > 0 && (
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                Preview Pool Key Aktif:
              </span>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 rounded-lg bg-slate-50 border border-slate-200">
                {parsedKeys.map((k, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[#fe4c6f] border border-slate-200 text-[11px] font-mono font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#fe4c6f]" />
                    Key #{idx + 1}: {maskApiKey(k)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* LocalStorage Remember Checkbox */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#fe4c6f] focus:ring-[#fe4c6f]/30"
              />
              <span>Simpan API Key di peramban saya</span>
            </label>

            {userKeysText && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Key</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#fe4c6f] hover:bg-[#e03a5c] text-white font-bold text-xs shadow-md shadow-[#fe4c6f]/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Terapkan Key Pool</span>
          </button>
        </div>
      </div>
    </div>
  );
};

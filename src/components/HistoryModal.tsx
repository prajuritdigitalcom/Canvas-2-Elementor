import React from 'react';
import { History, X, Copy, Download, Trash2, ArrowRight, Tag } from 'lucide-react';
import { ConversionHistoryItem } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ConversionHistoryItem[];
  onSelectHistoryItem: (item: ConversionHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 text-[#fe4c6f] border border-slate-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Riwayat Konversi Local</h2>
              <p className="text-xs text-slate-500">Tersimpan di peramban Anda ({history.length} item)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#fe4c6f]" />
              <p className="text-xs font-semibold text-slate-600">Belum ada riwayat konversi tersimpan.</p>
              <p className="text-[11px] text-slate-500 mt-1">Lakukan konversi pertama Anda untuk mencatat riwayat secara otomatis.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/70 border border-slate-200 hover:border-[#fe4c6f]/50 rounded-xl p-4 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 group-hover:text-[#fe4c6f] transition-colors">
                      {item.title}
                    </span>
                    <span className="bg-slate-100 text-[#fe4c6f] border border-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                      <Tag className="w-2.5 h-2.5 inline" />
                      {item.detectedPrefix || 'wn2'}-
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px]">
                    Input: {(item.rawLength / 1024).toFixed(1)} KB → Output: {(item.outputLength / 1024).toFixed(1)} KB
                  </span>

                  <button
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#fe4c6f] hover:bg-[#e03a5c] text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm shadow-[#fe4c6f]/20"
                  >
                    <span>Muat ke Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          {history.length > 0 ? (
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Semua Riwayat</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

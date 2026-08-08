import React from 'react';
import { Key, History, Sparkles, Server, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  userKeyCount: number;
  serverKeyCount: number;
  serverKeysAvailable: boolean;
  onOpenKeysModal: () => void;
  onOpenHistoryModal: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  userKeyCount,
  serverKeyCount,
  serverKeysAvailable,
  onOpenKeysModal,
  onOpenHistoryModal,
  historyCount,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="https://i.ibb.co.com/wr0x733r/prajurit-digital.jpg"
            alt="Prajurit Digital Logo"
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                Canvas2Elementor
              </h1>
              <span className="bg-[#fe4c6f]/10 text-[#fe4c6f] border border-[#fe4c6f]/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Prajurit Digital
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              HTML Gemini Canvas → Elementor Widget Converter
            </p>
          </div>
        </div>

        {/* Action Controls & Key Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Key Pool Indicator */}
          <button
            onClick={onOpenKeysModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors text-xs font-semibold text-slate-700"
            title="Kelola API Key Gemini"
          >
            <Key className="w-3.5 h-3.5 text-[#fe4c6f]" />
            <span className="hidden md:inline">API Keys:</span>
            {userKeyCount > 0 ? (
              <span className="bg-[#fe4c6f]/10 text-[#fe4c6f] px-2 py-0.5 rounded-md font-bold text-[11px] border border-[#fe4c6f]/20">
                {userKeyCount} User Key{userKeyCount > 1 ? 's' : ''}
              </span>
            ) : serverKeysAvailable ? (
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[11px] border border-emerald-200 flex items-center gap-1">
                <Server className="w-3 h-3 inline" />
                {serverKeyCount} Server Pool Key{serverKeyCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold text-[11px] border border-rose-200 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 inline" />
                Kosong
              </span>
            )}
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistoryModal}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors text-xs font-semibold text-slate-700"
            title="Riwayat Konversi"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Riwayat</span>
            {historyCount > 0 && (
              <span className="bg-rose-50 text-[#fe4c6f] text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-rose-200">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

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
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-lg tracking-tighter">
              C2E
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                Canvas2Elementor
              </h1>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                v1.1 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              HTML Gemini Canvas → Elementor Widget Converter (Prajurit Digital)
            </p>
          </div>
        </div>

        {/* Action Controls & Key Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Key Pool Indicator */}
          <button
            onClick={onOpenKeysModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors text-xs font-medium text-slate-200"
            title="Kelola API Key Gemini"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">API Keys:</span>
            {userKeyCount > 0 ? (
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold text-[11px] border border-amber-500/30">
                {userKeyCount} User Key{userKeyCount > 1 ? 's' : ''}
              </span>
            ) : serverKeysAvailable ? (
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1">
                <Server className="w-3 h-3 inline" />
                {serverKeyCount} Server Pool Key{serverKeyCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md font-bold text-[11px] border border-red-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 inline" />
                Kosong
              </span>
            )}
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistoryModal}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors text-xs font-medium text-slate-300"
            title="Riwayat Konversi"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Riwayat</span>
            {historyCount > 0 && (
              <span className="bg-slate-700 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-600">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

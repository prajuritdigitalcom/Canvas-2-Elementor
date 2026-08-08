import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Key, ShieldAlert, Clock } from 'lucide-react';
import { KeyStatus } from '../types';

interface ConversionStatusProps {
  isLoading: boolean;
  keyStatuses: KeyStatus[];
  currentKeyIndex?: number;
  durationMs?: number;
  error?: string | null;
  usedSource?: 'user' | 'server';
}

export const ConversionStatus: React.FC<ConversionStatusProps> = ({
  isLoading,
  keyStatuses,
  durationMs,
  error,
  usedSource,
}) => {
  if (!isLoading && keyStatuses.length === 0 && !error) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      {/* Top Banner */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          {isLoading ? (
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
          ) : error ? (
            <ShieldAlert className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}

          <span>
            {isLoading
              ? 'Engine Gemini API Sedang Memproses Konversi...'
              : error
              ? 'Konversi Gagal'
              : 'Konversi Berhasil Selesai!'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          {usedSource && (
            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              Sumber: {usedSource === 'user' ? 'User Custom Keys' : 'Server Keys Pool'}
            </span>
          )}

          {durationMs !== undefined && (
            <span className="flex items-center gap-1 font-mono text-slate-300">
              <Clock className="w-3 h-3 text-amber-400" />
              {(durationMs / 1000).toFixed(2)} detik
            </span>
          )}
        </div>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold text-red-200">Terjadi Kesalahan Rotasi Key</p>
            <p className="mt-0.5 text-red-300/80 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Multi-Key Rotation Timeline */}
      {keyStatuses.length > 0 && (
        <div>
          <span className="block text-[11px] font-semibold text-slate-400 mb-2">
            Status Log Rotasi API Key ({keyStatuses.length} Key di Pool):
          </span>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {keyStatuses.map((k) => {
              let badgeBg = 'bg-slate-950 border-slate-800 text-slate-400';
              let icon = <Key className="w-3 h-3 text-slate-500" />;
              let label = 'Belum Dicoba';

              if (k.status === 'in_use') {
                badgeBg = 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse';
                icon = <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />;
                label = 'Sedang Dicoba...';
              } else if (k.status === 'success') {
                badgeBg = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300';
                icon = <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
                label = 'Sukses Menerima Hasil';
              } else if (k.status === 'rate_limited') {
                badgeBg = 'bg-amber-900/30 border-amber-600/40 text-amber-300';
                icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
                label = 'Limit 429 (Rotasi ke Key Berikutnya)';
              } else if (k.status === 'invalid') {
                badgeBg = 'bg-red-950/40 border-red-800/40 text-red-300';
                icon = <ShieldAlert className="w-3 h-3 text-red-400" />;
                label = 'Key Invalid (401/403)';
              } else if (k.status === 'error') {
                badgeBg = 'bg-red-950/30 border-red-800/30 text-red-300';
                icon = <AlertTriangle className="w-3 h-3 text-red-400" />;
                label = 'Network / Server Error';
              }

              return (
                <div
                  key={k.index}
                  className={`p-2.5 rounded-xl border text-xs font-mono flex flex-col justify-between transition-all ${badgeBg}`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      {icon}
                      Key #{k.index + 1} ({k.maskedKey})
                    </span>
                  </div>
                  <span className="text-[10px] opacity-80">{label}</span>
                  {k.lastError && (
                    <span className="text-[9px] text-red-300/80 mt-1 truncate" title={k.lastError}>
                      {k.lastError}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

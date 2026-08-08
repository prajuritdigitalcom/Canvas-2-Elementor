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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Top Banner */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          {isLoading ? (
            <RefreshCw className="w-4 h-4 text-[#fe4c6f] animate-spin" />
          ) : error ? (
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}

          <span>
            {isLoading
              ? 'Engine Gemini API Sedang Memproses Konversi...'
              : error
              ? 'Konversi Gagal'
              : 'Konversi Berhasil Selesai!'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          {usedSource && (
            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[#fe4c6f] border border-slate-200 font-mono font-semibold">
              Sumber: {usedSource === 'user' ? 'User Custom Keys' : 'Server Keys Pool'}
            </span>
          )}

          {durationMs !== undefined && (
            <span className="flex items-center gap-1 font-mono text-slate-600 font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#fe4c6f]" />
              {(durationMs / 1000).toFixed(2)} detik
            </span>
          )}
        </div>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold text-rose-800">Terjadi Kesalahan Rotasi Key</p>
            <p className="mt-0.5 text-rose-700 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Multi-Key Rotation Timeline */}
      {keyStatuses.length > 0 && (
        <div>
          <span className="block text-[11px] font-semibold text-slate-500 mb-2">
            Status Log Rotasi API Key ({keyStatuses.length} Key di Pool):
          </span>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {keyStatuses.map((k) => {
              let badgeBg = 'bg-slate-50 border-slate-200 text-slate-600';
              let icon = <Key className="w-3 h-3 text-slate-400" />;
              let label = 'Belum Dicoba';

              if (k.status === 'in_use') {
                badgeBg = 'bg-rose-50 border-rose-300 text-[#fe4c6f] animate-pulse';
                icon = <RefreshCw className="w-3 h-3 text-[#fe4c6f] animate-spin" />;
                label = 'Sedang Dicoba...';
              } else if (k.status === 'success') {
                badgeBg = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
                label = 'Sukses Menerima Hasil';
              } else if (k.status === 'rate_limited') {
                badgeBg = 'bg-amber-50 border-amber-300 text-amber-800';
                icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
                label = 'Limit 429 (Rotasi ke Key Berikutnya)';
              } else if (k.status === 'invalid') {
                badgeBg = 'bg-rose-100 border-rose-300 text-rose-800';
                icon = <ShieldAlert className="w-3 h-3 text-rose-600" />;
                label = 'Key Invalid (401/403)';
              } else if (k.status === 'error') {
                badgeBg = 'bg-rose-50 border-rose-200 text-rose-800';
                icon = <AlertTriangle className="w-3 h-3 text-rose-600" />;
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
                  <span className="text-[10px] opacity-90 font-medium">{label}</span>
                  {k.lastError && (
                    <span className="text-[9px] text-rose-700 font-semibold mt-1 truncate" title={k.lastError}>
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

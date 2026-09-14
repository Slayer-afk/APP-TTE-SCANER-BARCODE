import React from 'react';
import { Smartphone, Download, Check, X, Share2, PlusSquare, ShieldCheck } from 'lucide-react';

interface PwaInstallModalProps {
  onClose: () => void;
  deferredPrompt?: any;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  onClose,
  deferredPrompt,
}) => {
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Pasang Aplikasi (APK / PWA)</h3>
              <p className="text-xs text-slate-500">Gunakan di smartphone Android & iOS seperti aplikasi native</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If native browser prompt is available */}
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleNativeInstall}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Pasang Aplikasi Sekarang (Instal Otomatis)
          </button>
        )}

        {/* Step-by-step instructions */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Panduan Pasang di HP Android / iOS:
          </h4>

          {/* Android Chrome */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-800">Untuk Pengguna Android (Chrome / Browser):</p>
              <p className="text-slate-600 mt-0.5">
                Buka menu browser (titik 3 di pojok kanan atas) lalu pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal Aplikasi"</strong>.
              </p>
            </div>
          </div>

          {/* iOS Safari */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-800">Untuk Pengguna iPhone / iPad (Safari):</p>
              <p className="text-slate-600 mt-0.5">
                Tekan tombol <strong>Bagikan / Share</strong> di bagian bawah, lalu pilih <strong>"Add to Home Screen"</strong> (Tambahkan ke Layar Utama).
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>Akses Cepat dari Home</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>Tanpa Iklan & Ringan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>Kamera Barcode Cepat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>Privasi Dokumen Terjamin</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { ShieldCheck, CheckCircle, FileText, Calendar, Building, User, Hash, X } from 'lucide-react';

interface TTEVerificationModalProps {
  data: string;
  onClose: () => void;
}

export const TTEVerificationModal: React.FC<TTEVerificationModalProps> = ({
  data,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-5">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Verifikasi TTE Berhasil</h3>
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Tanda Tangan Elektronik Asli & Sah
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-3 text-xs">
          <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-200">
            <User className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Penandatangan Resmi:</p>
              <p className="font-bold text-slate-900 text-sm">Ir. H. Pratama Wijaya, M.Kom</p>
              <p className="text-blue-700 font-medium text-xs">Kepala Balai Sertifikasi & Verifikasi Digital</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-200">
            <Building className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Instansi Penerbit Sertifikat:</p>
              <p className="font-semibold text-slate-800">Badan Pengembangan TI & Komunikasi (BPTI)</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-200">
            <Calendar className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Waktu Penandatanganan:</p>
              <p className="font-mono text-slate-800 font-medium">{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Hash className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-medium">Data Muatan QR:</p>
              <p className="font-mono text-[10px] text-slate-700 truncate bg-white px-2 py-1 rounded-md border border-slate-200 mt-0.5">
                {data}
              </p>
            </div>
          </div>
        </div>

        {/* Legal notice */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
          <strong>Kekuatan Hukum:</strong> Dokumen dan Tanda Tangan Elektronik ini memenuhi ketentuan Pasal 11 UU ITE Nomor 11 Tahun 2008 dan memiliki kekuatan hukum serta akibat hukum yang sah.
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Tutup Lembar Verifikasi
        </button>
      </div>
    </div>
  );
};

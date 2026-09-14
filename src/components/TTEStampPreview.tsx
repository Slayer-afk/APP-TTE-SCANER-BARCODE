import React, { useEffect, useState } from 'react';
import { TTEConfig } from '../types';
import { generateQRDataUrl } from '../lib/qrHelper';
import { ShieldCheck, Calendar, Hash, Building2, UserCheck, ExternalLink } from 'lucide-react';

interface TTEStampPreviewProps {
  config: TTEConfig;
  className?: string;
  isCompact?: boolean;
}

export const TTEStampPreview: React.FC<TTEStampPreviewProps> = ({
  config,
  className = '',
  isCompact = false,
}) => {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const loadQR = async () => {
      const url = config.verificationUrl || `https://tte.layanan.go.id/verify?doc=${encodeURIComponent(config.docNumber)}`;
      try {
        const dataUrl = await generateQRDataUrl(url, {
          width: 240,
          margin: 1,
          colorDark: '#1e3a8a',
        });
        if (isMounted) setQrSrc(dataUrl);
      } catch (err) {
        console.error('Failed generating stamp QR preview:', err);
      }
    };
    loadQR();
    return () => {
      isMounted = false;
    };
  }, [config.verificationUrl, config.docNumber]);

  return (
    <div
      id="tte-stamp-preview-card"
      className={`relative bg-white border-2 border-blue-900/90 rounded-xl p-3 shadow-xs select-none overflow-hidden ${className}`}
      style={{
        boxShadow: '0 2px 8px -2px rgba(30, 58, 138, 0.12)',
      }}
    >
      {/* Decorative left security stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-blue-900" />

      <div className="pl-2 flex items-stretch gap-3">
        {/* Main Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[10px] tracking-wider uppercase mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700 flex-shrink-0" />
              <span className="truncate">Ditandatangani Elektronik (TTE)</span>
            </div>

            <h5 className="font-extrabold text-slate-900 text-sm leading-tight truncate">
              {config.signerName || 'Nama Penandatangan'}
            </h5>

            <p className="text-blue-700 font-semibold text-xs leading-snug truncate">
              {config.signerTitle || 'Jabatan / Posisi'}
            </p>

            <p className="text-slate-600 text-[11px] leading-tight truncate">
              {config.institution || 'Instansi / Lembaga'}
            </p>

            {config.signerId && (
              <p className="text-slate-500 font-mono text-[10px] leading-tight mt-0.5">
                NIP/NIK: {config.signerId}
              </p>
            )}
          </div>

          {/* Wet Signature Overlay if Combined or Signature Mode */}
          {config.signatureDataUrl && (config.signatureType === 'combined' || config.signatureType === 'wet_signature') && (
            <div className="my-1 py-0.5 border-y border-dashed border-blue-200">
              <img
                src={config.signatureDataUrl}
                alt="Paraf / Tanda Tangan"
                className="h-9 object-contain mix-blend-multiply filter contrast-125"
              />
            </div>
          )}

          {/* Security & Timestamp Footer */}
          <div className="mt-1.5 pt-1 border-t border-slate-100 flex flex-col gap-0.5 text-[9px] text-slate-500">
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Dokumen Sah Tersertifikasi</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 font-mono text-[8.5px]">
              <span>Tgl: {config.signDate}</span>
              <span className="truncate ml-1">No: {config.docNumber}</span>
            </div>
          </div>
        </div>

        {/* QR Code Seal Area */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR Verifikasi TTE"
              className="w-18 h-18 object-contain rounded-xs"
            />
          ) : (
            <div className="w-18 h-18 bg-slate-200 animate-pulse rounded-xs" />
          )}
          <span className="text-[8px] font-bold text-blue-900 uppercase tracking-tighter mt-1 text-center">
            Pindai TTE
          </span>
        </div>
      </div>
    </div>
  );
};

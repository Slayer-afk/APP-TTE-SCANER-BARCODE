import React, { useState, useEffect, useRef } from 'react';
import {
  generateBrandedQRDataUrl,
  generateQRSvg,
} from '../lib/qrHelper';
import {
  generateBarcodeDataUrl,
  generateAutoBarcodeNumber,
} from '../lib/barcodeHelper';
import {
  Link2,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  FileSignature,
  ExternalLink,
  ShieldCheck,
  Zap,
  FolderOpen,
  FileText,
  Eye,
  CheckCircle2,
  Layers,
  ArrowRight,
  Barcode as BarcodeIcon,
  RefreshCw,
} from 'lucide-react';
import { DocumentFile, AutoMountPlacement, AutoMountStyle } from '../types';
import { stampQrDirectlyToPdf } from '../lib/pdfHelper';
import { DocumentFileSelector } from './DocumentFileSelector';

interface QRGeneratorProps {
  initialUrl?: string;
  activeDoc: DocumentFile | null;
  onSelectDoc: (file: DocumentFile) => void;
  onApplyToTTE?: (
    qrDataUrl: string,
    link: string,
    placement?: AutoMountPlacement,
    style?: AutoMountStyle
  ) => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({
  initialUrl = 'https://layanan.go.id/dokumen-tte/verifikasi?id=TTE-2026-9812',
  activeDoc,
  onSelectDoc,
  onApplyToTTE,
}) => {
  // Mode: QR Code 2D vs Barcode Garis 1D
  const [codeType, setCodeType] = useState<'qr' | 'barcode1d'>('qr');

  // Barcode 1D State
  const [barcodeText, setBarcodeText] = useState<string>(generateAutoBarcodeNumber('doc'));
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'CODE39'>('CODE128');
  const [barcodeDisplayValue, setBarcodeDisplayValue] = useState<boolean>(true);
  const [barcodeHeight, setBarcodeHeight] = useState<number>(55);
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>('');

  const [url, setUrl] = useState<string>(initialUrl);
  const [colorDark, setColorDark] = useState<string>('#1e3a8a');
  const [colorLight, setColorLight] = useState<string>('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [iconType, setIconType] = useState<'none' | 'link' | 'shield' | 'verified'>('link');
  const [includeLabel, setIncludeLabel] = useState<boolean>(true);
  const [labelText, setLabelText] = useState<string>('Pindai Tautan Resmi');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [appliedToTTE, setAppliedToTTE] = useState<boolean>(false);

  // Auto-Mount to Document State
  const [autoMountEnabled, setAutoMountEnabled] = useState<boolean>(true);
  const [autoMountPlacement, setAutoMountPlacement] = useState<AutoMountPlacement>('bottom-right');
  const [autoMountStyle, setAutoMountStyle] = useState<AutoMountStyle>('tte_seal');
  const [autoMountStampTheme, setAutoMountStampTheme] = useState<'blue' | 'red' | 'black'>('blue');
  const [isAutoMounting, setIsAutoMounting] = useState<boolean>(false);
  const [mountedPdfBlobUrl, setMountedPdfBlobUrl] = useState<string | null>(null);
  const [mountedPdfDocHash, setMountedPdfDocHash] = useState<string | null>(null);
  const [mountedSuccess, setMountedSuccess] = useState<boolean>(false);

  // Sync initialUrl prop
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  // Color preset options (termasuk Merah Terang, Merah Marun, Hitam Pekat, Hitam Klasik)
  const colorPresets = [
    { label: '🔴 Merah', dark: '#dc2626' },
    { label: '🔴 Merah Marun', dark: '#991b1b' },
    { label: '⚫ Hitam Pekat', dark: '#000000' },
    { label: '⚫ Hitam Klasik', dark: '#0f172a' },
    { label: '🔵 Navy Resmi', dark: '#1e3a8a' },
    { label: '🟢 Emerald Hijau', dark: '#047857' },
    { label: '🟣 Indigo Royal', dark: '#4338ca' },
  ];

  // Quick preset hyperlinks
  const sampleLinks = [
    { label: 'Verifikasi TTE Resmi', link: 'https://tte.layanan.go.id/verifikasi?id=BPTI-9921' },
    { label: 'Dokumen Cloud', link: 'https://drive.google.com/file/d/sample-tte-dokumen' },
    { label: 'Portal Layanan', link: 'https://layanan.go.id/portal-administrasi' },
  ];

  // Quick preset barcodes
  const sampleBarcodeButtons = [
    { label: 'No. Dokumen', value: () => generateAutoBarcodeNumber('doc') },
    { label: 'No. Registrasi', value: () => generateAutoBarcodeNumber('reg') },
    { label: 'No. TTE', value: () => generateAutoBarcodeNumber('tte') },
    { label: 'Angka 12-Digit', value: () => generateAutoBarcodeNumber('numeric') },
  ];

  // Regenerate Barcode 1D on change
  useEffect(() => {
    const bUrl = generateBarcodeDataUrl(barcodeText || 'DOC-2026-0001', {
      format: barcodeFormat,
      height: barcodeHeight,
      displayValue: barcodeDisplayValue,
      width: 2,
      lineColor: colorDark,
      background: '#ffffff',
    });
    setBarcodeDataUrl(bUrl);
  }, [barcodeText, barcodeFormat, barcodeDisplayValue, barcodeHeight, colorDark]);

  // Regenerate QR on change
  useEffect(() => {
    let isMounted = true;
    const updateQR = async () => {
      try {
        const textToEncode = url.trim() || 'https://layanan.go.id';
        const dataUrl = await generateBrandedQRDataUrl(textToEncode, {
          colorDark,
          colorLight,
          errorCorrectionLevel: errorCorrection,
          width: 700,
          margin: 2,
          iconType: iconType,
          labelText: includeLabel ? labelText : undefined,
        });
        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    updateQR();
    return () => {
      isMounted = false;
    };
  }, [url, colorDark, colorLight, errorCorrection, iconType, includeLabel, labelText]);

  // Auto-mount trigger when QR or Barcode is generated and auto-mount is enabled
  useEffect(() => {
    const activeCodeImg = codeType === 'barcode1d' ? barcodeDataUrl : qrDataUrl;
    if (!autoMountEnabled || !activeCodeImg || !activeDoc) return;

    const timer = setTimeout(() => {
      handleAutoMountDocument();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    codeType,
    barcodeDataUrl,
    qrDataUrl,
    activeDoc?.bytes,
    autoMountEnabled,
    autoMountPlacement,
    autoMountStyle,
    autoMountStampTheme,
  ]);

  // Execute Auto-Mount
  const handleAutoMountDocument = async () => {
    const activeCodeImg = codeType === 'barcode1d' ? barcodeDataUrl : qrDataUrl;
    if (!activeCodeImg || !activeDoc) return;
    setIsAutoMounting(true);

    const activeStyle: AutoMountStyle = codeType === 'barcode1d' ? 'barcode_1d' : autoMountStyle;

    try {
      const { pdfBytes, docHash } = await stampQrDirectlyToPdf(activeDoc.bytes, activeCodeImg, {
        placementPreset: autoMountPlacement,
        style: activeStyle,
        tteConfig: {
          verificationUrl: url.trim() || 'https://tte.layanan.go.id/verify',
          stampTheme: autoMountStampTheme,
        },
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setMountedPdfBlobUrl(blobUrl);
      setMountedPdfDocHash(docHash);
      setMountedSuccess(true);
    } catch (err) {
      console.error('Error auto-mounting code to PDF:', err);
    } finally {
      setIsAutoMounting(false);
    }
  };

  const handleDownloadPNG = () => {
    const activeCodeImg = codeType === 'barcode1d' ? barcodeDataUrl : qrDataUrl;
    if (!activeCodeImg) return;
    const a = document.createElement('a');
    a.href = activeCodeImg;
    a.download = `${codeType === 'barcode1d' ? 'Barcode' : 'QR-Link'}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSVG = async () => {
    if (codeType === 'barcode1d') {
      handleDownloadPNG();
      return;
    }
    try {
      const textToEncode = url.trim() || 'https://layanan.go.id';
      const svgString = await generateQRSvg(textToEncode, {
        colorDark,
        colorLight,
        errorCorrectionLevel: errorCorrection,
      });
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `QR-Link-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('SVG download failed:', err);
    }
  };

  const handleCopyImage = async () => {
    const activeCodeImg = codeType === 'barcode1d' ? barcodeDataUrl : qrDataUrl;
    if (!activeCodeImg) return;
    try {
      const res = await fetch(activeCodeImg);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      navigator.clipboard.writeText(codeType === 'barcode1d' ? barcodeText : url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyToTTE = () => {
    const activeCodeImg = codeType === 'barcode1d' ? barcodeDataUrl : qrDataUrl;
    const activeStyle: AutoMountStyle = codeType === 'barcode1d' ? 'barcode_1d' : autoMountStyle;
    if (onApplyToTTE && activeCodeImg) {
      onApplyToTTE(activeCodeImg, codeType === 'barcode1d' ? barcodeText : url, autoMountPlacement, activeStyle);
      setAppliedToTTE(true);
      setTimeout(() => setAppliedToTTE(false), 2500);
    }
  };

  const handleDownloadMountedPdf = () => {
    if (!mountedPdfBlobUrl || !activeDoc) return;
    const a = document.createElement('a');
    a.href = mountedPdfBlobUrl;
    a.download = `Dokumen_TTE_AutoMount_${activeDoc.name.replace('.pdf', '')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="qr-generator-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
      {/* Left Column: Input, File Selection & Configuration */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        {/* Mode Selector: QR Code vs Barcode 1D */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setCodeType('qr')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              codeType === 'qr'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-4 h-4 text-blue-600" />
            <span>Kode QR (Hyperlink & TTE)</span>
          </button>
          <button
            type="button"
            onClick={() => setCodeType('barcode1d')}
            className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              codeType === 'barcode1d'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarcodeIcon className="w-4 h-4 text-indigo-600" />
            <span>Barcode Garis (Code 128 / 39)</span>
          </button>
        </div>

        {/* Mode 1: QR Code Hyperlink Input Card */}
        {codeType === 'qr' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">1. Input Hyperlink / Tautan Web</h3>
                <p className="text-xs text-slate-500">Masukkan tautan web yang akan diubah menjadi Kode QR</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-hyperlink-url" className="text-xs font-semibold text-slate-700">
                Tautan Lengkap (URL)
              </label>
              <div className="relative flex items-center">
                <input
                  id="input-hyperlink-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://contoh-link-anda.com/halaman"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all pr-10"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Preset Links */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-500">Contoh Tautan Cepat:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleLinks.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setUrl(sample.link)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-slate-200/80"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Barcode Garis 1D Input Card */}
        {codeType === 'barcode1d' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BarcodeIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">1. Kode / Nomor Barcode Garis</h3>
                  <p className="text-xs text-slate-500">Ketik nomor atau buat nomor barcode otomatis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBarcodeText(generateAutoBarcodeNumber('doc'))}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Acak Nomor
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="input-barcode-text" className="text-xs font-semibold text-slate-700">
                Nilai / Nomor Barcode (Alfanumerik)
              </label>
              <div className="relative flex items-center">
                <input
                  id="input-barcode-text"
                  type="text"
                  value={barcodeText}
                  onChange={(e) => setBarcodeText(e.target.value.toUpperCase())}
                  placeholder="DOC-2026-08149"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all uppercase tracking-wider"
                />
              </div>
            </div>

            {/* Quick Generator Buttons */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-slate-500">⚡ Buat Barcode Otomatis:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {sampleBarcodeButtons.map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => setBarcodeText(btn.value())}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors text-center truncate"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format & display options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Format Barcode:</label>
                <div className="flex gap-2">
                  {[
                    { id: 'CODE128', label: 'Code 128 (Resmi)' },
                    { id: 'CODE39', label: 'Code 39' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setBarcodeFormat(fmt.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        barcodeFormat === fmt.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-4 sm:pt-5">
                  <input
                    type="checkbox"
                    checked={barcodeDisplayValue}
                    onChange={(e) => setBarcodeDisplayValue(e.target.checked)}
                    className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>Tampilkan nomor teks di bawah garis</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pilih File Dokumen Target (PDF) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">2. Pilih File Dokumen Target (PDF)</h3>
                <p className="text-xs text-slate-500">Pilih berkas yang akan dipasangi QR code secara otomatis</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Target Terpilih
            </span>
          </div>

          <DocumentFileSelector
            currentFile={activeDoc}
            onSelectFile={onSelectDoc}
            compact={true}
          />
        </div>

        {/* Step 3: Opsi Pemasangan Otomatis ke Dokumen */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-xs flex flex-col gap-4 bg-linear-to-b from-blue-50/20 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  3. Pasang Otomatis ke Dokumen
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-sm">
                    Auto-Mount
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  QR code langsung disematkan otomatis pada dokumen setelah selesai dibuat
                </p>
              </div>
            </div>

            {/* Toggle switch for auto-mount */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoMountEnabled}
                onChange={(e) => setAutoMountEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Placement and Style controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            {/* Placement selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Posisi Pemasangan:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'bottom-right', label: '↘ Kanan Bawah' },
                  { id: 'bottom-left', label: '↙ Kiri Bawah' },
                  { id: 'bottom-center', label: '⬇ Tengah Bawah' },
                  { id: 'top-right', label: '↗ Kanan Atas' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setAutoMountPlacement(pos.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      autoMountPlacement === pos.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Format Stempel:</label>
              {codeType === 'barcode1d' ? (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                  <BarcodeIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="font-semibold">Barcode Garis 1D Tracking ({barcodeFormat})</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAutoMountStyle('tte_seal')}
                    className={`py-1.5 px-3 rounded-xl text-[11px] font-semibold border text-left flex items-center justify-between transition-all ${
                      autoMountStyle === 'tte_seal'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🛡️ Stempel TTE Resmi + QR</span>
                    {autoMountStyle === 'tte_seal' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoMountStyle('clean_qr')}
                    className={`py-1.5 px-3 rounded-xl text-[11px] font-semibold border text-left flex items-center justify-between transition-all ${
                      autoMountStyle === 'clean_qr'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>📱 QR Code Bersih (Label Saja)</span>
                    {autoMountStyle === 'clean_qr' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </button>

                  {/* Stamp Theme Color for Auto-Mount */}
                  {autoMountStyle === 'tte_seal' && (
                    <div className="flex items-center gap-1.5 pt-1 mt-0.5">
                      <span className="text-[11px] font-bold text-slate-600">Warna Stempel:</span>
                      {[
                        { id: 'blue', label: 'Biru', icon: '🔵' },
                        { id: 'red', label: 'Merah', icon: '🔴' },
                        { id: 'black', label: 'Hitam', icon: '⚫' },
                      ].map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setAutoMountStampTheme(theme.id as any)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                            autoMountStampTheme === theme.id
                              ? 'border-slate-800 bg-slate-900 text-white shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{theme.icon}</span>
                          <span>{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Direct trigger button */}
          <button
            type="button"
            onClick={handleAutoMountDocument}
            disabled={isAutoMounting || !(codeType === 'barcode1d' ? barcodeDataUrl : qrDataUrl) || !activeDoc}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-200" />
            {isAutoMounting
              ? 'Sedang Memasang Otomatis ke Dokumen...'
              : `⚡ Pasang Otomatis ${codeType === 'barcode1d' ? 'Barcode Garis' : 'QR Code'} ke Dokumen Sekarang`}
          </button>
        </div>

        {/* Step 4: Kustomisasi Desain */}
        {codeType === 'qr' ? (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">4. Kustomisasi Desain Kode QR</h3>
                <p className="text-xs text-slate-500">Sesuaikan tema warna, logo ikon tengah, dan label bingkai</p>
              </div>
            </div>

            {/* Color Presets */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Warna Utama QR</label>
              <div className="flex flex-wrap items-center gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.dark}
                    type="button"
                    onClick={() => setColorDark(preset.dark)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      colorDark === preset.dark
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.dark }} />
                    {preset.label}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] text-slate-500">Custom:</span>
                  <input
                    type="color"
                    value={colorDark}
                    onChange={(e) => setColorDark(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                </div>
              </div>
            </div>

            {/* Center Badge Icon */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Ikon Lencana di Tengah QR</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'link', label: 'Tautan (Link)', icon: '🔗' },
                  { id: 'shield', label: 'TTE Perisai', icon: '🛡️' },
                  { id: 'verified', label: 'Centang Sah', icon: '✓' },
                  { id: 'none', label: 'Tanpa Ikon', icon: '—' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIconType(item.id as any)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all ${
                      iconType === item.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Label Banner */}
            <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label htmlFor="toggle-label-banner" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Sertakan Teks Label di Bawah QR
                </label>
                <input
                  id="toggle-label-banner"
                  type="checkbox"
                  checked={includeLabel}
                  onChange={(e) => setIncludeLabel(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
              </div>
              {includeLabel && (
                <input
                  type="text"
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  placeholder="PINDAI UNTUK MEMBUKA TAUTAN"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 uppercase tracking-wider"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">4. Kustomisasi Barcode Garis</h3>
                <p className="text-xs text-slate-500">Sesuaikan tema warna & dimensi garis barcode</p>
              </div>
            </div>

            {/* Color Presets for Barcode */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Warna Garis Barcode</label>
              <div className="flex flex-wrap items-center gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.dark}
                    type="button"
                    onClick={() => setColorDark(preset.dark)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      colorDark === preset.dark
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.dark }} />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Tinggi Garis Barcode:</label>
                <span className="text-xs font-mono font-bold text-indigo-700">{barcodeHeight} px</span>
              </div>
              <input
                type="range"
                min="35"
                max="90"
                value={barcodeHeight}
                onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Interactive Live Preview & Auto-Mounted Results */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {/* Live Preview Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            {codeType === 'barcode1d' ? 'Pratinjau Barcode Garis 1D' : 'Pratinjau Kode QR Hyperlink'}
          </span>

          {/* Container Frame */}
          {codeType === 'barcode1d' ? (
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col items-center justify-center max-w-full w-full min-h-[140px]">
              {barcodeDataUrl ? (
                <img
                  src={barcodeDataUrl}
                  alt="Barcode 1D"
                  className="max-h-24 w-auto object-contain"
                />
              ) : (
                <div className="w-full h-16 bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>
          ) : (
            <div className="relative p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-xs flex items-center justify-center max-w-[280px] w-full aspect-square">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Kode QR Hyperlink"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-xl" />
              )}
            </div>
          )}

          {/* Encoded value preview */}
          <div className="mt-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 max-w-full">
            <p className="text-[11px] font-mono text-slate-700 truncate max-w-[260px] font-bold">
              {codeType === 'barcode1d' ? barcodeText : url || 'https://layanan.go.id'}
            </p>
          </div>

          {/* Code Image Download Buttons */}
          <div className="w-full flex flex-col gap-2 mt-4">
            <button
              type="button"
              onClick={handleDownloadPNG}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Gambar {codeType === 'barcode1d' ? 'Barcode' : 'QR'} (PNG)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadSVG}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Vektor SVG
              </button>

              <button
                type="button"
                onClick={handleCopyImage}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Mount Result Box */}
        {mountedPdfBlobUrl && activeDoc && (
          <div className="bg-emerald-50/90 border-2 border-emerald-500 rounded-2xl p-5 shadow-xs flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-emerald-950 text-xs sm:text-sm">
                  {codeType === 'barcode1d' ? 'Barcode Garis' : 'Kode QR'} Otomatis Terpasang pada Dokumen!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5 truncate">
                  Target: <span className="font-semibold">{activeDoc.name}</span>
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Posisi: {autoMountPlacement === 'bottom-right' ? 'Kanan Bawah' : autoMountPlacement === 'bottom-left' ? 'Kiri Bawah' : autoMountPlacement === 'bottom-center' ? 'Tengah Bawah' : 'Kanan Atas'} • Format: {codeType === 'barcode1d' ? `Barcode ${barcodeFormat}` : autoMountStyle === 'tte_seal' ? 'Stempel Resmi TTE' : 'QR Bersih'}
                </p>
                {mountedPdfDocHash && (
                  <p className="font-mono text-[9.5px] text-emerald-800/80 mt-1 break-all">
                    SHA-256: {mountedPdfDocHash.slice(0, 28)}...
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadMountedPdf}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                Unduh PDF Hasil Pasang
              </button>

              <a
                href={mountedPdfBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Lihat PDF
              </a>
            </div>

            {/* Jump to TTE Editor */}
            {onApplyToTTE && (
              <button
                type="button"
                onClick={handleApplyToTTE}
                className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold transition-colors"
              >
                <FileSignature className="w-3.5 h-3.5 text-emerald-800" />
                Buka & Sesuaikan Posisi di Editor TTE
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Information Callout */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Fitur <strong>Pasang Otomatis</strong> membaca file PDF yang Anda pilih dan langsung merekatkan {codeType === 'barcode1d' ? 'barcode garis' : 'kode QR'} dengan koordinat presisi. Anda dapat mengunduh dokumen secara instan atau berpindah ke tab TTE untuk penyesuaian posisi bebas secara visual.
          </p>
        </div>
      </div>
    </div>
  );
};

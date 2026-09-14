import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  PenTool,
  CheckCircle2,
  FileSignature,
  Move,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RotateCw,
  Eye,
  FileCheck2,
  Zap,
  Check,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import {
  TTEConfig,
  SignaturePlacement,
  TTEDocumentRecord,
  DocumentFile,
  AutoMountPlacement,
  AutoMountStyle,
} from '../types';
import {
  createTTEStampCanvas,
  signPdfDocument,
} from '../lib/pdfHelper';
import { TTEStampPreview } from './TTEStampPreview';
import { SignaturePad } from './SignaturePad';
import { DocumentFileSelector } from './DocumentFileSelector';

interface TTEEditorProps {
  initialQrDataUrl?: string;
  initialQrUrl?: string;
  initialPlacementPreset?: AutoMountPlacement;
  initialStyle?: AutoMountStyle;
  activeDoc: DocumentFile | null;
  onSelectDoc: (file: DocumentFile) => void;
  onViewScannedDoc?: (record: TTEDocumentRecord) => void;
}

export const TTEEditor: React.FC<TTEEditorProps> = ({
  initialQrDataUrl,
  initialQrUrl,
  initialPlacementPreset = 'bottom-right',
  initialStyle = 'tte_seal',
  activeDoc,
  onSelectDoc,
}) => {
  // Document state
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // Signed document output
  const [signedPdfBlobUrl, setSignedPdfBlobUrl] = useState<string>('');
  const [signedRecord, setSignedRecord] = useState<TTEDocumentRecord | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  // Signature Config
  const [showSignaturePadModal, setShowSignaturePadModal] = useState<boolean>(false);
  const [tteConfig, setTteConfig] = useState<TTEConfig>({
    signerName: 'Ir. H. Pratama Wijaya, M.Kom',
    signerTitle: 'Kepala Balai Sertifikasi & Verifikasi Digital',
    institution: 'Badan Pengembangan TI & Komunikasi',
    signerId: '19840214 200801 1 003',
    signDate:
      new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' WIB',
    verificationUrl: initialQrUrl || `https://tte.layanan.go.id/verify?doc=SP-TTE-2026-889`,
    docNumber: 'SP-TTE/BPTI/2026/0891',
    docTitle: 'Surat Pernyataan Pengesahan Dokumen Elektronik',
    location: 'Jakarta',
    showQrCode: true,
    showSignerDetails: true,
    showEmblem: true,
    signatureType: initialStyle === 'clean_qr' ? 'tte_seal' : 'tte_seal',
    signatureDataUrl: undefined,
    qrDataUrl: initialQrDataUrl,
  });

  // Interactive Placement on Document (Percentages: 0 - 100%)
  const [placement, setPlacement] = useState<SignaturePlacement>({
    pageNumber: 1,
    xPercent: initialPlacementPreset === 'bottom-left' ? 6 : initialPlacementPreset === 'bottom-center' ? 30 : initialPlacementPreset === 'top-right' ? 55 : 55,
    yPercent: initialPlacementPreset === 'top-right' ? 12 : 68,
    widthPercent: 40,
    heightPercent: 16,
  });

  const pagePreviewRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Sync initialQrDataUrl and initialQrUrl
  useEffect(() => {
    if (initialQrDataUrl) {
      setTteConfig((prev) => ({
        ...prev,
        qrDataUrl: initialQrDataUrl,
        verificationUrl: initialQrUrl || prev.verificationUrl,
      }));
    }
  }, [initialQrDataUrl, initialQrUrl]);

  // Sync initialPlacementPreset
  useEffect(() => {
    if (initialPlacementPreset) {
      applyPresetPosition(initialPlacementPreset);
    }
  }, [initialPlacementPreset]);

  // Quick Preset Placement Position
  const applyPresetPosition = (preset: AutoMountPlacement | string) => {
    switch (preset) {
      case 'bottom-right':
        setPlacement((prev) => ({ ...prev, xPercent: 55, yPercent: 70 }));
        break;
      case 'bottom-left':
        setPlacement((prev) => ({ ...prev, xPercent: 6, yPercent: 70 }));
        break;
      case 'bottom-center':
        setPlacement((prev) => ({ ...prev, xPercent: 30, yPercent: 72 }));
        break;
      case 'top-right':
        setPlacement((prev) => ({ ...prev, xPercent: 55, yPercent: 12 }));
        break;
    }
  };

  // Dragging placement box over preview
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: placement.xPercent,
      startY: placement.yPercent,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        mouseX: e.touches[0].clientX,
        mouseY: e.touches[0].clientY,
        startX: placement.xPercent,
        startY: placement.yPercent,
      };
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !pagePreviewRef.current) return;
      const rect = pagePreviewRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartRef.current.mouseX;
      const deltaY = clientY - dragStartRef.current.mouseY;

      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      const newX = Math.max(0, Math.min(100 - placement.widthPercent, dragStartRef.current.startX + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - placement.heightPercent, dragStartRef.current.startY + deltaYPercent));

      setPlacement((prev) => ({
        ...prev,
        xPercent: Math.round(newX * 10) / 10,
        yPercent: Math.round(newY * 10) / 10,
      }));
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, placement.widthPercent, placement.heightPercent]);

  // Execute PDF signing
  const handleSignDocument = async () => {
    if (!activeDoc) return;
    setIsSigning(true);

    try {
      // 1. Generate crisp high-resolution stamp/signature image
      const stampDataUrl = await createTTEStampCanvas(tteConfig);
      if (!stampDataUrl) {
        throw new Error('Gagal merender stempel TTE.');
      }

      // 2. Sign PDF
      const currentPlacement: SignaturePlacement = {
        ...placement,
        pageNumber: selectedPage,
      };

      const result = await signPdfDocument(activeDoc.bytes, stampDataUrl, currentPlacement, {
        title: tteConfig.docTitle,
        author: tteConfig.signerName,
        subject: `Disahkan dengan Tanda Tangan Elektronik oleh ${tteConfig.signerName}`,
      });

      // 3. Create Signed Blob URL
      const signedBlob = new Blob([result.pdfBytes], { type: 'application/pdf' });
      const signedUrl = URL.createObjectURL(signedBlob);
      setSignedPdfBlobUrl(signedUrl);

      // 4. Save Record
      const record: TTEDocumentRecord = {
        id: `TTE-${Date.now()}`,
        title: tteConfig.docTitle,
        fileName: `Signed_${activeDoc.name}`,
        fileSize: signedBlob.size,
        signedAt: new Date().toLocaleString('id-ID'),
        pageCount: activeDoc.pageCount,
        signedPage: selectedPage,
        signerName: tteConfig.signerName,
        docHash: result.docHash,
        verificationUrl: tteConfig.verificationUrl,
        downloadUrl: signedUrl,
      };
      setSignedRecord(record);

      // Save to local storage history
      try {
        const existing = localStorage.getItem('tte_signed_history');
        const historyList = existing ? JSON.parse(existing) : [];
        localStorage.setItem('tte_signed_history', JSON.stringify([record, ...historyList.slice(0, 20)]));
      } catch (e) {
        console.error('Storage save error:', e);
      }

      // Confetti effect
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to sign document:', err);
      alert('Terjadi kesalahan saat membubuhi TTE. Silakan periksa kembali berkas PDF Anda.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadSignedPdf = () => {
    if (!signedPdfBlobUrl || !activeDoc) return;
    const a = document.createElement('a');
    a.href = signedPdfBlobUrl;
    a.download = `Signed_${activeDoc.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const pdfPageCount = activeDoc?.pageCount || 1;

  return (
    <div id="tte-editor-workspace" className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* File Selector Component */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pilih File Dokumen PDF</h3>
              <p className="text-xs text-slate-500">Pilih berkas dari perangkat Anda atau gunakan contoh format resmi</p>
            </div>
          </div>
        </div>

        <DocumentFileSelector
          currentFile={activeDoc}
          onSelectFile={onSelectDoc}
          isLoading={isLoadingPdf}
          compact={false}
        />
      </div>

      {/* Notification Banner if QR was Auto-Mounted or Transferred from Generator */}
      {initialQrDataUrl && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-bold">Kode QR Hyperlink Berhasil Dipasang Otomatis!</p>
              <p className="text-[11px] text-emerald-800 truncate">
                Tautan: {tteConfig.verificationUrl}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            Stempel Terintegrasi
          </span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Placement & Page Preview */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-col items-center">
            {/* Page navigation header */}
            <div className="w-full flex items-center justify-between text-slate-300 text-xs mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Lembar Dokumen PDF:</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded-md text-blue-400 font-mono text-xs">
                  Hal {selectedPage} dari {pdfPageCount}
                </span>
              </div>

              {pdfPageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={selectedPage <= 1}
                    onClick={() => setSelectedPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={selectedPage >= pdfPageCount}
                    onClick={() => setSelectedPage((p) => Math.min(pdfPageCount, p + 1))}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Simulated Interactive Document Page Stage (Aspect ratio ~ A4) */}
            <div
              ref={pagePreviewRef}
              id="pdf-interactive-canvas-page"
              className="relative w-full max-w-[420px] aspect-[1/1.414] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-300 select-none"
            >
              {/* Document background imitation */}
              <div className="p-6 h-full flex flex-col justify-between text-slate-800 pointer-events-none opacity-85">
                <div>
                  <div className="text-center pb-3 border-b-2 border-slate-800">
                    <p className="text-[9px] font-extrabold tracking-wider uppercase text-slate-900">
                      Pemerintah Republik Indonesia
                    </p>
                    <p className="text-[7.5px] font-bold text-slate-700">
                      Badan Pengembangan Teknologi & Informasi
                    </p>
                    <p className="text-[6px] text-slate-500">
                      Dokumen Sah Administrasi Elektronik • Layanan Mandiri
                    </p>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-[8px] font-bold text-slate-900 uppercase truncate">
                      {activeDoc ? activeDoc.name.replace('.pdf', '') : 'Dokumen Pengesahan Resmi'}
                    </p>
                    <p className="text-[6.5px] text-slate-500 font-mono">
                      Nomor: {tteConfig.docNumber}
                    </p>
                  </div>

                  {/* Body paragraph imitation lines */}
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="h-2 bg-slate-200 rounded-sm w-full" />
                    <div className="h-2 bg-slate-200 rounded-sm w-11/12" />
                    <div className="h-2 bg-slate-200 rounded-sm w-4/5" />
                    <div className="h-2 bg-slate-200 rounded-sm w-full" />
                    <div className="h-2 bg-slate-200 rounded-sm w-3/4" />
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <div className="h-2 bg-slate-100 rounded-sm w-full" />
                    <div className="h-2 bg-slate-100 rounded-sm w-5/6" />
                    <div className="h-2 bg-slate-100 rounded-sm w-full" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[6px] text-slate-400">
                  <span>Halaman {selectedPage} dari {pdfPageCount}</span>
                  <span>Sistem Otomasi TTE Terverifikasi</span>
                </div>
              </div>

              {/* Draggable TTE Stamp Placement Box */}
              <div
                id="interactive-tte-placement-box"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                style={{
                  left: `${placement.xPercent}%`,
                  top: `${placement.yPercent}%`,
                  width: `${placement.widthPercent}%`,
                  height: `${placement.heightPercent}%`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                className={`absolute rounded-lg border-2 bg-white/95 shadow-lg p-1 flex flex-col justify-between overflow-hidden transition-shadow ${
                  tteConfig.stampTheme === 'red'
                    ? 'border-red-600'
                    : tteConfig.stampTheme === 'black'
                    ? 'border-slate-900'
                    : 'border-blue-600'
                } ${
                  isDragging
                    ? tteConfig.stampTheme === 'red'
                      ? 'ring-4 ring-red-400/40 shadow-2xl scale-[1.02]'
                      : tteConfig.stampTheme === 'black'
                      ? 'ring-4 ring-slate-400/40 shadow-2xl scale-[1.02]'
                      : 'ring-4 ring-blue-400/40 shadow-2xl scale-[1.02]'
                    : ''
                }`}
              >
                <div className="flex items-stretch gap-1 h-full w-full pointer-events-none">
                  <div
                    className={`w-1 rounded-xs flex-shrink-0 ${
                      tteConfig.stampTheme === 'red'
                        ? 'bg-red-700'
                        : tteConfig.stampTheme === 'black'
                        ? 'bg-slate-900'
                        : 'bg-blue-900'
                    }`}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div
                      className={`text-[5.5px] font-bold uppercase leading-none truncate ${
                        tteConfig.stampTheme === 'red'
                          ? 'text-red-900'
                          : tteConfig.stampTheme === 'black'
                          ? 'text-slate-900'
                          : 'text-blue-950'
                      }`}
                    >
                      Ditandatangani TTE
                    </div>
                    <div className="text-[7px] font-extrabold text-slate-900 leading-tight truncate">
                      {tteConfig.signerName}
                    </div>
                    <div
                      className={`text-[5px] font-semibold leading-none truncate ${
                        tteConfig.stampTheme === 'red'
                          ? 'text-red-700'
                          : tteConfig.stampTheme === 'black'
                          ? 'text-slate-700'
                          : 'text-blue-700'
                      }`}
                    >
                      {tteConfig.signerTitle}
                    </div>
                    {tteConfig.signatureDataUrl && (
                      <div className="h-3 my-0.5">
                        <img
                          src={tteConfig.signatureDataUrl}
                          alt="Goresan"
                          className="h-full object-contain mix-blend-multiply"
                        />
                      </div>
                    )}
                    <div className="text-[4.5px] text-emerald-700 font-bold leading-none">
                      ✓ Tersertifikasi Sah
                    </div>
                  </div>

                  {/* QR Box in stamp */}
                  <div
                    className={`w-8 flex-shrink-0 rounded-xs p-0.5 flex flex-col items-center justify-center border ${
                      tteConfig.stampTheme === 'red'
                        ? 'bg-red-50/80 border-red-200 text-red-900'
                        : tteConfig.stampTheme === 'black'
                        ? 'bg-slate-100/80 border-slate-300 text-slate-900'
                        : 'bg-blue-50/80 border-blue-200 text-blue-900'
                    }`}
                  >
                    {tteConfig.qrDataUrl ? (
                      <img
                        src={tteConfig.qrDataUrl}
                        alt="QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <>
                        <span className="text-[8px]">📱</span>
                        <span className="text-[3.5px] font-bold uppercase">QR TTE</span>
                      </>
                    )}
                  </div>
                </div>

                <div
                  className={`absolute top-0.5 right-0.5 text-white rounded-xs p-0.5 opacity-70 hover:opacity-100 ${
                    tteConfig.stampTheme === 'red'
                      ? 'bg-red-600'
                      : tteConfig.stampTheme === 'black'
                      ? 'bg-slate-800'
                      : 'bg-blue-600'
                  }`}
                >
                  <Move className="w-2 h-2" />
                </div>
              </div>
            </div>

            {/* Quick Position Presets */}
            <div className="w-full mt-4 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Move className="w-3 h-3" />
                Geser stempel di atas atau pilih posisi cepat:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetPosition('bottom-right')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                >
                  Kanan Bawah
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetPosition('bottom-left')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                >
                  Kiri Bawah
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetPosition('bottom-center')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                >
                  Tengah Bawah
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetPosition('top-right')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                >
                  Kanan Atas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Signer Credentials & Signing Action */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Signer Details Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Data Penandatangan TTE
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Resmi Tersertifikasi
              </span>
            </div>

            {/* Signature Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Jenis Tanda Tangan:</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'tte_seal', label: 'Stempel TTE', icon: '🛡️' },
                  { id: 'combined', label: 'Kombinasi', icon: '✨' },
                  { id: 'wet_signature', label: 'Goresan Basah', icon: '✍️' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setTteConfig((prev) => ({ ...prev, signatureType: type.id as any }))}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      tteConfig.signatureType === type.id
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stamp Theme Color Selector (Merah, Hitam, Biru) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Warna Tema Stempel TTE:</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'blue', label: 'Biru Resmi', icon: '🔵', badge: 'bg-blue-600' },
                  { id: 'red', label: 'Merah Segel', icon: '🔴', badge: 'bg-red-600' },
                  { id: 'black', label: 'Hitam Formal', icon: '⚫', badge: 'bg-slate-900' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTteConfig((prev) => ({ ...prev, stampTheme: item.id as any }))}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      (tteConfig.stampTheme || 'blue') === item.id
                        ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Nama Pejabat / Penandatangan</label>
                <input
                  type="text"
                  value={tteConfig.signerName}
                  onChange={(e) => setTteConfig({ ...tteConfig, signerName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Jabatan / Posisi</label>
                  <input
                    type="text"
                    value={tteConfig.signerTitle}
                    onChange={(e) => setTteConfig({ ...tteConfig, signerTitle: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">NIP / NIK (Opsional)</label>
                  <input
                    type="text"
                    value={tteConfig.signerId}
                    onChange={(e) => setTteConfig({ ...tteConfig, signerId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Instansi / Perusahaan</label>
                <input
                  type="text"
                  value={tteConfig.institution}
                  onChange={(e) => setTteConfig({ ...tteConfig, institution: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Tautan Verifikasi QR (Hyperlink)</label>
                <input
                  type="text"
                  value={tteConfig.verificationUrl}
                  onChange={(e) => setTteConfig({ ...tteConfig, verificationUrl: e.target.value })}
                  placeholder="https://tte.layanan.go.id/verify"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Wet Signature Pad trigger if combined or wet_signature */}
            {(tteConfig.signatureType === 'wet_signature' || tteConfig.signatureType === 'combined') && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Goresan Tangan Manual:</span>
                  <button
                    type="button"
                    onClick={() => setShowSignaturePadModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    {tteConfig.signatureDataUrl ? 'Ganti Tanda Tangan' : 'Buat Tanda Tangan'}
                  </button>
                </div>

                {tteConfig.signatureDataUrl ? (
                  <div className="h-16 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center">
                    <img
                      src={tteConfig.signatureDataUrl}
                      alt="Tanda Tangan"
                      className="h-full object-contain mix-blend-multiply"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignaturePadModal(true)}
                    className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    <PenTool className="w-4 h-4" />
                    Klik di sini untuk menggambar tanda tangan Anda
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stamp Preview Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Pratinjau Hasil Stempel TTE:
            </span>
            <TTEStampPreview config={tteConfig} />
          </div>

          {/* Execution Button */}
          <button
            type="button"
            id="btn-sign-pdf-document"
            onClick={handleSignDocument}
            disabled={isSigning || !activeDoc}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-md transition-all disabled:opacity-60"
          >
            {isSigning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Membubuhi TTE pada Dokumen PDF...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-blue-200" />
                Bubuhi Tanda Tangan Elektronik (TTE)
              </>
            )}
          </button>

          {/* Success Banner & Download Action */}
          {signedPdfBlobUrl && signedRecord && (
            <div className="bg-emerald-50 border-2 border-emerald-500/80 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">Dokumen Berhasil Ditandatangani!</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    TTE resmi telah disematkan secara permanen pada {signedRecord.fileName} di halaman {signedRecord.signedPage}.
                  </p>
                  <p className="font-mono text-[10px] text-emerald-700 mt-1 break-all">
                    SHA-256 Hash: {signedRecord.docHash.slice(0, 32)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadSignedPdf}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Unduh Dokumen TTE (.pdf)
                </button>

                <a
                  href={signedPdfBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Buka PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Signature Pad */}
      {showSignaturePadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <SignaturePad
              initialSignature={tteConfig.signatureDataUrl}
              onSave={(dataUrl) => {
                setTteConfig((prev) => ({ ...prev, signatureDataUrl: dataUrl }));
                setShowSignaturePadModal(false);
              }}
              onClose={() => setShowSignaturePadModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

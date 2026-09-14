import React, { useState, useEffect } from 'react';
import { Header, AppTab } from './components/Header';
import { TTEEditor } from './components/TTEEditor';
import { BarcodeScanner } from './components/BarcodeScanner';
import { QRGenerator } from './components/QRGenerator';
import { ArchiveView } from './components/ArchiveView';
import { TTEVerificationModal } from './components/TTEVerificationModal';
import { PwaInstallModal } from './components/PwaInstallModal';
import { DocumentFile, AutoMountPlacement, AutoMountStyle } from './types';
import { createSampleDocumentByType } from './lib/pdfHelper';
import { PDFDocument } from 'pdf-lib';
import { ShieldCheck, Check } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('tte');
  const [generatorUrl, setGeneratorUrl] = useState<string>('https://layanan.go.id/dokumen-tte/verifikasi?id=TTE-2026-9812');
  const [tteCustomQrDataUrl, setTteCustomQrDataUrl] = useState<string | undefined>(undefined);
  const [tteCustomQrUrl, setTteCustomQrUrl] = useState<string | undefined>(undefined);
  const [ttePlacementPreset, setTtePlacementPreset] = useState<AutoMountPlacement>('bottom-right');
  const [tteStyle, setTteStyle] = useState<AutoMountStyle>('tte_seal');

  // Unified Document File state across Tabs
  const [activeDoc, setActiveDoc] = useState<DocumentFile | null>(null);

  // Verification modal state
  const [verifyingData, setVerifyingData] = useState<string | null>(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize activeDoc with standard official Indonesian statement template
  useEffect(() => {
    const initDefaultDoc = async () => {
      try {
        const { bytes, name } = await createSampleDocumentByType('statement');
        const loadedDoc = await PDFDocument.load(bytes);
        const pageCount = loadedDoc.getPageCount();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        setActiveDoc({
          name,
          bytes,
          size: bytes.byteLength,
          pageCount,
          blobUrl,
          sourceType: 'sample_statement',
        });
      } catch (err) {
        console.error('Failed to initialize default document:', err);
      }
    };

    initDefaultDoc();
  }, []);

  // Capture PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Bridge: From Barcode Scanner -> QR Generator
  const handleSendToQRGenerator = (url: string) => {
    setGeneratorUrl(url);
    setActiveTab('qr-generator');
    showToast('Tautan dari hasil scan berhasil dimasukkan ke generator QR!');
  };

  // Bridge: From QR Generator -> TTE Document
  const handleApplyQRToTTE = (
    qrDataUrl: string,
    link: string,
    placement?: AutoMountPlacement,
    style?: AutoMountStyle
  ) => {
    setTteCustomQrDataUrl(qrDataUrl);
    setTteCustomQrUrl(link);
    if (placement) setTtePlacementPreset(placement);
    if (style) setTteStyle(style);
    setActiveTab('tte');
    showToast('Kode QR berhasil dipasang otomatis ke lembar dokumen TTE!');
  };

  // Open Verification Modal
  const handleVerifyTTE = (data: string) => {
    setVerifyingData(data);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col text-slate-900 pb-20 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenInstallModal={() => setShowInstallModal(true)}
      />

      {/* Hero Subtitle Banner */}
      <div className="bg-linear-to-b from-blue-50/60 to-transparent border-b border-blue-100/40 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Sistem Sah Tanda Tangan Elektronik (TTE), Pasang Otomatis & Pembuat QR Hyperlink</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span className="hidden sm:inline">Standar UU ITE No. 11/2008</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline" />
            <span>Kriptografi SHA-256</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tersertifikasi
            </span>
          </div>
        </div>
      </div>

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'tte' && (
          <TTEEditor
            initialQrDataUrl={tteCustomQrDataUrl}
            initialQrUrl={tteCustomQrUrl}
            initialPlacementPreset={ttePlacementPreset}
            initialStyle={tteStyle}
            activeDoc={activeDoc}
            onSelectDoc={setActiveDoc}
          />
        )}

        {activeTab === 'scan' && (
          <BarcodeScanner
            onSendToQRGenerator={handleSendToQRGenerator}
            onVerifyTTE={handleVerifyTTE}
          />
        )}

        {activeTab === 'qr-generator' && (
          <QRGenerator
            initialUrl={generatorUrl}
            activeDoc={activeDoc}
            onSelectDoc={setActiveDoc}
            onApplyToTTE={handleApplyQRToTTE}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveView onVerifyDoc={handleVerifyTTE} />
        )}
      </main>

      {/* Verification Modal */}
      {verifyingData && (
        <TTEVerificationModal
          data={verifyingData}
          onClose={() => setVerifyingData(null)}
        />
      )}

      {/* PWA / APK Install Modal */}
      {showInstallModal && (
        <PwaInstallModal
          deferredPrompt={deferredPrompt}
          onClose={() => setShowInstallModal(false)}
        />
      )}
    </div>
  );
}

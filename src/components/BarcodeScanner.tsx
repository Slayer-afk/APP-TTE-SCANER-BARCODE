import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  Upload,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  ShieldCheck,
  QrCode,
  AlertCircle,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ScanResultItem } from '../types';

interface BarcodeScannerProps {
  onScanResult?: (result: ScanResultItem) => void;
  onSendToQRGenerator?: (url: string) => void;
  onVerifyTTE?: (data: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanResult,
  onSendToQRGenerator,
  onVerifyTTE,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastResult, setLastResult] = useState<ScanResultItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanHistory, setScanHistory] = useState<ScanResultItem[]>(() => {
    try {
      const saved = localStorage.getItem('tte_scanner_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'barcode-camera-viewport';

  // Sound feedback using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted
    }
  };

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80);
      } catch {
        // Ignore
      }
    }
  };

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    playBeep();
    triggerHaptic();

    const isUrl = /^(https?:\/\/|www\.)[^\s]+$/i.test(decodedText.trim());
    const isTTE =
      decodedText.includes('tte') ||
      decodedText.includes('verify') ||
      decodedText.includes('TTE') ||
      decodedText.includes('verifikasi');

    const resultItem: ScanResultItem = {
      id: Date.now().toString(),
      text: decodedText,
      formatName: decodedResult?.result?.format?.formatName || 'Barcode/QR Code',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isUrl,
      isTTE,
    };

    setLastResult(resultItem);
    setScanHistory((prev) => {
      const updated = [resultItem, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('tte_scanner_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (onScanResult) onScanResult(resultItem);
  };

  // Start Camera Scanner
  const startCameraScanner = async () => {
    setErrorMessage('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }

      // Check if already running
      if (scannerRef.current.isScanning) {
        return;
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minDim * 0.72),
              height: Math.floor(minDim * 0.72),
            };
          },
          aspectRatio: 1.0,
        },
        handleScanSuccess,
        () => {
          // ignore frame errors while scanning
        }
      );

      setIsScanning(true);
      setHasCameraPermission(true);
    } catch (err: any) {
      console.warn('Camera scanner start warning:', err);
      setIsScanning(false);
      setHasCameraPermission(false);
      setErrorMessage(
        err?.message ||
          'Tidak dapat mengakses kamera. Pastikan izin kamera aktif atau gunakan fitur unggah gambar barcode.'
      );
    }
  };

  // Stop Camera Scanner
  const stopCameraScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [activeTab]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Scan from File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    try {
      let fileScanner = scannerRef.current;
      if (!fileScanner) {
        fileScanner = new Html5Qrcode(readerElementId);
        scannerRef.current = fileScanner;
      }

      const decodedText = await fileScanner.scanFile(file, true);
      handleScanSuccess(decodedText, { result: { format: { formatName: 'Barcode Gambar' } } });
    } catch (err: any) {
      console.error('File scan error:', err);
      setErrorMessage('Barcode atau Kode QR tidak terdeteksi pada gambar ini. Pastikan gambar jelas dan tidak buram.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="barcode-scanner-card" className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Scanner Mode Toggle */}
      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="flex gap-1">
          <button
            type="button"
            id="tab-scanner-camera"
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            Pindai Kamera Langsung
          </button>
          <button
            type="button"
            id="tab-scanner-file"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'file'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            Unggah Berkas Gambar
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
          title={soundEnabled ? 'Suara Pemindaian Aktif' : 'Suara Pemindaian Senyap'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Viewport Container */}
      <div className="bg-slate-900 rounded-3xl p-4 shadow-md text-white overflow-hidden relative border border-slate-800">
        {activeTab === 'camera' ? (
          <div>
            <div className="relative w-full aspect-square max-h-[380px] bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              {/* HTML5 QR Code Mount point */}
              <div id={readerElementId} className="w-full h-full object-cover [&_video]:rounded-2xl [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

              {/* Scanning Crosshair Overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                  <div className="w-56 h-56 border-2 border-blue-400/80 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl -mb-1 -mr-1" />
                    {/* Animated scanning line */}
                    <div className="w-full h-0.5 bg-linear-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#60a5fa] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="mt-4 text-xs font-medium text-slate-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Arahkan kamera ke Barcode / QR Code TTE
                  </span>
                </div>
              )}

              {/* Permission / Error State */}
              {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
                  <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">Akses Kamera Diperlukan</p>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={startCameraScanner}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Coba Akses Kamera Lagi
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 px-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                {isScanning ? 'Kamera aktif memindai' : 'Mempersiapkan sensor kamera...'}
              </span>
              <button
                type="button"
                onClick={() => {
                  stopCameraScanner();
                  setTimeout(startCameraScanner, 200);
                }}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Kamera
              </button>
            </div>
          </div>
        ) : (
          /* File Upload Mode */
          <div className="p-4 flex flex-col items-center justify-center">
            <label
              htmlFor="barcode-file-input"
              className="w-full h-56 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Pilih atau Seret Foto Barcode/QR</p>
                <p className="text-xs text-slate-400 mt-1">Mendukung format PNG, JPG, WEBP dari galeri atau kamera</p>
              </div>
              <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-xl">
                Buka File Gambar
              </span>
              <input
                id="barcode-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-800/50">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Latest Scanned Result */}
      {lastResult && (
        <div
          id="scanner-latest-result-card"
          className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm flex flex-col gap-3 transition-all animate-in fade-in duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Hasil Pindai Berhasil</h4>
                <p className="text-[11px] text-slate-500">Format: {lastResult.formatName} • {lastResult.timestamp}</p>
              </div>
            </div>

            {lastResult.isTTE && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                Kode TTE Terdeteksi
              </span>
            )}
          </div>

          {/* Decoded Content */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 font-mono text-xs break-all select-all">
            {lastResult.text}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => copyToClipboard(lastResult.text)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Teks'}
            </button>

            {lastResult.isUrl && (
              <a
                href={lastResult.text.startsWith('http') ? lastResult.text : `https://${lastResult.text}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Tautan (Link)
              </a>
            )}

            {onSendToQRGenerator && (
              <button
                type="button"
                onClick={() => onSendToQRGenerator(lastResult.text)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors border border-indigo-200"
              >
                <QrCode className="w-3.5 h-3.5" />
                {lastResult.isUrl ? 'Bikin QR dari Link Ini' : 'Buka di Pembuat QR / Barcode & Pasang'}
              </button>
            )}

            {lastResult.isTTE && onVerifyTTE && (
              <button
                type="button"
                onClick={() => onVerifyTTE(lastResult.text)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verifikasi Dokumen TTE
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scan History Section */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Riwayat Pemindaian Terakhir</h4>
            <button
              type="button"
              onClick={() => {
                setScanHistory([]);
                localStorage.removeItem('tte_scanner_history');
              }}
              className="text-[11px] text-slate-400 hover:text-red-600 transition-colors"
            >
              Hapus Riwayat
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {scanHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs transition-colors border border-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-slate-800 truncate text-[11px]">{item.text}</p>
                  <p className="text-[10px] text-slate-400">{item.timestamp} • {item.formatName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.text)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
                  title="Salin"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Check,
  FileCheck2,
  FolderOpen,
  ArrowRight,
  PlusCircle,
  FilePlus,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { DocumentFile, SampleDocType } from '../types';
import { createSampleDocumentByType, appendEndorsementPageToPdf } from '../lib/pdfHelper';
import { AutoDocumentModal } from './AutoDocumentModal';

interface DocumentFileSelectorProps {
  currentFile: DocumentFile | null;
  onSelectFile: (file: DocumentFile) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const DocumentFileSelector: React.FC<DocumentFileSelectorProps> = ({
  currentFile,
  onSelectFile,
  isLoading = false,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showAutoDocModal, setShowAutoDocModal] = useState<boolean>(false);
  const [isAppendingPage, setIsAppendingPage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleTemplates: Array<{
    id: SampleDocType;
    label: string;
    desc: string;
    icon: string;
  }> = [
    {
      id: 'statement',
      label: 'Surat Pernyataan Resmi',
      desc: 'Format ketetapan administrasi & layanan publik standar UU ITE',
      icon: '📄',
    },
    {
      id: 'bast',
      label: 'Berita Acara (BAST)',
      desc: 'Serah terima pekerjaan pengadaan & sistem teknologi informasi',
      icon: '📋',
    },
    {
      id: 'sk',
      label: 'Surat Keputusan (SK)',
      desc: 'Ketetapan resmi pimpinan instansi untuk pengesahan otoritas',
      icon: '📑',
    },
    {
      id: 'assignment',
      label: 'Surat Tugas Dinas (SPT)',
      desc: 'Perintah tugas kedinasan dan audit sistem verifikasi dokumen',
      icon: '📌',
    },
    {
      id: 'memo',
      label: 'Nota Dinas Resmi',
      desc: 'Penyampaian status berkas dan pengesahan internal instansi',
      icon: '✉️',
    },
    {
      id: 'certificate',
      label: 'Sertifikat Digital',
      desc: 'Piagam kelayakan, kompetensi, & verifikasi legalitas dokumen',
      icon: '📜',
    },
  ];

  const handleNativeFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Mohon pilih file berformat PDF (.pdf).');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const loadedDoc = await PDFDocument.load(bytes);
      const pageCount = loadedDoc.getPageCount();

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      onSelectFile({
        name: file.name,
        bytes,
        size: file.size,
        pageCount,
        blobUrl,
        sourceType: 'uploaded',
      });
    } catch (err) {
      console.error('Error reading PDF file:', err);
      alert('Gagal memproses file PDF. Pastikan file tidak rusak atau terenkripsi password.');
    }
  };

  const handleAppendNewPage = async () => {
    if (!currentFile) return;
    setIsAppendingPage(true);
    try {
      const newBytes = await appendEndorsementPageToPdf(currentFile.bytes);
      const loadedDoc = await PDFDocument.load(newBytes);
      const pageCount = loadedDoc.getPageCount();

      const blob = new Blob([newBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      onSelectFile({
        ...currentFile,
        bytes: newBytes,
        size: newBytes.byteLength,
        pageCount,
        blobUrl,
      });
    } catch (err) {
      console.error('Error appending page:', err);
      alert('Gagal menambahkan halaman baru ke dokumen.');
    } finally {
      setIsAppendingPage(false);
    }
  };

  const handleSelectSample = async (type: SampleDocType) => {
    try {
      const { bytes, name } = await createSampleDocumentByType(type);
      const loadedDoc = await PDFDocument.load(bytes);
      const pageCount = loadedDoc.getPageCount();

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      onSelectFile({
        name,
        bytes,
        size: bytes.byteLength,
        pageCount,
        blobUrl,
        sourceType: `sample_${type}` as any,
      });
      setShowTemplateModal(false);
    } catch (err) {
      console.error('Error generating sample template:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleNativeFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleNativeFileUpload(file);
        }}
      />

      {/* Selected File Card */}
      {currentFile && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[220px] sm:max-w-xs">
                  {currentFile.name}
                </p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                  {currentFile.sourceType === 'uploaded' ? 'File Anda' : 'Contoh Resmi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                <span>{currentFile.pageCount} Lembar Halaman</span>
                <span>•</span>
                <span>{formatFileSize(currentFile.size)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAutoDocModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ Buat Dokumen Otomatis
            </button>

            <button
              type="button"
              onClick={handleAppendNewPage}
              disabled={isAppendingPage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
              title="Tambahkan halaman pengesahan baru ke dokumen ini"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
              {isAppendingPage ? 'Menambah...' : '➕ Tambah Halaman'}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold transition-all shadow-2xs"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Pilih PDF Lain
            </button>

            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              Contoh Resmi
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone (Full or Compact) */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Pilih File Dokumen PDF dari HP / Komputer
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Klik untuk jelajah atau tarik & lepas (drag & drop) berkas PDF Anda
              </p>
            </div>
          </div>

          {/* Quick Auto-Add Document Card */}
          <div
            onClick={() => setShowAutoDocModal(true)}
            className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-900 group-hover:text-blue-700">
                ⚡ Buat & Tambahkan Dokumen Otomatis
              </p>
              <p className="text-[11px] text-blue-600/80 mt-0.5">
                Buat Surat Pernyataan, BAST, SK, SPT berstempel barcode resmi secara instan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Template Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setShowAutoDocModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold whitespace-nowrap shadow-xs hover:bg-blue-700 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          <span>⚡ Buat Otomatis</span>
        </button>
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Template:</span>
        {sampleTemplates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => handleSelectSample(tpl.id)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 text-[11px] font-medium whitespace-nowrap transition-colors"
          >
            <span>{tpl.icon}</span>
            <span>{tpl.label}</span>
          </button>
        ))}
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Pilih Contoh Dokumen Resmi</h4>
                  <p className="text-xs text-slate-500">Format surat & berkas administrasi siap pakai</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {sampleTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectSample(tpl.id)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between gap-3 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tpl.icon}</span>
                    <div>
                      <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-blue-700">
                        {tpl.label}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {tpl.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Document Generator Modal */}
      <AutoDocumentModal
        isOpen={showAutoDocModal}
        onClose={() => setShowAutoDocModal(false)}
        onDocumentCreated={(file) => {
          onSelectFile(file);
          setShowAutoDocModal(false);
        }}
      />
    </div>
  );
};

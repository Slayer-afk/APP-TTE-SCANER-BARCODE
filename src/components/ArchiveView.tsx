import React, { useState, useEffect } from 'react';
import {
  FolderClock,
  Download,
  Trash2,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Hash,
  Search,
} from 'lucide-react';
import { TTEDocumentRecord } from '../types';

interface ArchiveViewProps {
  onVerifyDoc: (url: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onVerifyDoc }) => {
  const [records, setRecords] = useState<TTEDocumentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadRecords = () => {
    try {
      const saved = localStorage.getItem('tte_signed_history');
      if (saved) {
        setRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    try {
      localStorage.setItem('tte_signed_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat dokumen TTE yang tersimpan?')) {
      setRecords([]);
      localStorage.removeItem('tte_signed_history');
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.signerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.docHash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="tte-archive-view" className="max-w-5xl mx-auto flex flex-col gap-5">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <FolderClock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Arsip Dokumen TTE Tersimpan</h3>
            <p className="text-xs text-slate-500">
              Daftar dokumen elektronik yang telah dibubuhi tanda tangan digital dan QR verifikasi
            </p>
          </div>
        </div>

        {records.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bersihkan Riwayat
          </button>
        )}
      </div>

      {/* Search Filter */}
      {records.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama dokumen, nama penandatangan, atau kode hash..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>
      )}

      {/* Records List or Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <FolderClock className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Belum Ada Dokumen TTE Tersimpan</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Tanda tangani dokumen PDF pada tab <strong>Dokumen TTE</strong> untuk menyimpan salinan sah dokumen di arsip lokal ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{item.fileName}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteRecord(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Hapus dari riwayat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Meta Info */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col gap-1 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Penandatangan:</span>
                  <span className="font-bold text-slate-800">{item.signerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Waktu TTE:</span>
                  <span className="font-mono text-[10px] text-slate-500">{item.signedAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Lokasi Stempel:</span>
                  <span className="text-blue-700 font-semibold">Hal {item.signedPage} dari {item.pageCount}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono text-[9px] text-slate-400">
                  <span>SHA-256:</span>
                  <span className="truncate max-w-[170px]">{item.docHash}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {item.downloadUrl && (
                  <a
                    href={item.downloadUrl}
                    download={item.fileName}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onVerifyDoc(item.verificationUrl || item.docHash)}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cek Keaslian
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

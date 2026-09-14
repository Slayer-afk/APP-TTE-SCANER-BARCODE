import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  X,
  RefreshCw,
  Building2,
  UserCheck,
  Barcode as BarcodeIcon,
  Calendar,
  MapPin,
  Check,
  Layers,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { DocumentFile, AutoDocConfig, BarcodeType } from '../types';
import { createCustomAutoDocument } from '../lib/pdfHelper';
import { generateAutoBarcodeNumber } from '../lib/barcodeHelper';

interface AutoDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (file: DocumentFile) => void;
}

export const AutoDocumentModal: React.FC<AutoDocumentModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated,
}) => {
  const [docType, setDocType] = useState<AutoDocConfig['docType']>('statement');
  const [title, setTitle] = useState<string>('SURAT PERNYATAAN PENGESAHAN DOKUMEN ELEKTRONIK');
  const [docNumber, setDocNumber] = useState<string>(
    `SP-TTE/BPTI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [institution, setInstitution] = useState<string>(
    'BADAN PENGEMBANGAN TEKNOLOGI & INFORMASI'
  );
  const [signerName, setSignerName] = useState<string>('Ir. H. Pratama Wijaya, M.Kom');
  const [signerTitle, setSignerTitle] = useState<string>(
    'Kepala Balai Sertifikasi & Verifikasi Digital'
  );
  const [signerId, setSignerId] = useState<string>('19840214 200801 1 003');
  const [location, setLocation] = useState<string>('Jakarta');
  const [date, setDate] = useState<string>(
    new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })
  );
  const [summary, setSummary] = useState<string>(
    'Verifikasi keabsahan dokumen administrasi kedinasan dengan enkripsi kriptografi SHA-256 dan kode barcode/QR terintegrasi.'
  );

  // Barcode options
  const [includeAutoBarcode, setIncludeAutoBarcode] = useState<boolean>(true);
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('code128');
  const [barcodeValue, setBarcodeValue] = useState<string>(generateAutoBarcodeNumber('doc'));

  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  // Preset switch handler
  const handleSelectPreset = (type: AutoDocConfig['docType']) => {
    setDocType(type);
    const yr = new Date().getFullYear();
    const rnd = Math.floor(1000 + Math.random() * 9000);

    switch (type) {
      case 'bast':
        setTitle('BERITA ACARA SERAH TERIMA PEKERJAAN (BAST)');
        setDocNumber(`BAST/TIK/${yr}/${rnd}`);
        setInstitution('DIREKTORAT JENDERAL APLIKASI INFORMATIKA');
        setSignerTitle('Pejabat Pembuat Komitmen (PPK)');
        setSummary('Pekerjaan serah terima sistem digitalisasi dokumen TTE dan modul barcode dinyatakan selesai dan teruji.');
        break;
      case 'sk':
        setTitle('SURAT KEPUTUSAN KEPALA BADAN STANDARDISASI');
        setDocNumber(`SK-TTE/${yr}/${rnd}/KPTS`);
        setInstitution('BADAN STANDARDISASI DIGITAL NASIONAL');
        setSignerTitle('Kepala Badan Standardisasi');
        setSummary('Penetapan standar penerapan tanda tangan elektronik dan pemindai barcode pada tata kelola persuratan.');
        break;
      case 'assignment':
        setTitle('SURAT PERINTAH TUGAS DINAS (SPT)');
        setDocNumber(`SPT/TIK/${yr}/${rnd}`);
        setInstitution('BADAN PENGELOLA SISTEM ELEKTRONIK');
        setSignerTitle('Kepala Biro Kepegawaian & Tata Usaha');
        setSummary('Penugasan tim verifikator untuk audit integritas berkas digital dan pemasangan barcode pelacak.');
        break;
      case 'memo':
        setTitle('NOTA DINAS PENGESAHAN DOKUMEN INTERNAL');
        setDocNumber(`ND-TTE/${yr}/${rnd}`);
        setInstitution('SEKRETARIAT UTAMA PENGESAHAN DIGITAL');
        setSignerTitle('Kepala Bagian Tata Usaha');
        setSummary('Penyampaian status berkas administrasi yang telah dibubuhi kode barcode dan stempel verifikasi TTE.');
        break;
      case 'certificate':
        setTitle('SERTIFIKAT PENGESAHAN DOKUMEN DIGITAL');
        setDocNumber(`CERT-DIGITAL/ID/${yr}/${rnd}`);
        setInstitution('LEMBAGA SERTIFIKASI PROFESI & VERIFIKASI');
        setSignerTitle('Direktur Sertifikasi Elektronik');
        setSummary('Pernyataan resmi bahwa sistem dan berkas telah memenuhi standar keamanan dan integritas tinggi.');
        break;
      case 'statement':
      default:
        setTitle('SURAT PERNYATAAN PENGESAHAN DOKUMEN ELEKTRONIK');
        setDocNumber(`SP-TTE/BPTI/${yr}/${rnd}`);
        setInstitution('BADAN PENGEMBANGAN TEKNOLOGI & INFORMASI');
        setSignerTitle('Kepala Balai Sertifikasi & Verifikasi Digital');
        setSummary('Verifikasi keabsahan dokumen administrasi kedinasan dengan enkripsi kriptografi SHA-256 dan kode barcode/QR terintegrasi.');
        break;
    }
  };

  const handleRandomizeNumber = () => {
    const yr = new Date().getFullYear();
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const prefix = docType.toUpperCase();
    setDocNumber(`${prefix}-TTE/${yr}/${rnd}`);
  };

  const handleRandomizeBarcode = () => {
    setBarcodeValue(generateAutoBarcodeNumber('doc'));
  };

  const handleCreateDocument = async () => {
    setIsGenerating(true);
    try {
      const config: AutoDocConfig = {
        docType,
        title,
        docNumber,
        institution,
        signerName,
        signerTitle,
        signerId,
        location,
        date,
        summary,
        includeAutoBarcode,
        barcodeType,
        barcodeValue,
      };

      const { bytes, name } = await createCustomAutoDocument(config);
      const loadedDoc = await PDFDocument.load(bytes);
      const pageCount = loadedDoc.getPageCount();

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);

      onDocumentCreated({
        name,
        bytes,
        size: bytes.byteLength,
        pageCount,
        blobUrl,
        sourceType: 'auto_generated',
      });

      onClose();
    } catch (err) {
      console.error('Failed to create auto document:', err);
      alert('Terjadi kesalahan saat menyusun dokumen otomatis. Silakan coba kembali.');
    } finally {
      setIsGenerating(false);
    }
  };

  const presetsList: Array<{ id: AutoDocConfig['docType']; label: string; icon: string }> = [
    { id: 'statement', label: 'Surat Pernyataan', icon: '📄' },
    { id: 'bast', label: 'Berita Acara (BAST)', icon: '📋' },
    { id: 'sk', label: 'Surat Keputusan (SK)', icon: '📑' },
    { id: 'assignment', label: 'Surat Tugas (SPT)', icon: '📌' },
    { id: 'memo', label: 'Nota Dinas', icon: '✉️' },
    { id: 'certificate', label: 'Sertifikat Digital', icon: '📜' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Buat & Tambahkan Dokumen Otomatis
              </h3>
              <p className="text-xs text-slate-500">
                Pilih format resmi atau sesuaikan isinya dalam 1 klik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-slate-800 text-xs sm:text-sm">
          {/* Preset Buttons */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Pilih Jenis Dokumen Resmi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presetsList.map((p) => {
                const isSelected = docType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-bold shadow-xs ring-2 ring-blue-100'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="truncate text-xs">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields: Two Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Judul Dokumen */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Judul Dokumen
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white transition-colors"
              />
            </div>

            {/* Nomor Dokumen */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Nomor Dokumen</label>
                <button
                  type="button"
                  onClick={handleRandomizeNumber}
                  className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Acak Nomor
                </button>
              </div>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs font-mono focus:outline-none focus:bg-white"
              />
            </div>

            {/* Nama Instansi */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Instansi / Lembaga
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>

            {/* Pejabat Penandatangan */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Nama Penandatangan
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>

            {/* Jabatan & NIP */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700">Jabatan & NIP</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  placeholder="Jabatan"
                  className="w-2/3 px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs focus:outline-none focus:bg-white"
                />
                <input
                  type="text"
                  value={signerId}
                  onChange={(e) => setSignerId(e.target.value)}
                  placeholder="NIP"
                  className="w-1/3 px-2 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-[11px] font-mono focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Kota & Tanggal */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Kota Ditetapkan
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Tanggal Terbit
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>

            {/* Ringkasan Isi Surat */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700">
                Uraian / Ringkasan Isi Dokumen
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs focus:outline-none focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Barcode Otomatis Box */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <BarcodeIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Otomatis Pasang Barcode Pelacak di Dokumen
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Mencetak barcode garis 1D pada bagian atas kop surat secara otomatis
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAutoBarcode}
                  onChange={(e) => setIncludeAutoBarcode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {includeAutoBarcode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600">Nilai Kode Barcode</span>
                    <button
                      type="button"
                      onClick={handleRandomizeBarcode}
                      className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Acak Barcode
                    </button>
                  </div>
                  <input
                    type="text"
                    value={barcodeValue}
                    onChange={(e) => setBarcodeValue(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-600">Format Barcode</span>
                  <select
                    value={barcodeType}
                    onChange={(e) => setBarcodeType(e.target.value as BarcodeType)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="code128">Code 128 (Huruf & Angka Universal)</option>
                    <option value="code39">Code 39 (Standar Kedinasan)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleCreateDocument}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyusun Dokumen PDF...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Terbitkan & Tambahkan Dokumen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

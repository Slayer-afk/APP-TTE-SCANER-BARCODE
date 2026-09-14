import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateQRDataUrl } from './qrHelper';
import {
  TTEConfig,
  SignaturePlacement,
  SampleDocType,
  AutoMountPlacement,
  AutoMountStyle,
  AutoDocConfig,
} from '../types';
import { generateBarcodeDataUrl } from './barcodeHelper';

/**
 * Calculates SHA-256 hash of an ArrayBuffer or Uint8Array
 */
export async function calculateDocHash(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an official Indonesian business/government sample document PDF
 */
export async function createSampleDocument(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (pt)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Header / Kop Dokumen
  page.drawText('PEMERINTAH REPUBLIK INDONESIA', {
    x: width / 2 - 130,
    y: height - 55,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText('BADAN PENGEMBANGAN TEKNOLOGI & INFORMASI', {
    x: width / 2 - 170,
    y: height - 73,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });

  page.drawText('Jl. Medan Merdeka Barat No. 8, Jakarta Pusat 10110 | www.tte.id | info@layanan.go.id', {
    x: width / 2 - 195,
    y: height - 88,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Divider line
  page.drawLine({
    start: { x: 50, y: height - 98 },
    end: { x: width - 50, y: height - 98 },
    thickness: 2,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawLine({
    start: { x: 50, y: height - 101 },
    end: { x: width - 50, y: height - 101 },
    thickness: 0.75,
    color: rgb(0.1, 0.15, 0.25),
  });

  // Judul Dokumen
  page.drawText('SURAT PERNYATAAN PENGESAHAN DOKUMEN ELEKTRONIK', {
    x: width / 2 - 180,
    y: height - 135,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  const docNo = `Nomor: SP-TTE/BPTI/${new Date().getFullYear()}/0891`;
  page.drawText(docNo, {
    x: width / 2 - 70,
    y: height - 150,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Content body
  const bodyText = [
    'Yang bertanda tangan di bawah ini menerangkan bahwa dokumen elektronik ini telah diverifikasi',
    'dan disetujui sesuai dengan ketentuan Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan',
    'Transaksi Elektronik (UU ITE) serta peraturan pelaksanaannya mengenai Tanda Tangan Elektronik.',
    '',
    'Dokumen ini memiliki kekuatan hukum yang sah dan kekuatan pembuktian yang mengikat sejak',
    'dibubuhi Tanda Tangan Elektronik (TTE) Tersertifikasi yang memuat kode QR verifikasi resmi.',
    '',
    'Rincian Verifikasi Berkas:',
    '1. Jenis Berkas     : Dokumen Ketetapan Administrasi & Layanan Publik',
    '2. Status Hak Cipta : Resmi (Pemerintah / Instansi Pengesah)',
    '3. Keaslian Data    : Terjamin dengan Hash Kriptografi SHA-256',
    '4. Integritas Data  : Terproteksi dari perubahan fisik maupun digital tanpa otorisasi',
    '',
    'Demikian surat pernyataan pengesahan ini dibuat dengan sebenarnya untuk dipergunakan',
    'sebagaimana mestinya sesuai ketentuan perundang-undangan yang berlaku.',
  ];

  let currentY = height - 195;
  for (const line of bodyText) {
    page.drawText(line, {
      x: 55,
      y: currentY,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
      lineHeight: 14,
    });
    currentY -= 17;
  }

  // Footer area notice
  page.drawText('Diterbitkan di: Jakarta', {
    x: width - 230,
    y: 270,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });

  page.drawText('Pejabat Penandatangan:', {
    x: width - 230,
    y: 255,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.25),
  });

  // Bottom Notice
  page.drawText('Catatan: Dokumen ini telah ditandatangani secara elektronik (TTE). Verifikasi keaslian dapat dipindai melalui Barcode/QR Code.', {
    x: 50,
    y: 40,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  return await pdfDoc.save();
}

/**
 * Generates Berita Acara Serah Terima (BAST) Sample Document
 */
export async function createSampleBASTDocument(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  // Header Kop
  page.drawText('KEMENTERIAN KOMUNIKASI DAN INFORMATIKA', {
    x: width / 2 - 160,
    y: height - 55,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawText('DIREKTORAT JENDERAL APLIKASI INFORMATIKA', {
    x: width / 2 - 150,
    y: height - 72,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawLine({
    start: { x: 50, y: height - 85 },
    end: { x: width - 50, y: height - 85 },
    thickness: 1.5,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText('BERITA ACARA SERAH TERIMA PEKERJAAN (BAST)', {
    x: width / 2 - 165,
    y: height - 120,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawText(`Nomor: BAST/TIK/${new Date().getFullYear()}/0421`, {
    x: width / 2 - 75,
    y: height - 138,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  const body = [
    'Pada hari ini, telah dilakukan serah terima hasil pekerjaan integrasi sistem verifikasi',
    'dokumen elektronik dan modul pemindaian barcode/QR code resmi dengan rincian:',
    '',
    '1. PIHAK KESATU telah menyelesaikan seluruh lingkup implementasi sistem sesuai standar.',
    '2. PIHAK KEDUA telah melakukan pengujian menyeluruh dan menyatakan hasil pekerjaan diterima.',
    '3. Seluruh berkas digital telah diamankan menggunakan tanda tangan elektronik tersertifikasi.',
    '',
    'Demikian Berita Acara ini dibuat dalam rangkap yang memiliki kekuatan hukum yang sama.'
  ];

  let y = height - 180;
  for (const line of body) {
    page.drawText(line, { x: 55, y, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
    y -= 18;
  }

  page.drawText('PIHAK KESATU (Penyedia)', { x: 60, y: 260, size: 9, font: fontBold, color: rgb(0.15, 0.2, 0.25) });
  page.drawText('PIHAK KEDUA (Pejabat Pembuat Komitmen)', { x: width - 240, y: 260, size: 9, font: fontBold, color: rgb(0.15, 0.2, 0.25) });

  page.drawText('Dokumen BAST elektronik sah berdasar verifikasi kriptografi QR Code.', {
    x: 50,
    y: 40,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  return await pdfDoc.save();
}

/**
 * Generates Sertifikat Pengesahan Digital Sample Document
 */
export async function createSampleCertificateDocument(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  // Decorative border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(0.12, 0.23, 0.54),
    borderWidth: 3,
  });
  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: rgb(0.7, 0.6, 0.3),
    borderWidth: 1,
  });

  page.drawText('LEMBAGA SERTIFIKASI PROFESI & VERIFIKASI DIGITAL', {
    x: width / 2 - 170,
    y: height - 90,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.23, 0.54),
  });

  page.drawText('SERTIFIKAT PENGESAHAN DOKUMEN ELEKTRONIK', {
    x: width / 2 - 185,
    y: height - 145,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText(`Nomor Sertifikat: CERT-DIGITAL/ID/${new Date().getFullYear()}/7729`, {
    x: width / 2 - 110,
    y: height - 165,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  const lines = [
    'Dengan ini menyatakan secara resmi dan sah bahwa:',
    '',
    'Nama Dokumen / Pemegang : SISTEM TANDA TANGAN ELEKTRONIK & QR',
    'Status Kelayakan       : MEMENUHI STANDAR KEAMANAN & INTEGRITAS TINGGI',
    'Metode Verifikasi      : Barcode & QR Code Hyperlink 2 Dimensi',
    '',
    'Telah melalui proses uji verifikasi dan terdaftar pada pangkalan data otoritas sertifikasi.',
    'Sertifikat ini sah dan berlaku selama kode QR verifikasi dapat dibaca dan tervalidasi.'
  ];

  let y = height - 220;
  for (const line of lines) {
    page.drawText(line, { x: 65, y, size: 10, font: line.startsWith('Nama') || line.startsWith('Status') ? fontBold : fontRegular, color: rgb(0.15, 0.2, 0.25) });
    y -= 20;
  }

  page.drawText('Ditetapkan di Jakarta, Disahkan oleh:', { x: width - 230, y: 260, size: 9, font: fontRegular, color: rgb(0.3, 0.35, 0.4) });

  return await pdfDoc.save();
}

/**
 * Generates Surat Keputusan (SK) Sample Document
 */
export async function createSampleSKDocument(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  // Garuda / Seal text
  page.drawText('KEPUTUSAN KEPALA BADAN STANDARDISASI DIGITAL', {
    x: width / 2 - 165,
    y: height - 60,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawText(`NOMOR: SK-TTE.${new Date().getFullYear()}/0082/KPTS`, {
    x: width / 2 - 95,
    y: height - 80,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
  });

  page.drawText('TENTANG', { x: width / 2 - 25, y: height - 110, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.25) });
  page.drawText('PENERAPAN TANDA TANGAN ELEKTRONIK DAN PEMINDAI BARCODE', {
    x: width / 2 - 180,
    y: height - 130,
    size: 10.5,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  const skBody = [
    'Menimbang   : Bahwa untuk meningkatkan efisiensi tata kelola persuratan digital;',
    'Mengingat   : Undang-Undang Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik;',
    'MEMUTUSKAN  : Menetapkan berlakunya pengesahan dokumen berbasis kode QR hyperlink.',
    'Pertama     : Seluruh dokumen resmi wajib memuat kode QR verifikasi tersertifikasi.',
    'Kedua       : Keputusan ini mulai berlaku pada tanggal ditetapkan.'
  ];

  let y = height - 180;
  for (const line of skBody) {
    page.drawText(line, { x: 55, y, size: 9.5, font: line.startsWith('MEMUTUSKAN') ? fontBold : fontRegular, color: rgb(0.2, 0.25, 0.3) });
    y -= 22;
  }

  page.drawText('Ditetapkan di: Jakarta', { x: width - 230, y: 260, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });

  page.drawText('Salinan sah sesuai aslinya ditandai stempel digital TTE.', {
    x: 50,
    y: 40,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  return await pdfDoc.save();
}

/**
 * Generates Surat Tugas / Perintah Dinas (SPT) Sample Document
 */
export async function createSampleAssignmentDocument(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  // Header Kop
  page.drawText('PEMERINTAH REPUBLIK INDONESIA', {
    x: width / 2 - 120,
    y: height - 55,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawText('BADAN PENGELOLA SISTEM ELEKTRONIK & TIK', {
    x: width / 2 - 145,
    y: height - 72,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawLine({
    start: { x: 50, y: height - 85 },
    end: { x: width - 50, y: height - 85 },
    thickness: 1.5,
    color: rgb(0.1, 0.15, 0.25),
  });

  page.drawText('SURAT PERINTAH TUGAS DINAS (SPT)', {
    x: width / 2 - 130,
    y: height - 120,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawText(`Nomor: SPT/TIK/${new Date().getFullYear()}/0194`, {
    x: width / 2 - 70,
    y: height - 138,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  const body = [
    'Dasar : Rencana Kerja Pengelolaan dan Verifikasi Keamanan Informasi Dokumen Elektronik.',
    '',
    'MEMERINTAHKAN:',
    '',
    'Kepada : Tim Verifikasi & Pengesahan Tanda Tangan Elektronik',
    'Tugas  : Melaksanakan implementasi, pemindaian barcode pelacak, dan pengesahan TTE',
    '         pada seluruh berkas administrasi dan dokumen kedinasan resmi.',
    'Waktu  : Sejak tanggal surat ini ditetapkan sampai dengan selesainya penugasan.',
    '',
    'Demikian Surat Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab.'
  ];

  let y = height - 180;
  for (const line of body) {
    page.drawText(line, {
      x: 55,
      y,
      size: 9.5,
      font: line.startsWith('MEMERINTAHKAN') || line.startsWith('Kepada') ? fontBold : fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    });
    y -= 18;
  }

  page.drawText('Ditetapkan di: Jakarta', { x: width - 230, y: 260, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
  page.drawText('Pejabat Yang Memberi Tugas:', { x: width - 230, y: 245, size: 9, font: fontBold, color: rgb(0.15, 0.2, 0.25) });

  page.drawText('Dokumen tugas dinas ini disahkan dengan barcode/TTE otomatis.', {
    x: 50,
    y: 40,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  return await pdfDoc.save();
}

/**
 * Generates Nota Dinas / Memo Resmi Sample Document
 */
export async function createSampleMemoDocument(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  page.drawText('NOTA DINAS PENGESAHAN DOKUMEN', {
    x: width / 2 - 130,
    y: height - 60,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawText(`Nomor: ND-TTE/${new Date().getFullYear()}/0811`, {
    x: width / 2 - 75,
    y: height - 78,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  page.drawLine({
    start: { x: 50, y: height - 90 },
    end: { x: width - 50, y: height - 90 },
    thickness: 1.5,
    color: rgb(0.1, 0.15, 0.25),
  });

  const headers = [
    `Yth.     : Pimpinan Instansi / Pemohon Pengesahan`,
    `Dari     : Kepala Unit Verifikasi TTE & Sertifikasi Digital`,
    `Tanggal  : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
    `Perihal  : Pemberitahuan Dokumen Telah Terpasang Barcode & TTE Sah`,
  ];

  let y = height - 120;
  for (const h of headers) {
    page.drawText(h, { x: 55, y, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
    y -= 18;
  }

  page.drawLine({
    start: { x: 55, y: y - 5 },
    end: { x: width - 55, y: y - 5 },
    thickness: 0.5,
    color: rgb(0.6, 0.65, 0.7),
  });

  y -= 25;

  const content = [
    'Bersama ini diberitahukan bahwa berkas dokumen yang diajukan telah selesai diproses',
    'dan secara resmi dibubuhi Barcode/QR Code pelacak serta Tanda Tangan Elektronik (TTE).',
    '',
    'Seluruh parameter keaslian data telah diverifikasi memenuhi standar kriptografi dokumen digital.',
    'Verifikasi lanjutan dapat dilakukan sewaktu-waktu melalui sistem pemindai barcode terintegrasi.',
    '',
    'Demikian untuk menjadi maklum dan dapat dipergunakan sebagaimana mestinya.'
  ];

  for (const line of content) {
    page.drawText(line, { x: 55, y, size: 9.5, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });
    y -= 18;
  }

  page.drawText('Diterbitkan secara resmi oleh sistem otomasi dokumen.', {
    x: 50,
    y: 40,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  return await pdfDoc.save();
}

/**
 * Generates custom document based on user input automatically
 */
export async function createCustomAutoDocument(config: AutoDocConfig): Promise<{ bytes: Uint8Array; name: string }> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  // Institution / Kop
  const instText = (config.institution || 'BADAN TEKNOLOGI & INFORMASI NASIONAL').toUpperCase();
  page.drawText('PEMERINTAH REPUBLIK INDONESIA', {
    x: width / 2 - 120,
    y: height - 50,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawText(instText, {
    x: Math.max(50, width / 2 - (instText.length * 5.2) / 2),
    y: height - 67,
    size: 10,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });

  page.drawText('Layanan Persuratan & Pengesahan Dokumen Elektronik Sah Mandiri', {
    x: width / 2 - 155,
    y: height - 81,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Top header double border line
  page.drawLine({
    start: { x: 50, y: height - 90 },
    end: { x: width - 50, y: height - 90 },
    thickness: 2,
    color: rgb(0.1, 0.15, 0.25),
  });
  page.drawLine({
    start: { x: 50, y: height - 93 },
    end: { x: width - 50, y: height - 93 },
    thickness: 0.75,
    color: rgb(0.1, 0.15, 0.25),
  });

  // If includeAutoBarcode, draw 1D barcode on top right header
  if (config.includeAutoBarcode && config.barcodeValue) {
    try {
      const barcodeImgUrl = generateBarcodeDataUrl(config.barcodeValue, {
        format: config.barcodeType === 'code39' ? 'CODE39' : 'CODE128',
        height: 38,
        width: 1.5,
        fontSize: 10,
      });
      if (barcodeImgUrl) {
        const barcodeImg = await pdfDoc.embedPng(barcodeImgUrl);
        page.drawImage(barcodeImg, {
          x: width - 180,
          y: height - 42,
          width: 130,
          height: 32,
        });
      }
    } catch (e) {
      console.warn('Could not draw header barcode:', e);
    }
  }

  // Document Title
  const titleText = (config.title || 'SURAT PENGESAHAN DOKUMEN RESMI').toUpperCase();
  page.drawText(titleText, {
    x: Math.max(50, width / 2 - (titleText.length * 5.5) / 2),
    y: height - 128,
    size: 11.5,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  const docNo = config.docNumber ? `Nomor: ${config.docNumber}` : `Nomor: REG-TTE/${new Date().getFullYear()}/091`;
  page.drawText(docNo, {
    x: Math.max(50, width / 2 - (docNo.length * 4.2) / 2),
    y: height - 144,
    size: 9,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  // Body content
  const defaultParagraphs = [
    'Yang bertanda tangan di bawah ini menerangkan dengan sebenarnya bahwa dokumen ini dibuat',
    'secara otomatis melalui sistem administrasi elektronik terpadu dan berkekuatan hukum sah.',
    '',
    `Perihal / Uraian Dokumen:`,
    config.summary ? `${config.summary}` : `Pelaksanaan tata kelola persuratan digital terenkripsi dengan pelacak barcode dan QR code.`,
    '',
    'Ketentuan dan Keabsahan:',
    '1. Dokumen ini dilindungi dengan algoritma kriptografi satu arah SHA-256.',
    '2. Informasi di dalam berkas ini telah terdaftar pada pangkalan arsip elektronik resmi.',
    '3. Barcode atau kode QR pada dokumen berfungsi sebagai verifikator keaslian data seketika.',
    '',
    'Demikian dokumen ini dibuat untuk dapat dipergunakan sebagaimana mestinya.'
  ];

  let currentY = height - 185;
  for (const p of defaultParagraphs) {
    page.drawText(p, {
      x: 55,
      y: currentY,
      size: 9.5,
      font: p.startsWith('Perihal') || p.startsWith('Ketentuan') ? fontBold : fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    });
    currentY -= 17;
  }

  // Location & date
  const locDate = `${config.location || 'Jakarta'}, ${config.date || new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`;
  page.drawText(locDate, {
    x: width - 230,
    y: 260,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });

  page.drawText(config.signerTitle || 'Pejabat Penandatangan:', {
    x: width - 230,
    y: 245,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.25),
  });

  page.drawText(config.signerName || 'Ir. H. Pratama Wijaya, M.Kom', {
    x: width - 230,
    y: 175,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.25),
  });

  if (config.signerId) {
    page.drawText(`NIP. ${config.signerId}`, {
      x: width - 230,
      y: 162,
      size: 8,
      font: fontRegular,
      color: rgb(0.35, 0.4, 0.45),
    });
  }

  page.drawText('Dokumen ini dibuat otomatis & terverifikasi oleh Sistem Otomasi Persuratan TTE.', {
    x: 50,
    y: 40,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.5, 0.55, 0.6),
  });

  const bytes = await pdfDoc.save();
  const safeTitle = (config.title || 'Dokumen_Otomatis').replace(/[^a-zA-Z0-9_-]/g, '_');
  const name = `${safeTitle}.pdf`;

  return { bytes, name };
}

/**
 * Appends a new blank / endorsement page to an existing PDF document
 */
export async function appendEndorsementPageToPdf(
  existingBytes: Uint8Array | ArrayBuffer,
  title = 'Lembar Pengesahan Tambahan'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(existingBytes);
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  // Border frame
  page.drawRectangle({
    x: 35,
    y: 35,
    width: width - 70,
    height: height - 70,
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 1,
  });

  page.drawText('LAMPIRAN PENGESAHAN DOKUMEN ELEKTRONIK', {
    x: width / 2 - 145,
    y: height - 75,
    size: 11,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.3),
  });

  page.drawText(title.toUpperCase(), {
    x: width / 2 - 110,
    y: height - 95,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawLine({
    start: { x: 50, y: height - 110 },
    end: { x: width - 50, y: height - 110 },
    thickness: 1,
    color: rgb(0.3, 0.35, 0.45),
  });

  const lines = [
    'Halaman ini merupakan lembar pengesahan dan verifikasi tambahan dari berkas dokumen sebelumnya.',
    'Segala ketetapan, tanda tangan elektronik, dan barcode yang dibubuhkan pada lembar ini memiliki',
    'kekuatan hukum yang menyatu dan tidak terpisahkan dari dokumen utama.',
    '',
    `Waktu Penambahan : ${new Date().toLocaleString('id-ID')}`,
    'Status Lembar    : Terverifikasi Sistem Otomasi Dokumen TTE',
  ];

  let y = height - 150;
  for (const l of lines) {
    page.drawText(l, { x: 55, y, size: 9.5, font: l.startsWith('Waktu') || l.startsWith('Status') ? fontBold : fontRegular, color: rgb(0.2, 0.25, 0.3) });
    y -= 18;
  }

  return await pdfDoc.save();
}

/**
 * Creates sample document based on chosen type
 */
export async function createSampleDocumentByType(type: SampleDocType): Promise<{ bytes: Uint8Array; name: string; title: string }> {
  switch (type) {
    case 'bast': {
      const bytes = await createSampleBASTDocument();
      return { bytes, name: 'BAST_Serah_Terima_Digital.pdf', title: 'Berita Acara Serah Terima (BAST)' };
    }
    case 'certificate': {
      const bytes = await createSampleCertificateDocument();
      return { bytes, name: 'Sertifikat_Pengesahan_Digital.pdf', title: 'Sertifikat Pengesahan Digital' };
    }
    case 'sk': {
      const bytes = await createSampleSKDocument();
      return { bytes, name: 'Surat_Keputusan_Pejabat.pdf', title: 'Surat Keputusan (SK) Pejabat' };
    }
    case 'assignment': {
      const bytes = await createSampleAssignmentDocument();
      return { bytes, name: 'Surat_Tugas_Dinas.pdf', title: 'Surat Perintah Tugas (SPT)' };
    }
    case 'memo': {
      const bytes = await createSampleMemoDocument();
      return { bytes, name: 'Nota_Dinas_Pengesahan.pdf', title: 'Nota Dinas Resmi' };
    }
    case 'statement':
    default: {
      const bytes = await createSampleDocument();
      return { bytes, name: 'Surat_Pernyataan_Resmi.pdf', title: 'Surat Pernyataan Pengesahan Dokumen' };
    }
  }
}

/**
 * Creates the high-resolution TTE stamp badge as an image DataURL
 */
export async function createTTEStampCanvas(config: TTEConfig): Promise<string> {
  const qrUrl = config.verificationUrl || `https://tte.layanan.go.id/verify?doc=${encodeURIComponent(config.docNumber)}`;
  const qrDataUrl = config.qrDataUrl || await generateQRDataUrl(qrUrl, {
    width: 250,
    margin: 1,
    colorDark: '#0f2744',
  });

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // High-resolution for crisp rendering inside PDF
    const width = 850;
    const height = 340;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // Theme color definition (blue, red, black)
    const theme = config.stampTheme || 'blue';
    const primaryColor = theme === 'red' ? '#b91c1c' : theme === 'black' ? '#0f172a' : '#1e3a8a';
    const secondaryColor = theme === 'red' ? '#fca5a5' : theme === 'black' ? '#94a3b8' : '#93c5fd';
    const ribbonColor = theme === 'red' ? '#dc2626' : theme === 'black' ? '#18181b' : '#1e3a8a';
    const accentColor = theme === 'red' ? '#dc2626' : theme === 'black' ? '#334155' : '#2563eb';
    const qrBoxBorder = theme === 'red' ? '#fca5a5' : theme === 'black' ? '#cbd5e1' : '#cbd5e1';
    const qrBoxBg = theme === 'red' ? '#fff5f5' : theme === 'black' ? '#f8fafc' : '#f8fafc';

    // Background Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 16);
    ctx.fill();

    // Outer Border
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner subtle border
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(6, 6, width - 12, height - 12, 12);
    ctx.stroke();

    // Left security ribbon
    ctx.fillStyle = ribbonColor;
    ctx.beginPath();
    ctx.roundRect(6, 6, 18, height - 12, [12, 0, 0, 12]);
    ctx.fill();

    // QR Code on the right
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      const qrBoxSize = 220;
      const qrX = width - qrBoxSize - 28;
      const qrY = (height - qrBoxSize) / 2;

      // QR box background
      ctx.fillStyle = qrBoxBg;
      ctx.beginPath();
      ctx.roundRect(qrX - 8, qrY - 8, qrBoxSize + 16, qrBoxSize + 16, 12);
      ctx.fill();
      ctx.strokeStyle = qrBoxBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

      // QR Scan label under QR
      ctx.fillStyle = primaryColor;
      ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('PINDAI VERIFIKASI TTE', qrX + qrBoxSize / 2, qrY + qrBoxSize + 22);

      // Left Text Section
      const textX = 42;
      let textY = 40;

      // Seal Header / Emblem simulation
      ctx.fillStyle = primaryColor;
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText('DITANDATANGANI SECARA ELEKTRONIK OLEH:', textX, textY);

      textY += 34;
      // Signer Name
      ctx.fillStyle = '#0f172a';
      ctx.font = "bold 26px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(config.signerName.toUpperCase(), textX, textY);

      textY += 25;
      // Title / Position
      ctx.fillStyle = accentColor;
      ctx.font = "600 17px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(config.signerTitle, textX, textY);

      textY += 23;
      // Institution
      ctx.fillStyle = '#475569';
      ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(config.institution, textX, textY);

      if (config.signerId) {
        textY += 21;
        ctx.fillStyle = '#64748b';
        ctx.font = "500 14px 'JetBrains Mono', monospace";
        ctx.fillText(`NIP/NIK: ${config.signerId}`, textX, textY);
      }

      // Divider line
      textY += 22;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(textX, textY);
      ctx.lineTo(qrX - 25, textY);
      ctx.stroke();

      // Timestamp & Certified Notice
      textY += 26;
      ctx.fillStyle = '#059669'; // Emerald green
      ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText('✓ TERSERTIFIKASI & MEMILIKI KEKUATAN HUKUM SAH', textX, textY);

      textY += 22;
      ctx.fillStyle = '#64748b';
      ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`Waktu TTE: ${config.signDate}`, textX, textY);

      textY += 19;
      ctx.fillStyle = '#94a3b8';
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.fillText(`ID Dok: ${config.docNumber}`, textX, textY);

      // If user provided a drawn wet signature, overlay it with authentic transparency
      if (config.signatureDataUrl && (config.signatureType === 'wet_signature' || config.signatureType === 'combined')) {
        const sigImg = new Image();
        sigImg.onload = () => {
          if (config.signatureType === 'wet_signature') {
            // Re-clear to only show wet signature with border
            const onlySigCanvas = document.createElement('canvas');
            onlySigCanvas.width = 600;
            onlySigCanvas.height = 250;
            const sCtx = onlySigCanvas.getContext('2d')!;
            sCtx.drawImage(sigImg, 0, 0, 600, 250);
            resolve(onlySigCanvas.toDataURL('image/png'));
          } else {
            // Combined: draw over signer name as authentic manual overlay
            ctx.save();
            ctx.globalAlpha = 0.88;
            ctx.drawImage(sigImg, textX + 180, 50, 260, 110);
            ctx.restore();
            resolve(canvas.toDataURL('image/png'));
          }
        };
        sigImg.onerror = () => resolve(canvas.toDataURL('image/png'));
        sigImg.src = config.signatureDataUrl;
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    };
    qrImg.onerror = () => resolve('');
    qrImg.src = qrDataUrl;
  });
}

/**
 * Signs an existing PDF document and returns the new PDF Uint8Array
 */
export async function signPdfDocument(
  pdfBytes: Uint8Array | ArrayBuffer,
  stampDataUrl: string,
  placement: SignaturePlacement,
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  }
): Promise<{ pdfBytes: Uint8Array; docHash: string }> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Set standard PDF document metadata
  if (metadata) {
    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.subject) pdfDoc.setSubject(metadata.subject);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
    pdfDoc.setProducer('Aplikasi Dokumen TTE & QR Scanner');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
  }

  const pages = pdfDoc.getPages();
  const pageIndex = Math.max(0, Math.min(placement.pageNumber - 1, pages.length - 1));
  const targetPage = pages[pageIndex];

  const { width: pageWidth, height: pageHeight } = targetPage.getSize();

  // Convert percentage placement to PDF point coordinates
  // Note: PDF coordinate (0,0) is at bottom-left!
  const stampWidth = (placement.widthPercent / 100) * pageWidth;
  const stampHeight = (placement.heightPercent / 100) * pageHeight;
  const stampX = (placement.xPercent / 100) * pageWidth;
  // Convert from Top-Left UI percentage to Bottom-Left PDF point:
  const stampY = pageHeight - ((placement.yPercent / 100) * pageHeight) - stampHeight;

  // Embed the stamp PNG image
  const pngImage = await pdfDoc.embedPng(stampDataUrl);

  targetPage.drawImage(pngImage, {
    x: Math.max(0, Math.min(stampX, pageWidth - stampWidth)),
    y: Math.max(0, Math.min(stampY, pageHeight - stampHeight)),
    width: stampWidth,
    height: stampHeight,
  });

  const modifiedPdfBytes = await pdfDoc.save();
  const docHash = await calculateDocHash(modifiedPdfBytes);

  return {
    pdfBytes: modifiedPdfBytes,
    docHash,
  };
}

/**
 * Automatically stamps a QR Code or TTE Seal directly onto a PDF file
 */
export async function stampQrDirectlyToPdf(
  pdfBytes: Uint8Array | ArrayBuffer,
  qrDataUrl: string,
  options?: {
    pageNumber?: number;
    placementPreset?: AutoMountPlacement;
    style?: AutoMountStyle;
    tteConfig?: Partial<TTEConfig>;
  }
): Promise<{ pdfBytes: Uint8Array; docHash: string; placement: SignaturePlacement }> {
  const pageNumber = options?.pageNumber || 1;
  const placementPreset = options?.placementPreset || 'bottom-right';
  const style = options?.style || 'tte_seal';

  let placement: SignaturePlacement;
  let stampImgUrl: string;

  if (style === 'tte_seal') {
    // Official full certified seal box
    switch (placementPreset) {
      case 'bottom-left':
        placement = { pageNumber, xPercent: 6, yPercent: 70, widthPercent: 40, heightPercent: 16 };
        break;
      case 'bottom-center':
        placement = { pageNumber, xPercent: 30, yPercent: 72, widthPercent: 40, heightPercent: 16 };
        break;
      case 'top-right':
        placement = { pageNumber, xPercent: 55, yPercent: 12, widthPercent: 40, heightPercent: 16 };
        break;
      case 'bottom-right':
      default:
        placement = { pageNumber, xPercent: 55, yPercent: 70, widthPercent: 40, heightPercent: 16 };
        break;
    }

    const fullConfig: TTEConfig = {
      signerName: options?.tteConfig?.signerName || 'Ir. H. Pratama Wijaya, M.Kom',
      signerTitle: options?.tteConfig?.signerTitle || 'Kepala Balai Sertifikasi & Verifikasi Digital',
      institution: options?.tteConfig?.institution || 'Badan Pengembangan TI & Komunikasi',
      signerId: options?.tteConfig?.signerId || '19840214 200801 1 003',
      signDate:
        options?.tteConfig?.signDate ||
        new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) + ' WIB',
      verificationUrl: options?.tteConfig?.verificationUrl || 'https://tte.layanan.go.id/verify',
      docNumber: options?.tteConfig?.docNumber || `SP-TTE/BPTI/${new Date().getFullYear()}/0891`,
      docTitle: options?.tteConfig?.docTitle || 'Surat Pengesahan Dokumen Elektronik',
      location: options?.tteConfig?.location || 'Jakarta',
      showQrCode: true,
      showSignerDetails: true,
      showEmblem: true,
      signatureType: 'tte_seal',
      qrDataUrl: qrDataUrl,
      stampTheme: options?.tteConfig?.stampTheme || 'blue',
    };

    stampImgUrl = await createTTEStampCanvas(fullConfig);
  } else if (style === 'barcode_1d') {
    // 1D Barcode (wide aspect ratio)
    switch (placementPreset) {
      case 'bottom-left':
        placement = { pageNumber, xPercent: 6, yPercent: 78, widthPercent: 34, heightPercent: 9 };
        break;
      case 'bottom-center':
        placement = { pageNumber, xPercent: 33, yPercent: 78, widthPercent: 34, heightPercent: 9 };
        break;
      case 'top-right':
        placement = { pageNumber, xPercent: 60, yPercent: 4, widthPercent: 34, heightPercent: 9 };
        break;
      case 'bottom-right':
      default:
        placement = { pageNumber, xPercent: 60, yPercent: 78, widthPercent: 34, heightPercent: 9 };
        break;
    }
    stampImgUrl = qrDataUrl;
  } else {
    // Clean QR badge
    switch (placementPreset) {
      case 'bottom-left':
        placement = { pageNumber, xPercent: 6, yPercent: 72, widthPercent: 22, heightPercent: 20 };
        break;
      case 'bottom-center':
        placement = { pageNumber, xPercent: 39, yPercent: 72, widthPercent: 22, heightPercent: 20 };
        break;
      case 'top-right':
        placement = { pageNumber, xPercent: 72, yPercent: 8, widthPercent: 22, heightPercent: 20 };
        break;
      case 'bottom-right':
      default:
        placement = { pageNumber, xPercent: 72, yPercent: 72, widthPercent: 22, heightPercent: 20 };
        break;
    }

    stampImgUrl = qrDataUrl;
  }

  const { pdfBytes: modifiedBytes, docHash } = await signPdfDocument(pdfBytes, stampImgUrl, placement);

  return {
    pdfBytes: modifiedBytes,
    docHash,
    placement,
  };
}

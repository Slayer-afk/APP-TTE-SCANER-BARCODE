export interface TTEConfig {
  signerName: string;
  signerTitle: string;
  institution: string;
  signerId: string; // NIP / NIK / ID Pegawai
  signDate: string; // YYYY-MM-DD HH:mm:ss WIB
  verificationUrl: string; // Link verifikasi TTE
  docNumber: string;
  docTitle: string;
  location: string;
  showQrCode: boolean;
  showSignerDetails: boolean;
  showEmblem: boolean;
  signatureType: 'tte_seal' | 'wet_signature' | 'combined';
  signatureDataUrl?: string; // Drawn signature from canvas
  qrDataUrl?: string; // Generated QR code
  stampTheme?: 'blue' | 'red' | 'black' | 'emerald';
}

export interface SignaturePlacement {
  pageNumber: number; // 1-indexed
  xPercent: number; // 0 to 100% from left
  yPercent: number; // 0 to 100% from top
  widthPercent: number; // relative width
  heightPercent: number; // relative height
}

export interface TTEDocumentRecord {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  signedAt: string;
  pageCount: number;
  signedPage: number;
  signerName: string;
  docHash: string;
  verificationUrl: string;
  pdfBlobUrl?: string;
  downloadUrl?: string;
}

export interface ScanResultItem {
  id: string;
  text: string;
  formatName: string;
  timestamp: string;
  isUrl: boolean;
  isTTE: boolean;
  tteData?: TTEDocumentRecord;
}

export interface QRGeneratorConfig {
  text: string;
  colorDark: string;
  colorLight: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  size: number;
  includeLabel: boolean;
  labelText: string;
  includeIcon: boolean;
  iconType: 'link' | 'shield' | 'doc' | 'verified';
}

export type BarcodeType = 'qr' | 'code128' | 'code39' | 'ean13';

export interface AutoDocConfig {
  docType: 'statement' | 'bast' | 'sk' | 'assignment' | 'memo' | 'certificate';
  title: string;
  docNumber: string;
  institution: string;
  signerName: string;
  signerTitle: string;
  signerId?: string;
  location: string;
  date: string;
  summary?: string;
  includeAutoBarcode?: boolean;
  barcodeType?: BarcodeType;
  barcodeValue?: string;
}

export type SampleDocType = 'statement' | 'bast' | 'certificate' | 'sk' | 'assignment' | 'memo';

export interface DocumentFile {
  name: string;
  bytes: Uint8Array;
  size: number;
  pageCount: number;
  blobUrl: string;
  sourceType:
    | 'sample_statement'
    | 'sample_bast'
    | 'sample_certificate'
    | 'sample_sk'
    | 'auto_generated'
    | 'uploaded';
}

export type AutoMountPlacement = 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right';
export type AutoMountStyle = 'tte_seal' | 'clean_qr' | 'barcode_1d';

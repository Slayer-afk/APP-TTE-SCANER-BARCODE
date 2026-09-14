import JsBarcode from 'jsbarcode';
import { BarcodeType } from '../types';

export interface BarcodeRenderOptions {
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC' | 'ITF14';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  fontOptions?: string;
  lineColor?: string;
  background?: string;
  margin?: number;
}

/**
 * Generates high quality Data URL PNG of a 1D Barcode using HTML Canvas
 */
export function generateBarcodeDataUrl(
  text: string,
  options?: BarcodeRenderOptions
): string {
  const canvas = document.createElement('canvas');
  const sanitized = (text || 'DOC-2026-0001').trim();
  const format = options?.format || 'CODE128';

  try {
    JsBarcode(canvas, sanitized, {
      format: format,
      width: options?.width || 2,
      height: options?.height || 55,
      displayValue: options?.displayValue !== false,
      fontSize: options?.fontSize || 13,
      lineColor: options?.lineColor || '#0f172a',
      background: options?.background || '#ffffff',
      margin: options?.margin ?? 8,
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('JsBarcode initial format error, falling back to CODE128:', err);
    try {
      // Clean string for CODE128 fallback
      const fallbackText = sanitized.replace(/[^a-zA-Z0-9\-_./ ]/g, '-');
      JsBarcode(canvas, fallbackText, {
        format: 'CODE128',
        width: 2,
        height: 55,
        displayValue: true,
        fontSize: 13,
        lineColor: options?.lineColor || '#0f172a',
        background: '#ffffff',
        margin: 8,
      });
      return canvas.toDataURL('image/png');
    } catch (e2) {
      console.error('Failed to generate fallback barcode:', e2);
      return '';
    }
  }
}

/**
 * Generate automatic official barcode tracking numbers
 */
export function generateAutoBarcodeNumber(category: 'doc' | 'tte' | 'reg' | 'numeric' = 'doc'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random5 = Math.floor(10000 + Math.random() * 90000);
  const random4 = Math.floor(1000 + Math.random() * 9000);

  switch (category) {
    case 'tte':
      return `TTE-${year}${month}${day}-${random4}`;
    case 'reg':
      return `REG-${year}-${month}-${random5}`;
    case 'numeric':
      // 12-digit numeric suitable for standard retail/inventory barcode
      return `${year}${month}${day}${random4}`;
    case 'doc':
    default:
      return `DOC-${year}-${random5}`;
  }
}

/**
 * Map BarcodeType to JsBarcode format string
 */
export function mapBarcodeTypeToJsBarcodeFormat(type: BarcodeType): 'CODE128' | 'CODE39' | 'EAN13' {
  switch (type) {
    case 'code39':
      return 'CODE39';
    case 'ean13':
      return 'EAN13';
    case 'code128':
    default:
      return 'CODE128';
  }
}

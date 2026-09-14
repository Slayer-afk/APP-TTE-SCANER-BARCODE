import QRCode from 'qrcode';

export interface GenerateQROptions {
  colorDark?: string;
  colorLight?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  width?: number;
  labelText?: string;
  iconType?: 'link' | 'shield' | 'doc' | 'verified' | 'none';
}

/**
 * Generate standard QR code data URL
 */
export async function generateQRDataUrl(
  text: string,
  options: GenerateQROptions = {}
): Promise<string> {
  const {
    colorDark = '#0f172a',
    colorLight = '#ffffff',
    errorCorrectionLevel = 'M',
    margin = 2,
    width = 512,
  } = options;

  try {
    return await QRCode.toDataURL(text || 'https://contoh-link.com', {
      errorCorrectionLevel,
      margin,
      width,
      color: {
        dark: colorDark,
        light: colorLight,
      },
    });
  } catch (err) {
    console.error('Error generating basic QR code:', err);
    throw err;
  }
}

/**
 * Generate SVG string of QR code
 */
export async function generateQRSvg(
  text: string,
  options: GenerateQROptions = {}
): Promise<string> {
  const {
    colorDark = '#0f172a',
    colorLight = '#ffffff',
    errorCorrectionLevel = 'M',
    margin = 2,
  } = options;

  try {
    return await QRCode.toString(text || 'https://contoh-link.com', {
      type: 'svg',
      errorCorrectionLevel,
      margin,
      color: {
        dark: colorDark,
        light: colorLight,
      },
    });
  } catch (err) {
    console.error('Error generating SVG QR code:', err);
    throw err;
  }
}

/**
 * Generate an enhanced branded QR code with label banner and/or center badge
 */
export async function generateBrandedQRDataUrl(
  text: string,
  options: GenerateQROptions = {}
): Promise<string> {
  const {
    colorDark = '#0f172a',
    colorLight = '#ffffff',
    errorCorrectionLevel = 'H', // Use High for center icon stability
    margin = 2,
    width = 600,
    labelText,
    iconType = 'none',
  } = options;

  const rawQRDataUrl = await QRCode.toDataURL(text || 'https://contoh-link.com', {
    errorCorrectionLevel,
    margin,
    width,
    color: {
      dark: colorDark,
      light: colorLight,
    },
  });

  // If no label and no center icon, return raw QR directly
  if (!labelText && (!iconType || iconType === 'none')) {
    return rawQRDataUrl;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(rawQRDataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const extraBottom = labelText ? 70 : 0;
      canvas.width = width;
      canvas.height = width + extraBottom;

      // Fill background
      ctx.fillStyle = colorLight;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR image
      ctx.drawImage(img, 0, 0, width, width);

      // Draw center icon if requested
      if (iconType && iconType !== 'none') {
        const centerSize = Math.floor(width * 0.22);
        const centerX = (width - centerSize) / 2;
        const centerY = (width - centerSize) / 2;

        // White circle background for center icon
        ctx.save();
        ctx.fillStyle = colorLight;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(centerX - 4, centerY - 4, centerSize + 8, centerSize + 8, 12);
        ctx.fill();
        ctx.restore();

        // Border around icon
        ctx.strokeStyle = colorDark;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(centerX - 2, centerY - 2, centerSize + 4, centerSize + 4, 10);
        ctx.stroke();

        // Icon inside
        ctx.fillStyle = colorDark;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.floor(centerSize * 0.45)}px 'Plus Jakarta Sans', sans-serif`;

        if (iconType === 'link') {
          ctx.fillText('🔗', width / 2, width / 2);
        } else if (iconType === 'shield') {
          ctx.fillText('🛡️', width / 2, width / 2);
        } else if (iconType === 'doc') {
          ctx.fillText('📄', width / 2, width / 2);
        } else if (iconType === 'verified') {
          ctx.fillText('✓', width / 2, width / 2);
        }
      }

      // Draw label banner if requested
      if (labelText) {
        const bannerY = width + 5;
        ctx.fillStyle = colorDark;
        ctx.font = `600 ${Math.floor(width * 0.038)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText.toUpperCase(), width / 2, bannerY + 25);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(rawQRDataUrl);
    img.src = rawQRDataUrl;
  });
}

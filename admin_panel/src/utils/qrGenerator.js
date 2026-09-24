import QRCode from 'qrcode';

/**
 * Generates an ISO/IEC 18004 standard QR Code Data URL (PNG/SVG)
 * Compatible with all Android Camera apps, Google Lens, and Android Enterprise Provisioning.
 */
export async function generateQRCodeDataUrl(text, options = {}) {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options.size || 260,
      margin: 2,
      color: {
        dark: options.fgColor || '#0F172A',
        light: options.bgColor || '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate standard QR code:', err);
    return null;
  }
}

export function generateQRCodeSVG(text, options = {}) {
  // Sync fallback helper
  let svgString = '';
  QRCode.toString(text, {
    type: 'svg',
    width: options.size || 260,
    margin: 2,
    color: {
      dark: options.fgColor || '#0F172A',
      light: options.bgColor || '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  }, (err, string) => {
    if (!err) svgString = string;
  });
  return svgString;
}

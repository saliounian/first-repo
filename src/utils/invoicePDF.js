// Generate invoice PDF from HTML (lazy-loaded jsPDF + html2canvas)
// Returns Promise<Blob>

let _libsCache = null;
async function loadLibs() {
  if (_libsCache) return _libsCache;
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  _libsCache = { jsPDF, html2canvas };
  return _libsCache;
}

/**
 * Render an iframe's body into a PDF Blob (A4).
 * @param {HTMLIFrameElement} iframe — iframe whose document will be captured
 * @param {string} filename
 */
export async function iframeToPDFBlob(iframe) {
  const { jsPDF, html2canvas } = await loadLibs();
  const doc = iframe.contentDocument;
  const target = doc.querySelector('.page') || doc.body;

  const canvas = await html2canvas(target, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: 794,
    windowHeight: 1123,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgRatio = canvas.height / canvas.width;
  const imgH = pageW * imgRatio;
  if (imgH <= pageH) {
    pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH, undefined, 'FAST');
  } else {
    // Multi-page split
    let y = 0;
    while (y < imgH) {
      pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH, undefined, 'FAST');
      y += pageH;
      if (y < imgH) pdf.addPage();
    }
  }
  return pdf.output('blob');
}

export async function downloadPDFBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export async function sharePDFFile(blob, filename, title, text) {
  if (!navigator.canShare) return false;
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (!navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title, text });
    return true;
  } catch (e) {
    if (e.name === 'AbortError') return true; // user cancelled
    return false;
  }
}

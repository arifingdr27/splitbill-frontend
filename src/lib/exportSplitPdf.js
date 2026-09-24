import { jsPDF } from 'jspdf';
import { APP_NAME } from '../config/app';
import { getPdfLabels } from './pdfLabels';
import { languageCodeToLocale } from './receiptLanguage';

function toSafeFileName(text) {
  return String(text || 'split-bill')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/** jsPDF built-in fonts are WinAnsi; strip unsupported glyphs. */
function pdfText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u00A0\u202F\u2007\u2009]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '');
}

/**
 * Clean text PDF: items clearly separated from fee summary rows.
 * @param {object} payload
 * @param {string} [payload.storeName]
 * @param {string} [payload.languageCode] ISO 639-1 from receipt.language.code
 * @param {string} payload.grandTotalLabel
 * @param {Array<{
 *   name: string,
 *   totalLabel: string,
 *   items: Array<{ label: string, amountLabel: string }>,
 *   rows: Array<{ key: string, amountLabel: string }>
 * }>} payload.participants
 */
export async function downloadSplitCompletePdf(payload) {
  const languageCode = payload.languageCode || 'en';
  const t = getPdfLabels(languageCode);
  const dateLocale = languageCodeToLocale(languageCode);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 16;
  let y = 18;

  const ensureSpace = (needed) => {
    if (y + needed <= bottomLimit) return;
    pdf.addPage();
    y = 18;
  };

  const drawLine = () => {
    ensureSpace(4);
    pdf.setDrawColor(200);
    pdf.setLineWidth(0.2);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 5;
  };

  const row = (left, right, { bold = false, size = 10, color = 40 } = {}) => {
    ensureSpace(6);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color);

    const leftText = pdfText(left);
    const rightText = pdfText(right);
    const rightWidth = pdf.getTextWidth(rightText);
    const leftMax = contentWidth - rightWidth - 4;
    const leftLines = pdf.splitTextToSize(leftText, Math.max(leftMax, 40));

    leftLines.forEach((line, index) => {
      ensureSpace(5);
      pdf.text(line, marginX, y);
      if (index === 0) {
        pdf.text(rightText, pageWidth - marginX, y, { align: 'right' });
      }
      y += 5;
    });
  };

  const resolveFeeLabel = (feeRow) => {
    if (feeRow?.label) return feeRow.label;
    const key = feeRow?.key;
    if (typeof t[key] === 'string') return t[key];
    return key;
  };

  // --- Header ---
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(30);
  pdf.text(pdfText(t.title), marginX, y);
  y += 8;

  if (payload.storeName) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(60);
    pdf.text(pdfText(payload.storeName), marginX, y);
    y += 6;
  }

  let dateLabel = new Date().toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  // Fallback if locale renders non-Latin glyphs that Helvetica cannot show.
  if (!pdfText(dateLabel).trim()) {
    dateLabel = new Date().toISOString().slice(0, 10);
  }

  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(pdfText(dateLabel), marginX, y);
  y += 8;

  drawLine();

  row(t.totalPaid, payload.grandTotalLabel, {
    bold: true,
    size: 12,
    color: 20,
  });
  y += 4;

  const participants = payload.participants || [];
  participants.forEach((person, personIndex) => {
    ensureSpace(20);
    if (personIndex > 0) {
      y += 2;
      drawLine();
    }

    row(person.name, person.totalLabel, {
      bold: true,
      size: 12,
      color: 20,
    });
    y += 2;

    const items = person.items || [];
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    ensureSpace(5);
    pdf.text(pdfText(t.items), marginX, y);
    y += 5;

    if (items.length === 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(140);
      pdf.text(pdfText(t.noItems), marginX, y);
      y += 5;
    } else {
      items.forEach((item) => {
        row(item.label, item.amountLabel, { size: 10, color: 50 });
      });
    }

    y += 3;

    const rows = person.rows || [];
    if (rows.length > 0) {
      pdf.setDrawColor(230);
      pdf.setLineWidth(0.15);
      ensureSpace(3);
      pdf.line(marginX, y, pageWidth - marginX, y);
      y += 5;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(pdfText(t.feeSummary), marginX, y);
      y += 5;

      rows.forEach((feeRow) => {
        const label = resolveFeeLabel(feeRow);
        row(label, feeRow.amountLabel, {
          size: 10,
          color: feeRow.key === 'discount' ? 180 : 80,
          bold: false,
        });
      });
    }

    y += 2;
    row(t.personTotal(person.name), person.totalLabel, {
      bold: true,
      size: 11,
      color: 20,
    });
    y += 4;
  });

  ensureSpace(10);
  drawLine();
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(150);
  pdf.text(pdfText(t.generatedBy(APP_NAME)), marginX, y);

  const base = toSafeFileName(payload.storeName) || 'split-bill';
  pdf.save(`${base}-complete.pdf`);
}

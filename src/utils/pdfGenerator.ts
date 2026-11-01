import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, CompanySettings } from '../types/invoice';
import { formatCurrency, formatGeneralNumber, numberToWordsCordobas } from './currencyUtils';
import { formatDateTimeDisplay, formatDateDisplay } from './dateUtils';
import { getSettings } from '../services/storage';

export function generateInvoicePDF(invoice: Invoice, companySettings?: CompanySettings): jsPDF {
  const settings = companySettings || getSettings();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Background bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company Name in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.companyName.toUpperCase(), margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`RUC: ${settings.ruc}  |  Tel: ${settings.phone}`, margin, 21);

  // Invoice Title & Consecutive Number (Right aligned in header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURA DE SERVICIOS', pageWidth - margin, 12, { align: 'right' });

  doc.setFontSize(14);
  doc.setTextColor(165, 180, 252); // indigo-300
  doc.text(`N° ${invoice.invoiceNumber}`, pageWidth - margin, 20, { align: 'right' });

  // Metadata Bar (Issue date, address)
  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.address}, ${settings.city}`, margin, 36);
  doc.text(`Fecha de Emisión: ${formatDateDisplay(invoice.issueDate)}`, pageWidth - margin, 36, { align: 'right' });

  // Client Info Section (Boxed Card)
  const clientCardY = 42;
  const clientCardHeight = 32;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, clientCardY, pageWidth - margin * 2, clientCardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DEL CLIENTE', margin + 4, clientCardY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const client = invoice.clientSnapshot;
  // Left Column
  doc.text(`Cliente / Razón Social:`, margin + 4, clientCardY + 13);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name || 'Consumidor Final', margin + 40, clientCardY + 13);

  doc.setFont('helvetica', 'normal');
  doc.text(`RUC / Identificación:`, margin + 4, clientCardY + 20);
  doc.text(client.identification || 'N/A', margin + 40, clientCardY + 20);

  doc.text(`Dirección:`, margin + 4, clientCardY + 27);
  const truncatedAddress = client.address ? (client.address.length > 55 ? client.address.substring(0, 52) + '...' : client.address) : 'N/A';
  doc.text(truncatedAddress, margin + 40, clientCardY + 27);

  // Right Column
  const rightColX = margin + 115;
  doc.text(`Teléfono:`, rightColX, clientCardY + 13);
  doc.text(client.phone || 'N/A', rightColX + 22, clientCardY + 13);

  doc.text(`Correo:`, rightColX, clientCardY + 20);
  doc.text(client.email || 'N/A', rightColX + 22, clientCardY + 20);

  // Section 1: Principal Time Period
  const principalY = clientCardY + clientCardHeight + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. CÓMPUTO DE TIEMPO PRINCIPAL (JORNADA / OPERACIÓN)', margin, principalY);

  // Box for Principal Time
  const pBoxY = principalY + 3;
  const pBoxHeight = 22;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, pBoxY, pageWidth - margin * 2, pBoxHeight, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Fecha y Hora de Inicio Principal:', margin + 4, pBoxY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateTimeDisplay(invoice.startDateTimePrincipal), margin + 4, pBoxY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Fecha y Hora Final Principal:', margin + 70, pBoxY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateTimeDisplay(invoice.endDateTimePrincipal), margin + 70, pBoxY + 14);

  // Calculated gross hours highlight
  doc.setFillColor(224, 231, 255); // indigo-100
  doc.roundedRect(pageWidth - margin - 50, pBoxY + 3, 46, 16, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text('TOTAL HORAS BRUTAS', pageWidth - margin - 27, pBoxY + 8, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatGeneralNumber(invoice.grossHours)} hrs (${invoice.formattedGrossHours})`, pageWidth - margin - 27, pBoxY + 15, { align: 'center' });

  // Section 2: Lost Hours Detail (Horas Perdidas)
  const lostSectionY = pBoxY + pBoxHeight + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DETALLE DE HORAS PERDIDAS / DEDUCCIONES APLICADAS', margin, lostSectionY);

  // Table rows for lost hours
  const tableData = invoice.lostTimeEntries.length > 0
    ? invoice.lostTimeEntries.map((entry, index) => [
        String(index + 1),
        entry.description || 'Sin motivo especificado',
        formatDateTimeDisplay(entry.startDateTime),
        formatDateTimeDisplay(entry.endDateTime),
        `-${formatGeneralNumber(entry.durationHours)} hrs (${entry.formattedDuration})`,
      ])
    : [
        ['-', 'No se registraron horas perdidas (Deducción 0.00)', '—', '—', '0.00 hrs'],
      ];

  autoTable(doc, {
    startY: lostSectionY + 3,
    head: [['#', 'Motivo / Justificación de Tiempo Perdido', 'Inicio del Paro', 'Fin del Paro', 'Deducción']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [51, 65, 85],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 42 },
      3: { cellWidth: 42 },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
    },
    foot: [
      [
        '',
        'TOTAL DEDUCCIÓN POR HORAS PERDIDAS:',
        '',
        '',
        `-${formatGeneralNumber(invoice.totalLostHours)} hrs (${invoice.formattedLostHours})`,
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [185, 28, 28],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
    },
  });

  // Calculate position after table
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 7 : lostSectionY + 45;

  // Section 3: Financial Settlement & Final Calculations
  const boxWidth = 90;
  const summaryBoxX = pageWidth - margin - boxWidth;
  const summaryBoxY = finalY;

  // Notes on left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Condiciones y Observaciones:', margin, summaryBoxY + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const termsText = invoice.notes || settings.terms;
  const splitTerms = doc.splitTextToSize(termsText, summaryBoxX - margin - 8);
  doc.text(splitTerms, margin, summaryBoxY + 9);

  // Financial Summary Box on right
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(summaryBoxX, summaryBoxY, boxWidth, 54, 2, 2, 'FD');

  const lineStep = 7;
  let currY = summaryBoxY + 7;

  // Row 1: Horas Principales
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Horas Principales Brutas:', summaryBoxX + 4, currY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatGeneralNumber(invoice.grossHours)} hrs`, summaryBoxX + boxWidth - 4, currY, { align: 'right' });

  // Row 2: Horas Perdidas (Deducción)
  currY += lineStep;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 38, 38);
  doc.text('(-) Horas Perdidas Descontadas:', summaryBoxX + 4, currY);
  doc.setFont('helvetica', 'bold');
  doc.text(`-${formatGeneralNumber(invoice.totalLostHours)} hrs`, summaryBoxX + boxWidth - 4, currY, { align: 'right' });

  // Divider
  currY += 3;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX + 4, currY, summaryBoxX + boxWidth - 4, currY);
  currY += 4;

  // Row 3: Saldo Neto Facturable
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(67, 56, 202);
  doc.text('(=) Saldo Neto Facturable:', summaryBoxX + 4, currY);
  doc.text(`${formatGeneralNumber(invoice.netHours)} hrs`, summaryBoxX + boxWidth - 4, currY, { align: 'right' });

  // Row 4: Tarifa por Hora
  currY += lineStep;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tarifa por Hora Aplicada:', summaryBoxX + 4, currY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(invoice.hourlyRate, invoice.currency), summaryBoxX + boxWidth - 4, currY, { align: 'right' });

  // Final Total Highlight Bar
  currY += 5;
  doc.setFillColor(15, 23, 42);
  doc.rect(summaryBoxX, currY, boxWidth, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL A COBRAR:', summaryBoxX + 4, currY + 9);

  doc.setFontSize(13);
  doc.setTextColor(129, 140, 248); // indigo-300
  doc.text(formatCurrency(invoice.total, invoice.currency), summaryBoxX + boxWidth - 4, currY + 9.5, { align: 'right' });

  // Amount in words
  const wordsY = summaryBoxY + 54 + 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Son: ${numberToWordsCordobas(invoice.total)}`, margin, wordsY);

  // Signatures at page bottom
  const signY = pageHeight - 24;
  doc.setDrawColor(203, 213, 225);
  
  // Emisor signature
  doc.line(margin + 10, signY, margin + 70, signY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Entregado Conforme / Emisor', margin + 40, signY + 4, { align: 'center' });

  // Client signature
  doc.line(pageWidth - margin - 70, signY, pageWidth - margin - 10, signY);
  doc.text('Recibido Conforme / Cliente', pageWidth - margin - 40, signY + 4, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice, companySettings?: CompanySettings): void {
  const doc = generateInvoicePDF(invoice, companySettings);
  const sanitizedClient = (invoice.clientSnapshot.name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`${invoice.invoiceNumber}_${sanitizedClient}.pdf`);
}

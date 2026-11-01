import React, { useState } from 'react';
import { X, Download, Printer, CheckCircle2, Cloud, ExternalLink, RefreshCw } from 'lucide-react';
import { Invoice, CompanySettings } from '../types/invoice';
import { formatCurrency, formatGeneralNumber, numberToWordsCordobas } from '../utils/currencyUtils';
import { formatDateTimeDisplay, formatDateDisplay } from '../utils/dateUtils';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { uploadInvoiceToDrive } from '../services/googleDrive';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  settings: CompanySettings;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings,
}) => {
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<{ webViewLink?: string; name: string } | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadInvoicePDF(invoice, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUploadDrive = async () => {
    setIsUploadingDrive(true);
    setDriveError(null);
    try {
      const res = await uploadInvoiceToDrive(invoice, settings);
      setDriveResult(res);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || 'Error al subir a Google Drive');
    } finally {
      setIsUploadingDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white shrink-0 no-print gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Vista Previa de Factura
            </span>
            <span className="font-mono font-bold text-indigo-300 text-sm">
              {invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {driveResult ? (
              <a
                href={driveResult.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ver en Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleUploadDrive}
                disabled={isUploadingDrive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {isUploadingDrive ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingDrive ? 'Subiendo a Drive...' : 'Subir a Drive'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {driveError && (
          <div className="bg-red-50 text-red-700 text-xs px-6 py-2 border-b border-red-200">
            {driveError}
          </div>
        )}

        {/* Paper Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1">
          <div className="bg-white max-w-3xl mx-auto shadow-sm border border-slate-200 p-8 sm:p-10 text-slate-900 space-y-8 rounded-sm">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  {settings.companyName}
                </h1>
                <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                  <p>RUC: {settings.ruc} · Tel: {settings.phone}</p>
                  <p>{settings.address}, {settings.city}</p>
                  <p>{settings.email}</p>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md mb-1.5 uppercase">
                  Factura de Servicios
                </span>
                <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Fecha: {formatDateDisplay(invoice.issueDate)}
                </p>
              </div>
            </div>

            {/* Client Snapshot Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Razón Social:</span>
                  <span className="font-bold text-slate-900">{invoice.clientSnapshot.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">RUC / Identificación:</span>
                  <span className="font-mono text-slate-800">{invoice.clientSnapshot.identification || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dirección:</span>
                  <span className="text-slate-800">{invoice.clientSnapshot.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contacto:</span>
                  <span className="text-slate-800">
                    {invoice.clientSnapshot.phone} {invoice.clientSnapshot.email ? `· ${invoice.clientSnapshot.email}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Principal Time Range */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>1. Cómputo de Tiempo Principal (Jornada)</span>
                <span className="text-indigo-600 font-mono">
                  {formatGeneralNumber(invoice.grossHours)} hrs ({invoice.formattedGrossHours})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block">Fecha y Hora de Inicio Principal:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatDateTimeDisplay(invoice.startDateTimePrincipal)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha y Hora Final Principal:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatDateTimeDisplay(invoice.endDateTimePrincipal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lost Hours Breakdown Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>2. Horas Perdidas y Deducciones</span>
                <span className="text-red-600 font-mono">
                  -{formatGeneralNumber(invoice.totalLostHours)} hrs ({invoice.formattedLostHours})
                </span>
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Motivo / Causa</th>
                      <th className="py-2 px-3">Inicio</th>
                      <th className="py-2 px-3">Fin</th>
                      <th className="py-2 px-3 text-right">Deducción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.lostTimeEntries.length > 0 ? (
                      invoice.lostTimeEntries.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{item.description}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{item.startDateTime.replace('T', ' ')}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{item.endDateTime.replace('T', ' ')}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-red-600">
                            -{formatGeneralNumber(item.durationHours)} hrs
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-slate-400 text-center italic">
                          Sin horas perdidas reportadas (0.00 hrs)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary & Settlement */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
              <div className="max-w-xs text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">Observaciones / Términos:</p>
                <p className="leading-relaxed">{invoice.notes || settings.terms}</p>
                <p className="italic text-slate-600 pt-2">
                  Son: {numberToWordsCordobas(invoice.total)}
                </p>
              </div>

              {/* Financial Box */}
              <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Horas Principales:</span>
                  <span className="font-mono font-semibold">{formatGeneralNumber(invoice.grossHours)} hrs</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>(-) Deducción Horas Perdidas:</span>
                  <span className="font-mono font-semibold">-{formatGeneralNumber(invoice.totalLostHours)} hrs</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-bold border-t border-slate-200 pt-1.5">
                  <span>(=) Saldo Neto Facturable:</span>
                  <span className="font-mono">{formatGeneralNumber(invoice.netHours)} hrs</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Tarifa por Hora:</span>
                  <span className="font-mono font-semibold">{formatCurrency(invoice.hourlyRate, invoice.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 border-t-2 border-slate-300 pt-2 bg-indigo-50/70 p-2 rounded">
                  <span>TOTAL A COBRAR:</span>
                  <span className="text-base text-indigo-700 font-mono">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div>
                <div className="border-t border-slate-300 w-44 mx-auto pt-1 mb-1"></div>
                <p className="font-medium text-slate-700">Entregado Conforme / Emisor</p>
              </div>
              <div>
                <div className="border-t border-slate-300 w-44 mx-auto pt-1 mb-1"></div>
                <p className="font-medium text-slate-700">Recibido Conforme / Cliente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

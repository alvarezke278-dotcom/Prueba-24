import React, { useState, useEffect } from 'react';
import {
  Search,
  FileDown,
  Eye,
  Trash2,
  Calendar,
  Clock,
  Coins,
  FileText,
  PlusCircle,
  Building,
  Cloud,
  CheckCircle,
} from 'lucide-react';
import { Invoice, CompanySettings } from '../types/invoice';
import { getInvoices, deleteInvoice, getSettings } from '../services/storage';
import { formatCurrency, formatGeneralNumber } from '../utils/currencyUtils';
import { formatDateDisplay } from '../utils/dateUtils';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { uploadInvoiceToDrive } from '../services/googleDrive';
import { InvoicePreviewModal } from './InvoicePreviewModal';

interface InvoiceHistoryProps {
  onCreateNew: () => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ onCreateNew }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadedIds, setUploadedIds] = useState<Record<string, string>>({});
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const settings = getSettings();

  const loadInvoices = () => {
    setInvoices(getInvoices());
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDelete = (id: string, invoiceNumber: string) => {
    if (window.confirm(`¿Está seguro que desea eliminar la factura ${invoiceNumber}?`)) {
      deleteInvoice(id);
      loadInvoices();
    }
  };

  const handleOpenPreview = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsPreviewOpen(true);
  };

  const handleDownload = (inv: Invoice) => {
    downloadInvoicePDF(inv, settings);
  };

  const handleUploadDrive = async (inv: Invoice) => {
    setUploadingId(inv.id);
    setUploadNotice(null);
    try {
      const res = await uploadInvoiceToDrive(inv, settings);
      setUploadedIds((prev) => ({ ...prev, [inv.id]: res.webViewLink || 'https://drive.google.com' }));
      setUploadNotice(`Factura ${inv.invoiceNumber} guardada en Google Drive.`);
      setTimeout(() => setUploadNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al subir a Google Drive');
    } finally {
      setUploadingId(null);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const clientName = (inv.clientSnapshot?.name || '').toLowerCase();
    const invoiceNum = (inv.invoiceNumber || '').toLowerCase();
    const ruc = (inv.clientSnapshot?.identification || '').toLowerCase();
    return clientName.includes(term) || invoiceNum.includes(term) || ruc.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Historial de Facturas Emitidas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro de facturas con número consecutivo, liquidación de tiempos y reportes en PDF.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número consecutivo (ej. FAC-0001), cliente o RUC..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
          {filteredInvoices.length} {filteredInvoices.length === 1 ? 'factura' : 'facturas'}
        </span>
      </div>

      {/* Table / Empty State */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">
            {searchTerm ? 'No se encontraron facturas con ese criterio' : 'Aún no hay facturas guardadas'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {searchTerm
              ? 'Intente buscar con otro número consecutivo o nombre de cliente.'
              : 'Genere su primera factura calculando el tiempo de inicio y final principal, deduciendo horas perdidas y exportando en PDF.'}
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            Crear Primera Factura
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Consecutivo</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Cliente / Razón Social</th>
                  <th className="py-3 px-4 text-right">Horas Brutas</th>
                  <th className="py-3 px-4 text-right">Horas Perdidas</th>
                  <th className="py-3 px-4 text-right">Saldo Neto</th>
                  <th className="py-3 px-4 text-right">Total a Cobrar</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Invoice Number */}
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {inv.invoiceNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatDateDisplay(inv.issueDate)}
                    </td>

                    {/* Client */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.clientSnapshot?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {inv.clientSnapshot?.identification || 'Sin RUC'}
                      </div>
                    </td>

                    {/* Gross Hours */}
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                      {formatGeneralNumber(inv.grossHours)} hrs
                    </td>

                    {/* Lost Hours */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-red-600 tabular-nums">
                      {inv.totalLostHours > 0 ? `-${formatGeneralNumber(inv.totalLostHours)} hrs` : '0.00 hrs'}
                    </td>

                    {/* Net Hours */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 tabular-nums">
                      {formatGeneralNumber(inv.netHours)} hrs
                    </td>

                    {/* Total Cordobas */}
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(inv)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Ver factura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownload(inv)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Descargar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleUploadDrive(inv)}
                          disabled={uploadingId === inv.id}
                          className={`p-1.5 rounded-md transition-colors ${
                            uploadedIds[inv.id]
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={uploadedIds[inv.id] ? 'Subida a Google Drive' : 'Subir a Google Drive'}
                        >
                          <Cloud className={`w-4 h-4 ${uploadingId === inv.id ? 'animate-pulse text-emerald-600' : ''}`} />
                        </button>

                        <button
                          onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Eliminar factura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedInvoice && (
        <InvoicePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          invoice={selectedInvoice}
          settings={settings}
        />
      )}
    </div>
  );
};

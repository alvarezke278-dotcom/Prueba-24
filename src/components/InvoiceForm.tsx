import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Save,
  FileDown,
  Eye,
  RefreshCw,
  Calculator,
  Coins,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Cloud,
  ExternalLink,
} from 'lucide-react';
import { Client, LostTimeEntry, CompanySettings, Invoice } from '../types/invoice';
import {
  calculateDuration,
  formatDecimalHours,
  toDateTimeLocalString,
  toDateInputString,
} from '../utils/dateUtils';
import {
  formatCurrency,
  formatGeneralNumber,
  numberToWordsCordobas,
} from '../utils/currencyUtils';
import { LostTimeSection } from './LostTimeSection';
import { ClientModal } from './ClientModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import {
  getClients,
  saveClient,
  saveNewInvoice,
  getSettings,
  saveSettings,
  getNextInvoiceNumber,
} from '../services/storage';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { uploadInvoiceToDrive } from '../services/googleDrive';

interface InvoiceFormProps {
  onInvoiceSaved?: (newInvoice: Invoice) => void;
  onViewHistory?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onInvoiceSaved,
  onViewHistory,
}) => {
  // Settings & Sequence
  const [settings, setSettings] = useState<CompanySettings>(getSettings());
  const [nextSeq, setNextSeq] = useState(getNextInvoiceNumber(settings));

  // Client Selection & Creation
  const [clients, setClients] = useState<Client[]>(getClients());
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Invoice Dates
  const [issueDate, setIssueDate] = useState<string>(toDateInputString());

  // Principal Times (Fecha de inicio y final principal)
  // Default: Today from 08:00 to 17:00 (9 hours)
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return toDateTimeLocalString(d);
  }, []);

  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return toDateTimeLocalString(d);
  }, []);

  const [startDateTimePrincipal, setStartDateTimePrincipal] = useState<string>(defaultStart);
  const [endDateTimePrincipal, setEndDateTimePrincipal] = useState<string>(defaultEnd);

  // Lost Time Entries (Horas Perdidas)
  const [lostTimeEntries, setLostTimeEntries] = useState<LostTimeEntry[]>([]);

  // Hourly Rate (Default C$ 50)
  const [hourlyRate, setHourlyRate] = useState<number>(settings.defaultHourlyRate || 50);

  // Additional options
  const [notes, setNotes] = useState<string>('');
  const [serviceDescription, setServiceDescription] = useState<string>(
    'Servicio operativo y control de jornada técnica con deducción de tiempos inactivos'
  );

  // UI States & Preview
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveUploadedLink, setDriveUploadedLink] = useState<{ url: string; name: string } | null>(null);

  // Refresh settings and clients on mount
  useEffect(() => {
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
    setNextSeq(getNextInvoiceNumber(loadedSettings));
    const loadedClients = getClients();
    setClients(loadedClients);
    if (loadedClients.length > 0 && !selectedClientId) {
      setSelectedClientId(loadedClients[0].id);
    }
  }, []);

  // 1. Calculate Principal Time
  const principalDuration = useMemo(() => {
    return calculateDuration(startDateTimePrincipal, endDateTimePrincipal);
  }, [startDateTimePrincipal, endDateTimePrincipal]);

  const grossHours = principalDuration.isValid ? principalDuration.hoursDecimal : 0;
  const formattedGrossHours = principalDuration.isValid ? principalDuration.formatted : '0h 0m';

  // 2. Calculate Total Lost Hours
  const totalLostHours = useMemo(() => {
    const sum = lostTimeEntries.reduce((acc, curr) => acc + curr.durationHours, 0);
    return Number(sum.toFixed(2));
  }, [lostTimeEntries]);

  const formattedLostHours = formatDecimalHours(totalLostHours);

  // 3. Calculate Net Billable Hours (Saldo Neto Resultante)
  const netHours = useMemo(() => {
    const net = grossHours - totalLostHours;
    return Number(Math.max(0, net).toFixed(2));
  }, [grossHours, totalLostHours]);

  const formattedNetHours = formatDecimalHours(netHours);

  // 4. Calculate Total to Charge (Dinámico: Saldo Neto × C$50)
  const totalToCharge = useMemo(() => {
    return Number((netHours * hourlyRate).toFixed(2));
  }, [netHours, hourlyRate]);

  // Selected client object
  const currentClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Handle client selection with custom rate auto-apply
  const handleClientChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    const target = clients.find((c) => c.id === newClientId);
    if (target && target.customHourlyRate && target.customHourlyRate > 0) {
      setHourlyRate(target.customHourlyRate);
    } else {
      setHourlyRate(settings.defaultHourlyRate || 50);
    }
  };

  // Helper to save current hourly rate as system global default
  const handleSetRateAsDefault = () => {
    const updated = { ...settings, defaultHourlyRate: hourlyRate };
    saveSettings(updated);
    setSettings(updated);
    setSaveSuccessMessage(`Tarifa C$ ${hourlyRate.toFixed(2)} establecida como valor predeterminado del sistema.`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Helper to save current hourly rate to selected client
  const handleSetRateForCurrentClient = () => {
    if (!currentClient) return;
    const updatedClient: Client = { ...currentClient, customHourlyRate: hourlyRate };
    const all = getClients().map((c) => (c.id === updatedClient.id ? updatedClient : c));
    localStorage.setItem('facturatime_clients', JSON.stringify(all));
    setClients(all);
    setSaveSuccessMessage(`Tarifa C$ ${hourlyRate.toFixed(2)} guardada para ${currentClient.name}.`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Handlers for lost hours
  const handleAddLostTime = (entry: Omit<LostTimeEntry, 'id'>) => {
    const newEntry: LostTimeEntry = {
      ...entry,
      id: `lost-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setLostTimeEntries((prev) => [...prev, newEntry]);
  };

  const handleRemoveLostTime = (id: string) => {
    setLostTimeEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Quick preset helper for Principal Times
  const setQuickShift = (hours: number) => {
    const start = new Date();
    start.setHours(7, 0, 0, 0);
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    setStartDateTimePrincipal(toDateTimeLocalString(start));
    setEndDateTimePrincipal(toDateTimeLocalString(end));
  };

  // Handle saving new client from modal
  const handleSaveNewClient = (newClientData: Omit<Client, 'id' | 'createdAt'>) => {
    const saved = saveClient(newClientData);
    setClients(getClients());
    setSelectedClientId(saved.id);
  };

  // Prepare current invoice object for preview or saving
  const buildCurrentInvoice = (): Omit<Invoice, 'id' | 'invoiceNumber' | 'consecutiveNumber' | 'createdAt'> | null => {
    if (!currentClient) return null;

    return {
      issueDate,
      clientId: currentClient.id,
      clientSnapshot: currentClient,
      startDateTimePrincipal,
      endDateTimePrincipal,
      grossHours,
      formattedGrossHours,
      lostTimeEntries,
      totalLostHours,
      formattedLostHours,
      netHours,
      formattedNetHours,
      hourlyRate,
      subtotal: totalToCharge,
      taxPercentage: 0,
      taxAmount: 0,
      total: totalToCharge,
      currency: settings.currencySymbol || 'C$',
      notes,
      serviceDescription,
      status: 'emitida',
    };
  };

  // Handle Save Invoice -> Increments consecutive for next invoice
  const handleSaveInvoice = () => {
    const invoiceData = buildCurrentInvoice();
    if (!invoiceData) {
      alert('Por favor seleccione o cree un cliente para la factura');
      return;
    }

    if (!principalDuration.isValid) {
      alert('La fecha final principal debe ser posterior a la fecha de inicio principal');
      return;
    }

    const savedInvoice = saveNewInvoice(invoiceData);

    // Refresh consecutive sequence
    const updatedSettings = getSettings();
    setSettings(updatedSettings);
    const next = getNextInvoiceNumber(updatedSettings);
    setNextSeq(next);

    setSaveSuccessMessage(
      `Factura ${savedInvoice.invoiceNumber} guardada exitosamente. La siguiente factura se ha configurado automáticamente como ${next.formatted}.`
    );

    if (onInvoiceSaved) {
      onInvoiceSaved(savedInvoice);
    }

    // Scroll to notification
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Open Preview Modal
  const handleOpenPreview = () => {
    const invoiceData = buildCurrentInvoice();
    if (!invoiceData) {
      alert('Por favor seleccione un cliente para generar la factura');
      return;
    }

    const dummyInvoice: Invoice = {
      ...invoiceData,
      id: 'preview',
      invoiceNumber: nextSeq.formatted,
      consecutiveNumber: nextSeq.consecutive,
      createdAt: new Date().toISOString(),
    };

    setPreviewInvoice(dummyInvoice);
    setIsPreviewOpen(true);
  };

  // Handle Direct Export PDF
  const handleExportPDF = () => {
    const invoiceData = buildCurrentInvoice();
    if (!invoiceData) {
      alert('Por favor seleccione o cree un cliente antes de exportar el PDF');
      return;
    }

    const exportInvoice: Invoice = {
      ...invoiceData,
      id: 'export',
      invoiceNumber: nextSeq.formatted,
      consecutiveNumber: nextSeq.consecutive,
      createdAt: new Date().toISOString(),
    };

    downloadInvoicePDF(exportInvoice, settings);
  };

  // Handle Upload current invoice to Google Drive
  const handleUploadCurrentToDrive = async () => {
    const invoiceData = buildCurrentInvoice();
    if (!invoiceData) {
      alert('Por favor seleccione o cree un cliente antes de subir a Google Drive');
      return;
    }

    const currentInv: Invoice = {
      ...invoiceData,
      id: 'upload',
      invoiceNumber: nextSeq.formatted,
      consecutiveNumber: nextSeq.consecutive,
      createdAt: new Date().toISOString(),
    };

    setIsUploadingDrive(true);
    setDriveUploadedLink(null);
    try {
      const file = await uploadInvoiceToDrive(currentInv, settings);
      setDriveUploadedLink({
        url: file.webViewLink || 'https://drive.google.com',
        name: file.name,
      });
      setSaveSuccessMessage(`Factura ${nextSeq.formatted} subida exitosamente a Google Drive en la carpeta "FacturaTime - Facturas".`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al subir a Google Drive. Asegúrese de autorizar su cuenta.');
    } finally {
      setIsUploadingDrive(false);
    }
  };

  // Reset form for a fresh invoice
  const handleResetForm = () => {
    setStartDateTimePrincipal(defaultStart);
    setEndDateTimePrincipal(defaultEnd);
    setLostTimeEntries([]);
    setHourlyRate(settings.defaultHourlyRate || 50);
    setNotes('');
    setSaveSuccessMessage('');
    setDriveUploadedLink(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Consecutive tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Generador de Factura por Cálculo de Horas
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 font-mono">
              {nextSeq.formatted}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cálculo dinámico de horas principales, deducción automática de tiempos perdidos y tarifa en córdobas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetForm}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>

          <button
            type="button"
            onClick={handleUploadCurrentToDrive}
            disabled={isUploadingDrive}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            title="Guardar archivo PDF directamente en su Google Drive"
          >
            <Cloud className={`w-3.5 h-3.5 ${isUploadingDrive ? 'animate-pulse' : ''}`} />
            <span>{isUploadingDrive ? 'Subiendo...' : 'Subir a Drive'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPreview}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Vista Previa</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveInvoice}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Factura ({nextSeq.formatted})</span>
          </button>
        </div>
      </div>

      {/* Success alert message after saving or Drive upload */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                ¡Operación exitosa!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">{saveSuccessMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {driveUploadedLink && (
              <a
                href={driveUploadedLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-200/60 hover:bg-emerald-200 px-2.5 py-1 rounded"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Abrir en Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={handleExportPDF}
              className="text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
            >
              Descargar PDF
            </button>
            <button
              onClick={() => setSaveSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-800 text-xs px-2 py-1"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column Inputs / Right Column Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Form Inputs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Client & Invoice Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Información del Cliente y Emisión
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nuevo Cliente</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Client Selector */}
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.identification ? `(${client.identification})` : ''} {client.customHourlyRate ? `· C$ ${client.customHourlyRate}/hr` : ''}
                    </option>
                  ))}
                </select>

                {currentClient && (
                  <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-0.5">
                    <p className="font-semibold text-slate-700">{currentClient.name}</p>
                    <p>RUC: {currentClient.identification || 'N/A'} · Tel: {currentClient.phone || 'N/A'}</p>
                    <p>{currentClient.address || 'Sin dirección registrada'}</p>
                  </div>
                )}
              </div>

              {/* Invoice Number & Date */}
              <div className="sm:col-span-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    N° Factura (Consecutivo)
                  </label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800">
                    {nextSeq.formatted}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Fecha de Inicio y Final Principal (Cálculo de Tiempo) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Fecha de Inicio y Final Principal
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Jornadas:</span>
                <button
                  type="button"
                  onClick={() => setQuickShift(8)}
                  className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  8 hrs
                </button>
                <button
                  type="button"
                  onClick={() => setQuickShift(10)}
                  className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  10 hrs
                </button>
                <button
                  type="button"
                  onClick={() => setQuickShift(12)}
                  className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  12 hrs
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha y Hora de Inicio Principal <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDateTimePrincipal}
                  onChange={(e) => setStartDateTimePrincipal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha y Hora Final Principal <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDateTimePrincipal}
                  onChange={(e) => setEndDateTimePrincipal(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Error if dates are inverted */}
            {!principalDuration.isValid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{principalDuration.error || 'La fecha final debe ser posterior a la fecha inicial'}</span>
              </div>
            )}

            {/* Calculated Principal Hours Display Card */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-600 block">
                    Horas Calculadas Principal (Tiempo Bruto)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
                      {formatGeneralNumber(grossHours)} hrs
                    </span>
                    <span className="text-xs text-indigo-600/80 font-medium">
                      ({formattedGrossHours})
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 italic max-w-xs sm:text-right">
                Tiempo calculado entre la fecha inicial y fecha final principal
              </span>
            </div>
          </div>

          {/* Card 3: Horas Perdidas (Component with Add button and table) */}
          <LostTimeSection
            entries={lostTimeEntries}
            onAddEntry={handleAddLostTime}
            onRemoveEntry={handleRemoveLostTime}
            principalStart={startDateTimePrincipal}
            principalEnd={endDateTimePrincipal}
          />

          {/* Card 4: Service description & terms */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-900 tracking-tight">
              Observaciones / Condiciones del Reporte de Facturación
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej. Se anexa hoja de control diario firmada en campo por el supervisor..."
              className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
            />
          </div>
        </div>

        {/* Right 4 cols: Sticky Financial Calculation & Net Hours Balance Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-20 space-y-6">
            {/* Calculation summary card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold tracking-tight">
                    Liquidación Dinámica
                  </h3>
                </div>
                <span className="text-xs text-indigo-300 font-mono font-semibold">
                  {settings.currencySymbol || 'C$'} 50.00 / hr
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* 1. Saldo Neto Resultante (Prominent Display Field requested) */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cálculo de Saldo Neto Resultante
                  </span>

                  <div className="space-y-2 text-xs">
                    {/* Gross */}
                    <div className="flex items-center justify-between text-slate-700">
                      <span>(+) Horas Principales:</span>
                      <span className="font-mono font-semibold tabular-nums text-slate-900">
                        {formatGeneralNumber(grossHours)} hrs
                      </span>
                    </div>

                    {/* Deductions */}
                    <div className="flex items-center justify-between text-red-600">
                      <span>(-) Horas Perdidas (Deducción):</span>
                      <span className="font-mono font-semibold tabular-nums">
                        -{formatGeneralNumber(totalLostHours)} hrs
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-2"></div>

                    {/* Calculated Net Field */}
                    <div className="flex items-center justify-between font-bold text-indigo-700 pt-0.5">
                      <span>(=) Saldo Neto Facturable:</span>
                      <span className="text-base font-mono tabular-nums">
                        {formatGeneralNumber(netHours)} hrs
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100 flex items-center justify-between">
                    <span>Equivalente:</span>
                    <span className="font-semibold text-slate-700">{formattedNetHours} netas</span>
                  </div>
                </div>

                {/* 2. Tarifa Dinámica por Hora (Personalizable, por defecto C$50) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Configurar Tarifa por Hora (C$)</span>
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {hourlyRate === 50 ? 'Tarifa Predeterminada' : 'Tarifa Personalizada'}
                    </span>
                  </div>

                  {/* Quick Select Rate Chips */}
                  <div className="grid grid-cols-5 gap-1">
                    {[50, 60, 75, 100, 150].map((rateVal) => (
                      <button
                        key={rateVal}
                        type="button"
                        onClick={() => setHourlyRate(rateVal)}
                        className={`py-1 px-1.5 text-[11px] font-bold rounded border transition-colors ${
                          hourlyRate === rateVal
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        C${rateVal}
                      </button>
                    ))}
                  </div>

                  {/* Manual rate input */}
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                      {settings.currencySymbol || 'C$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                      placeholder="50.00"
                      className="w-full pl-10 pr-3 py-2 text-sm font-bold font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                    />
                  </div>

                  {/* Helper action links for rate persistence */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <button
                        type="button"
                        onClick={handleSetRateAsDefault}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                        title="Guardar como valor base para futuras facturas"
                      >
                        • Fijar C${hourlyRate.toFixed(2)} como predeterminada del sistema
                      </button>
                      {hourlyRate !== 50 && (
                        <button
                          type="button"
                          onClick={() => setHourlyRate(50)}
                          className="text-slate-400 hover:text-slate-600 underline"
                        >
                          Volver a C$50
                        </button>
                      )}
                    </div>

                    {currentClient && (
                      <div>
                        <button
                          type="button"
                          onClick={handleSetRateForCurrentClient}
                          className="text-slate-600 hover:text-indigo-600 font-medium hover:underline block truncate"
                          title={`Asignar C$${hourlyRate.toFixed(2)} como tarifa fija para ${currentClient.name}`}
                        >
                          • Asignar C${hourlyRate.toFixed(2)}/hr al cliente actual
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Breakdown of Dynamic Total */}
                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Fórmula aplicada:</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {formatGeneralNumber(netHours)} hrs × {formatCurrency(hourlyRate, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* 4. TOTAL A COBRAR (Large Highlight) */}
                <div className="bg-indigo-900 text-white rounded-xl p-5 space-y-1 shadow-md">
                  <span className="text-[11px] text-indigo-200 font-semibold uppercase tracking-wider block">
                    Total a Cobrar Dinámico
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                    {formatCurrency(totalToCharge, settings.currencySymbol)}
                  </div>
                  <p className="text-[11px] text-indigo-200/80 italic pt-1 leading-tight">
                    {numberToWordsCordobas(totalToCharge)}
                  </p>
                </div>

                {/* 5. Main Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveInvoice}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar y Generar Consecutivo</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Exportar PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadCurrentToDrive}
                      disabled={isUploadingDrive}
                      className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Cloud className={`w-3.5 h-3.5 ${isUploadingDrive ? 'animate-pulse' : ''}`} />
                      <span>{isUploadingDrive ? 'Subiendo...' : 'A Google Drive'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenPreview}
                    className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Vista Previa de Factura</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick helper box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs text-slate-500 space-y-2">
              <h4 className="font-bold text-slate-700">Flujo de Facturación Automática</h4>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Ingrese fecha y hora de inicio y final principal para obtener las horas brutas.</li>
                <li>Agregue los períodos de tiempos muertos en "Horas Perdidas" con el botón (+).</li>
                <li>El sistema resta automáticamente las horas perdidas para mostrar el saldo neto.</li>
                <li>Se multiplica por C$50 (o su tarifa personalizada) para calcular el total a cobrar.</li>
                <li>Al presionar "Guardar", se genera el número consecutivo y se avanza para la próxima factura.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveNewClient}
      />

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          invoice={previewInvoice}
          settings={settings}
        />
      )}
    </div>
  );
};

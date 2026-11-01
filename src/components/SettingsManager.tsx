import React, { useState, useEffect } from 'react';
import {
  Save,
  Building2,
  FileSpreadsheet,
  Coins,
  CheckCircle,
  Hash,
  RotateCcw,
} from 'lucide-react';
import { CompanySettings } from '../types/invoice';
import { getSettings, saveSettings } from '../services/storage';

export const SettingsManager: React.FC = () => {
  const [settings, setLocalSettings] = useState<CompanySettings>(getSettings());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(getSettings());
  }, []);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Configuración del Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalice los datos de su empresa, el correlativo consecutivo y la tarifa horaria por defecto.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Configuración guardada</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Consecutive Sequence & Pricing */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Hash className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Control de Consecutivo & Tarifa Horaria
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prefijo de Factura
              </label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                placeholder="FAC-"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Ejemplo: FAC-0001, FACT-0001
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Próximo Número Consecutivo
              </label>
              <input
                type="number"
                min="1"
                value={settings.nextConsecutive}
                onChange={(e) => handleChange('nextConsecutive', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Se incrementará automáticamente al guardar cada factura.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tarifa por Defecto (C$)
                </label>
                <span className="text-[11px] text-slate-400">Base: C$ 50.00</span>
              </div>
              <div className="relative mb-2">
                <Coins className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.defaultHourlyRate}
                  onChange={(e) => handleChange('defaultHourlyRate', parseFloat(e.target.value) || 50)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
              <div className="flex items-center gap-1">
                {[50, 60, 75, 100, 150].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleChange('defaultHourlyRate', rate)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      settings.defaultHourlyRate === rate
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    C${rate}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Company Details for PDF Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Datos del Emisor (Membrete de Facturas y PDF)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de la Empresa o Razón Social
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RUC / Identificación Fiscal
              </label>
              <input
                type="text"
                value={settings.ruc}
                onChange={(e) => handleChange('ruc', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfonos de Contacto
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico de Facturación
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ciudad y País
              </label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección Física
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Términos y Condiciones Predeterminados
              </label>
              <textarea
                rows={2}
                value={settings.terms}
                onChange={(e) => handleChange('terms', e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};

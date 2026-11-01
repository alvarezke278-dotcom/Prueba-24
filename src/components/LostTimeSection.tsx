import React, { useState } from 'react';
import { Plus, Trash2, Clock, AlertTriangle, Zap, Droplets, Mountain, Wrench } from 'lucide-react';
import { LostTimeEntry, STANDARD_LOST_TIME_REASONS } from '../types/invoice';
import { calculateDuration, toDateTimeLocalString } from '../utils/dateUtils';
import { formatGeneralNumber } from '../utils/currencyUtils';

interface LostTimeSectionProps {
  entries: LostTimeEntry[];
  onAddEntry: (entry: Omit<LostTimeEntry, 'id'>) => void;
  onRemoveEntry: (id: string) => void;
  principalStart: string;
  principalEnd: string;
}

const REASON_ICONS: Record<string, React.ReactNode> = {
  'Por Luz': <Zap className="w-3.5 h-3.5 text-amber-500" />,
  'Por Agua': <Droplets className="w-3.5 h-3.5 text-blue-500" />,
  'Por lama': <Mountain className="w-3.5 h-3.5 text-amber-700" />,
  'Grampon': <Wrench className="w-3.5 h-3.5 text-slate-700" />,
};

export const LostTimeSection: React.FC<LostTimeSectionProps> = ({
  entries,
  onAddEntry,
  onRemoveEntry,
  principalStart,
  principalEnd,
}) => {
  // Local state for the new entry form - default to "Por Luz"
  const [description, setDescription] = useState<string>('Por Luz');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [formError, setFormError] = useState('');

  // Calculate live duration for the entry being created
  const previewDuration = calculateDuration(startDateTime, endDateTime);

  // Set default initial dates within the principal window if empty
  const handleOpenAddForm = () => {
    if (!startDateTime && principalStart) {
      setStartDateTime(principalStart);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const selectedReason = isCustom ? customDescription.trim() : description;
    if (!selectedReason) {
      setFormError('Por favor seleccione o ingrese el motivo de la hora perdida');
      return;
    }

    if (!startDateTime || !endDateTime) {
      setFormError('Debe ingresar la fecha y hora de inicio y fin');
      return;
    }

    const duration = calculateDuration(startDateTime, endDateTime);
    if (!duration.isValid) {
      setFormError(duration.error || 'Rango de fechas inválido');
      return;
    }

    if (duration.hoursDecimal <= 0) {
      setFormError('La duración debe ser mayor a 0 minutos');
      return;
    }

    onAddEntry({
      description: selectedReason,
      startDateTime,
      endDateTime,
      durationHours: duration.hoursDecimal,
      formattedDuration: duration.formatted,
    });

    // Reset inputs but keep a standard reason selected
    setCustomDescription('');
    setIsCustom(false);
    setStartDateTime('');
    setEndDateTime('');
    setFormError('');
  };

  const totalLostHours = entries.reduce((acc, curr) => acc + curr.durationHours, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Horas Perdidas / Deducciones Operativas
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              (Se descuentan del total automáticamente)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Motivos disponibles: <strong>Por Luz</strong>, <strong>Por Agua</strong>, <strong>Por lama</strong>, <strong>Grampon</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Total Deducción</span>
            <span className="text-sm font-bold text-red-600 font-mono tabular-nums">
              -{formatGeneralNumber(totalLostHours)} hrs
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Entry creation box */}
        <form onSubmit={handleAdd} className="bg-slate-50 rounded-lg p-4 border border-slate-200/80 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Seleccione el Motivo de Hora Perdida:
              </span>
              <span className="text-[11px] text-slate-400">Haga clic en un motivo</span>
            </div>

            {/* 4 Primary Buttons for the 4 requested reasons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STANDARD_LOST_TIME_REASONS.map((reason) => {
                const isSelected = !isCustom && description === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setDescription(reason);
                      setIsCustom(false);
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-red-50 text-red-700 border-red-300 shadow-2xs ring-1 ring-red-400'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    {REASON_ICONS[reason]}
                    <span>{reason}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional Custom reason toggle */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className={`text-[11px] font-medium transition-colors ${
                  isCustom ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isCustom ? '✓ Usando motivo personalizado (clic para volver a estándar)' : '+ ¿Otro motivo específico?'}
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Escriba motivo personalizado..."
                className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                autoFocus
              />
            )}
          </div>

          {formError && (
            <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-200/60">
            {/* Start datetime */}
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha & Hora de Inicio del Paro
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>

            {/* End datetime */}
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha & Hora de Fin del Paro
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
              />
            </div>

            {/* Add Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full h-8 flex items-center justify-center gap-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                title="Agregar hora perdida"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add ({isCustom ? 'Personalizado' : description})</span>
              </button>
            </div>
          </div>

          {/* Live duration calculation preview */}
          {startDateTime && endDateTime && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tiempo calculado:</span>
                <span className={`font-mono font-semibold ${previewDuration.isValid ? 'text-red-600' : 'text-slate-400'}`}>
                  {previewDuration.isValid
                    ? `${previewDuration.hoursDecimal} hrs (${previewDuration.formatted}) [${isCustom ? customDescription : description}]`
                    : previewDuration.error || '0.00 hrs'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 italic">
                Presione el botón "Add" para descontar automáticamente
              </span>
            </div>
          )}
        </form>

        {/* List / Table of added lost hours */}
        {entries.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              No hay horas perdidas registradas
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
              Si ocurrieron tiempos muertos, lluvias, recesos o fallas técnicas, agréguelos con el botón superior para descontarlos automáticamente del total facturable.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Motivo / Justificación</th>
                  <th className="py-2.5 px-3">Inicio de Paro</th>
                  <th className="py-2.5 px-3">Fin de Paro</th>
                  <th className="py-2.5 px-3 text-right">Deducción</th>
                  <th className="py-2.5 px-3 w-10 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {entry.description}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {entry.startDateTime.replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {entry.endDateTime.replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 tabular-nums">
                      -{formatGeneralNumber(entry.durationHours)} hrs ({entry.formattedDuration})
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveEntry(entry.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Eliminar hora perdida"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="py-2 px-3 text-right">
                    Total Horas Perdidas a Descontar:
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-red-600 tabular-nums">
                    -{formatGeneralNumber(totalLostHours)} hrs
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

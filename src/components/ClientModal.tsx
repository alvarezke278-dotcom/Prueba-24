import React, { useState, useEffect } from 'react';
import { X, UserPlus, Building, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { Client } from '../types/invoice';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id' | 'createdAt'>) => void;
  initialData?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [customHourlyRate, setCustomHourlyRate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setIdentification(initialData.identification || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setCustomHourlyRate(initialData.customHourlyRate ? String(initialData.customHourlyRate) : '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setIdentification('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCustomHourlyRate('');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre o razón social del cliente es obligatorio');
      return;
    }

    const parsedRate = customHourlyRate ? parseFloat(customHourlyRate) : undefined;

    onSave({
      name: name.trim(),
      identification: identification.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      customHourlyRate: parsedRate && !isNaN(parsedRate) && parsedRate > 0 ? parsedRate : undefined,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {initialData ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
              </h2>
              <p className="text-xs text-slate-500">
                Información para facturación y reportes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre / Razón Social <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Constructora del Valle S.A."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RUC / Cédula / Identificación
              </label>
              <input
                type="text"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                placeholder="Ej. J0310000012345"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +505 8888-9999"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="facturacion@empresa.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dirección Física / Ubicación
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Km 7 Carretera Norte, Managua"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Tarifa por Hora Personalizada (C$)
              </label>
              <span className="text-[11px] text-slate-400">Opcional · Por defecto C$ 50.00</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                C$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customHourlyRate}
                onChange={(e) => setCustomHourlyRate(e.target.value)}
                placeholder="50.00"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-mono font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Si se especifica, esta tarifa se aplicará automáticamente al seleccionar este cliente en nuevas facturas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notas Adicionales (Opcional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Detalles sobre acuerdos de pago, condiciones de servicio..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

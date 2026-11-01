import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react';
import { Client } from '../types/invoice';
import { getClients, saveClient, updateClient, deleteClient, getInvoices } from '../services/storage';
import { ClientModal } from './ClientModal';

export const ClientsManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const loadData = () => {
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClick = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente "${client.name}"?`)) {
      deleteClient(client.id);
      loadData();
    }
  };

  const handleSaveClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    if (editingClient) {
      updateClient({
        ...editingClient,
        ...clientData,
      });
    } else {
      saveClient(clientData);
    }
    loadData();
  };

  const invoices = getInvoices();

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.identification && c.identification.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestione sus clientes, datos de facturación, RUC y contactos para generar facturas rápidamente.
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Cliente</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nombre, RUC, teléfono o correo..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
          {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
        </span>
      </div>

      {/* Grid of Clients */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">
            {searchTerm ? 'No se encontraron clientes' : 'Aún no tiene clientes registrados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Registre nuevos clientes para seleccionarlos al emitir facturas y reportes en PDF.
          </p>
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            Registrar Primer Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const clientInvoicesCount = invoices.filter((i) => i.clientId === client.id).length;

            return (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {client.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                          RUC: {client.identification || 'No registrado'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEditClick(client)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(client)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-100">
                      {client.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    {client.customHourlyRate ? (
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">
                        Tarifa: C$ {client.customHourlyRate.toFixed(2)}/hr
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        Tarifa: Estándar (C$ 50/hr)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-medium">Facturas:</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {clientInvoicesCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for creating/editing */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        initialData={editingClient}
      />
    </div>
  );
};

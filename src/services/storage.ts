import { Client, Invoice, CompanySettings } from '../types/invoice';

const STORAGE_KEYS = {
  CLIENTS: 'facturatime_clients',
  INVOICES: 'facturatime_invoices',
  SETTINGS: 'facturatime_settings',
};

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'SERVICIOS INDUSTRIALES Y LOGÍSTICA',
  ruc: 'J0310000123456',
  phone: '+505 2278-4500 / 8888-1234',
  email: 'facturacion@servicioslogistica.ni',
  address: 'Km 6.5 Carretera a Masaya, Edificio Centroamérica, Piso 3',
  city: 'Managua, Nicaragua',
  defaultHourlyRate: 50, // C$ 50 por hora
  currencySymbol: 'C$',
  invoicePrefix: 'FAC-',
  nextConsecutive: 1,
  defaultTaxPercentage: 0,
  terms: 'Factura pagadera al recibo de conformidad. Tarifas calculadas sobre horas netas operativas descontando tiempos muertos no atribuibles.',
};

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Constructora Central de Nicaragua S.A.',
    identification: 'J0310000098765',
    phone: '+505 2255-8900',
    email: 'compras@constructoracentral.com.ni',
    address: 'Pista Suburbana, Rotonda Universitaria 400m al Sur, Managua',
    notes: 'Cliente corporativo. Facturación por turnos y alquiler de maquinaria con operador.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cli-2',
    name: 'Agropecuaria Las Praderas',
    identification: 'J0310000045612',
    phone: '+505 8899-7722',
    email: 'administracion@laspraderas.com.ni',
    address: 'Carretera Panamericana Norte Km 45, Tipitapa',
    notes: 'Cálculo de jornadas con descuento estricto de horas por lluvias o mantenimiento.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cli-3',
    name: 'Soluciones Logísticas del Pacífico',
    identification: 'J0310000078123',
    phone: '+505 2311-4567',
    email: 'operaciones@solucionespacifico.ni',
    address: 'Zona Franca Las Mercedes, Módulo 14, Managua',
    notes: 'Servicios de montacargas y transporte operativo.',
    createdAt: new Date().toISOString(),
  },
];

export function getSettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: CompanySettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getNextInvoiceNumber(settings?: CompanySettings): { formatted: string; consecutive: number } {
  const currentSettings = settings || getSettings();
  const consecutive = currentSettings.nextConsecutive || 1;
  const padded = String(consecutive).padStart(4, '0');
  const prefix = currentSettings.invoicePrefix || 'FAC-';
  return {
    formatted: `${prefix}${padded}`,
    consecutive,
  };
}

export function getClients(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CLIENTS;
  } catch {
    return INITIAL_CLIENTS;
  }
}

export function saveClient(client: Omit<Client, 'id' | 'createdAt'>): Client {
  const clients = getClients();
  const newClient: Client = {
    ...client,
    id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString(),
  };
  clients.unshift(newClient);
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  return newClient;
}

export function updateClient(updatedClient: Client): void {
  const clients = getClients();
  const index = clients.findIndex((c) => c.id === updatedClient.id);
  if (index !== -1) {
    clients[index] = updatedClient;
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }
}

export function deleteClient(id: string): void {
  const clients = getClients().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
}

export function getInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new invoice and automatically increments the consecutive counter
 * for the NEXT invoice as requested by user.
 */
export function saveNewInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'consecutiveNumber' | 'createdAt'>): Invoice {
  const settings = getSettings();
  const { formatted, consecutive } = getNextInvoiceNumber(settings);

  const newInvoice: Invoice = {
    ...invoiceData,
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    invoiceNumber: formatted,
    consecutiveNumber: consecutive,
    createdAt: new Date().toISOString(),
  };

  const invoices = getInvoices();
  invoices.unshift(newInvoice);
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

  // Advance consecutive for the NEXT invoice
  saveSettings({
    ...settings,
    nextConsecutive: consecutive + 1,
  });

  return newInvoice;
}

export function updateInvoice(updatedInvoice: Invoice): void {
  const invoices = getInvoices();
  const index = invoices.findIndex((i) => i.id === updatedInvoice.id);
  if (index !== -1) {
    invoices[index] = updatedInvoice;
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
}

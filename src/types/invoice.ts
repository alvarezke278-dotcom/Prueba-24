export interface Client {
  id: string;
  name: string;
  identification: string; // RUC, Cédula o NIT
  phone: string;
  email: string;
  address: string;
  customHourlyRate?: number; // Tarifa personalizada por hora para este cliente (ej. C$50, C$60...)
  notes?: string;
  createdAt: string;
}

export const STANDARD_LOST_TIME_REASONS = [
  'Por Luz',
  'Por Agua',
  'Por lama',
  'Grampon',
] as const;

export type StandardLostReason = (typeof STANDARD_LOST_TIME_REASONS)[number];

export interface LostTimeEntry {
  id: string;
  description: string;
  startDateTime: string; // YYYY-MM-DDTHH:mm
  endDateTime: string;   // YYYY-MM-DDTHH:mm
  durationHours: number; // decimal hours (e.g. 1.50)
  formattedDuration: string; // "1h 30m"
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "FAC-0001"
  consecutiveNumber: number;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string;
  clientId: string;
  clientSnapshot: Client;
  
  // Principal Time Range
  startDateTimePrincipal: string; // Fecha de inicio principal
  endDateTimePrincipal: string;   // Fecha final principal
  grossHours: number;             // Horas calculadas principal (número general)
  formattedGrossHours: string;     // e.g. "8h 30m"
  
  // Lost Hours (Horas Perdidas)
  lostTimeEntries: LostTimeEntry[];
  totalLostHours: number;         // Total horas perdidas (número general)
  formattedLostHours: string;
  
  // Net Billable Hours
  netHours: number;               // Saldo neto resultante (grossHours - totalLostHours)
  formattedNetHours: string;
  
  // Pricing & Totals
  hourlyRate: number;             // Tarifa por hora (Default C$50)
  subtotal: number;               // netHours * hourlyRate
  taxPercentage: number;          // e.g. 0% or 15%
  taxAmount: number;
  total: number;                  // Total a cobrar
  currency: string;               // "C$"
  
  notes?: string;
  serviceDescription?: string;
  status: 'emitida' | 'borrador' | 'pagada' | 'anulada';
  createdAt: string;
}

export interface CompanySettings {
  companyName: string;
  ruc: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  defaultHourlyRate: number; // 50
  currencySymbol: string;    // "C$"
  invoicePrefix: string;     // "FAC-"
  nextConsecutive: number;   // Correlativo actual
  defaultTaxPercentage: number;
  terms: string;
}

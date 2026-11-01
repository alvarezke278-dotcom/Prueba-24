/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceHistory } from './components/InvoiceHistory';
import { ClientsManager } from './components/ClientsManager';
import { SettingsManager } from './components/SettingsManager';
import { GoogleDrivePanel } from './components/GoogleDrivePanel';
import { getSettings, getNextInvoiceNumber } from './services/storage';
import { Invoice } from './types/invoice';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'nueva' | 'historial' | 'clientes' | 'configuracion' | 'drive'>('nueva');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<string>('FAC-0001');

  const updateConsecutiveDisplay = () => {
    const settings = getSettings();
    const next = getNextInvoiceNumber(settings);
    setNextInvoiceNumber(next.formatted);
  };

  useEffect(() => {
    updateConsecutiveDisplay();
  }, [currentTab]);

  const handleInvoiceSaved = (newInvoice: Invoice) => {
    updateConsecutiveDisplay();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        nextInvoiceNumber={nextInvoiceNumber}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'nueva' && (
          <InvoiceForm
            onInvoiceSaved={handleInvoiceSaved}
            onViewHistory={() => setCurrentTab('historial')}
          />
        )}

        {currentTab === 'historial' && (
          <InvoiceHistory
            onCreateNew={() => setCurrentTab('nueva')}
          />
        )}

        {currentTab === 'clientes' && <ClientsManager />}

        {currentTab === 'drive' && (
          <GoogleDrivePanel
            onGoToInvoices={() => setCurrentTab('nueva')}
          />
        )}

        {currentTab === 'configuracion' && <SettingsManager />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} FacturaTime · Sistema de Facturación y Control de Tiempos</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Cálculo Dinámico C$50/hr</span>
            <span>·</span>
            <span>Deducción de Horas Perdidas</span>
            <span>·</span>
            <span>Correlativo Consecutivo</span>
            <span>·</span>
            <span>Reportes PDF</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

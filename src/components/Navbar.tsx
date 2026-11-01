import React from 'react';
import { PlusCircle, FileText, Users, History, Settings } from 'lucide-react';

interface NavbarProps {
  currentTab: 'nueva' | 'historial' | 'clientes' | 'configuracion' | 'drive';
  onSelectTab: (tab: 'nueva' | 'historial' | 'clientes' | 'configuracion' | 'drive') => void;
  nextInvoiceNumber: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, nextInvoiceNumber }) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('nueva')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tighter">
              FT
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                FacturaTime
              </span>
              <span className="text-[11px] text-slate-500 font-medium block -mt-0.5">
                Control de Horas & Facturación
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => onSelectTab('nueva')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'nueva'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Factura</span>
          </button>

          <button
            onClick={() => onSelectTab('historial')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'historial'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial</span>
          </button>

          <button
            onClick={() => onSelectTab('clientes')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'clientes'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </button>

          <button
            onClick={() => onSelectTab('drive')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'drive'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Google Drive & APK</span>
          </button>

          <button
            onClick={() => onSelectTab('configuracion')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'configuracion'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] text-slate-400 font-medium">Siguiente Consecutivo</span>
            <span className="font-mono text-xs font-semibold text-indigo-600 tabular-nums">
              {nextInvoiceNumber}
            </span>
          </div>

          <button
            onClick={() => onSelectTab('nueva')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Crear Factura</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-slate-50 text-xs font-medium">
        <button
          onClick={() => onSelectTab('nueva')}
          className={`px-2 py-1.5 rounded ${currentTab === 'nueva' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}
        >
          Nueva
        </button>
        <button
          onClick={() => onSelectTab('historial')}
          className={`px-2 py-1.5 rounded ${currentTab === 'historial' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}
        >
          Historial
        </button>
        <button
          onClick={() => onSelectTab('clientes')}
          className={`px-2 py-1.5 rounded ${currentTab === 'clientes' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}
        >
          Clientes
        </button>
        <button
          onClick={() => onSelectTab('drive')}
          className={`px-2 py-1.5 rounded ${currentTab === 'drive' ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}
        >
          Drive / APK
        </button>
        <button
          onClick={() => onSelectTab('configuracion')}
          className={`px-2 py-1.5 rounded ${currentTab === 'configuracion' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}
        >
          Ajustes
        </button>
      </div>
    </header>
  );
};

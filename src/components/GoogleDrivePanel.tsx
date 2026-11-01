import React, { useState, useEffect } from 'react';
import {
  Cloud,
  ExternalLink,
  Trash2,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Smartphone,
  Download,
  FolderOpen,
  Info,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, googleLogout, getCurrentUser, initAuth } from '../services/googleAuth';
import {
  listDriveInvoices,
  deleteDriveFile,
  uploadBackupToDrive,
  DriveFileItem,
} from '../services/googleDrive';
import { getInvoices, getClients, getSettings } from '../services/storage';

interface GoogleDrivePanelProps {
  onGoToInvoices?: () => void;
}

export const GoogleDrivePanel: React.FC<GoogleDrivePanelProps> = ({ onGoToInvoices }) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'drive' | 'apk'>('drive');

  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser) => {
        setUser(authenticatedUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      const files = await listDriveInvoices();
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al conectar con Google Drive. Verifique sus permisos.',
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    } else {
      setDriveFiles([]);
    }
  }, [user]);

  const handleLogin = async () => {
    setIsLoadingAuth(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setStatusMessage({
          type: 'success',
          text: `Conectado exitosamente con Google Drive como ${res.user.email}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'No se pudo iniciar sesión con Google. Intente nuevamente.',
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setUser(null);
    setDriveFiles([]);
    setStatusMessage({ type: 'success', text: 'Sesión de Google cerrada.' });
  };

  const handleDeleteFile = async (file: DriveFileItem) => {
    try {
      const deleted = await deleteDriveFile(file.id, file.name);
      if (deleted) {
        setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
        setStatusMessage({
          type: 'success',
          text: `Archivo "${file.name}" eliminado de Google Drive.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'No se pudo eliminar el archivo.',
      });
    }
  };

  const handleBackupAllToDrive = async () => {
    setStatusMessage(null);
    try {
      const fullData = {
        invoices: getInvoices(),
        clients: getClients(),
        settings: getSettings(),
        exportedAt: new Date().toISOString(),
      };
      await uploadBackupToDrive(JSON.stringify(fullData, null, 2));
      setStatusMessage({
        type: 'success',
        text: 'Respaldo completo de base de datos sincronizado en Google Drive con éxito.',
      });
      fetchFiles();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al sincronizar respaldo en Google Drive.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Integración Google Drive & Descarga APK
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Guarde sus facturas y respaldos en la nube de Google Drive e instale la app en su teléfono Android.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'drive' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Google Drive
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'apk' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Descargar APK / Android</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs underline hover:no-underline font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {activeTab === 'drive' && (
        <div className="space-y-6">
          {/* Connection Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuario'}
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {(user.email || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {user.displayName || 'Cuenta de Google Conectada'}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        Conectado
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{user.email}</span>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Conectar cuenta de Google Drive
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Permite subir y sincronizar facturas PDF directamente en su carpeta de Google Drive.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <button
                    onClick={handleBackupAllToDrive}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Sincronizar Respaldo a Drive</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    Desconectar
                  </button>
                </>
              ) : (
                /* Official Sign in with Google Button as required by guidelines */
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoadingAuth}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 shadow-xs transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoadingAuth ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Drive Files List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Carpeta en Google Drive: <span className="font-mono text-indigo-700">FacturaTime - Facturas</span>
                </h3>
              </div>

              {user && (
                <button
                  onClick={fetchFiles}
                  disabled={isLoadingFiles}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 p-1 rounded"
                  title="Actualizar lista de archivos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              )}
            </div>

            {!user ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Cloud className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">Conecte su cuenta de Google</h4>
                <p className="text-xs max-w-md mx-auto text-slate-400">
                  Inicie sesión con el botón superior para ver, respaldar y administrar las facturas alojadas en su unidad de Google Drive.
                </p>
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Conectar Ahora
                </button>
              </div>
            ) : isLoadingFiles ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs">Cargando archivos desde Google Drive...</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No hay facturas en su carpeta de Google Drive aún</h4>
                <p className="text-xs max-w-md mx-auto text-slate-400">
                  Al emitir o visualizar una factura, presione el botón <strong>"Subir a Google Drive"</strong> para guardarla en la nube con un solo clic.
                </p>
                {onGoToInvoices && (
                  <button
                    onClick={onGoToInvoices}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Ir a Facturar
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nombre de Archivo</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Fecha de Subida</th>
                      <th className="py-3 px-4">Tamaño</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driveFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="truncate max-w-xs">{file.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {file.mimeType === 'application/pdf' ? 'PDF' : 'JSON'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {file.createdTime
                            ? new Date(file.createdTime).toLocaleString('es-NI', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition-colors"
                              >
                                <span>Abrir en Drive</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar de Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* APK & Mobile Installation Guide Tab */}
      {activeTab === 'apk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  ¿Cómo instalar y usar esta aplicación en Android (APK / PWA)?
                </h2>
                <p className="text-xs text-slate-500">
                  FacturaTime está optimizada como Progressive Web App (PWA) para funcionar con ícono e interfaz de app nativa en su teléfono Android.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option 1: PWA Install (Recommended, 10 seconds) */}
              <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Opción 1: Instalación Directa en Android (Recomendada)
                  </span>
                  <span className="text-[11px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Sin instalar nada extra
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  No necesita descargar un archivo APK riesgoso ni activar orígenes desconocidos. Android permite instalar la aplicación directamente desde Chrome:
                </p>

                <ol className="list-decimal pl-4 text-xs text-slate-700 space-y-2 font-medium">
                  <li>
                    Abra el enlace compartido de la app en <strong>Google Chrome</strong> en su teléfono Android.
                  </li>
                  <li>
                    Toque el menú de los <strong>3 puntos (⋮)</strong> en la esquina superior derecha de Chrome.
                  </li>
                  <li>
                    Seleccione <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                  </li>
                  <li>
                    ¡Listo! La aplicación se instalará como un ícono en su pantalla de inicio y se abrirá en pantalla completa sin barra de navegador, funcionando como una app nativa.
                  </li>
                </ol>

                <div className="pt-2">
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      Guarda datos en la memoria de su teléfono y permite conectarse a su Google Drive para respaldos automáticos.
                    </span>
                  </div>
                </div>
              </div>

              {/* Option 2: Standalone APK Packaging */}
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Opción 2: Generar APK Nativo (.apk)
                </span>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Si necesita un archivo <strong>.apk</strong> o <strong>.aab</strong> para distribuirlo o publicarlo en Google Play Store:
                </p>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">Con Capacitor (Android Studio):</p>
                    <code className="text-[11px] font-mono text-indigo-700 block mt-1">
                      npm install @capacitor/core @capacitor/cli @capacitor/android<br />
                      npx cap init FacturaTime com.facturatime.app<br />
                      npm run build && npx cap add android && npx cap open android
                    </code>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-800">Con Google Bubblewrap (TWA):</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Herramienta oficial de Google para empaquetar este sitio web en un APK instalable en 1 comando:
                    </p>
                    <code className="text-[11px] font-mono text-indigo-700 block mt-1">
                      npx @bubblewrap/cli init --manifest=URL_DE_ESTA_APP
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

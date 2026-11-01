import { getAccessToken, googleSignIn } from './googleAuth';
import { Invoice, CompanySettings } from '../types/invoice';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
}

const FOLDER_NAME = 'FacturaTime - Facturas';

/**
 * Ensures an active access token is available; if not, triggers sign-in
 */
async function ensureAccessToken(): Promise<string> {
  let token = await getAccessToken();
  if (!token) {
    const signinResult = await googleSignIn();
    if (!signinResult?.accessToken) {
      throw new Error('Debe iniciar sesión con Google para acceder a Google Drive');
    }
    token = signinResult.accessToken;
  }
  return token;
}

/**
 * Searches for or creates the application folder in Google Drive
 */
export async function getOrCreateDriveFolder(): Promise<string> {
  const token = await ensureAccessToken();

  // 1. Search for existing folder
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!searchRes.ok) {
    throw new Error('Error al buscar carpeta en Google Drive');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Create the folder if it doesn't exist
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Facturas generadas y respaldadas desde FacturaTime',
    }),
  });

  if (!createRes.ok) {
    throw new Error('No se pudo crear la carpeta en Google Drive');
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Uploads an invoice PDF directly to Google Drive
 */
export async function uploadInvoiceToDrive(
  invoice: Invoice,
  settings?: CompanySettings
): Promise<DriveFileItem> {
  const token = await ensureAccessToken();
  const folderId = await getOrCreateDriveFolder();

  // Generate PDF as blob
  const doc = generateInvoicePDF(invoice, settings);
  const pdfBlob = doc.output('blob');

  const sanitizedClient = (invoice.clientSnapshot.name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filename = `${invoice.invoiceNumber}_${sanitizedClient}.pdf`;

  // Prepare multipart upload
  const metadata = {
    name: filename,
    mimeType: 'application/pdf',
    parents: [folderId],
    description: `Factura ${invoice.invoiceNumber} para ${invoice.clientSnapshot.name} generada el ${invoice.issueDate}.`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: application/pdf\r\n\r\n`;

  const blobParts = [
    metadataPart,
    mediaHeader,
    pdfBlob,
    closeDelimiter,
  ];

  const multipartBody = new Blob(blobParts, { type: `multipart/related; boundary=${boundary}` });

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('Error al subir PDF a Drive:', errorText);
    throw new Error('Error al subir la factura a Google Drive');
  }

  const fileItem = await uploadRes.json();
  return fileItem;
}

/**
 * Uploads database JSON backup to Google Drive
 */
export async function uploadBackupToDrive(jsonData: string): Promise<DriveFileItem> {
  const token = await ensureAccessToken();
  const folderId = await getOrCreateDriveFolder();

  const filename = `respaldo_facturatime_${new Date().toISOString().slice(0, 10)}.json`;

  const metadata = {
    name: filename,
    mimeType: 'application/json',
    parents: [folderId],
    description: 'Respaldo completo de clientes, facturas y configuración de FacturaTime',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const jsonBlob = new Blob([jsonData], { type: 'application/json' });
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const mediaHeader = `${delimiter}Content-Type: application/json\r\n\r\n`;

  const multipartBody = new Blob([metadataPart, mediaHeader, jsonBlob, closeDelimiter], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime,size',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    throw new Error('Error al respaldar base de datos en Google Drive');
  }

  return await uploadRes.json();
}

/**
 * Lists all invoice files saved in the FacturaTime Drive folder
 */
export async function listDriveInvoices(): Promise<DriveFileItem[]> {
  const token = await ensureAccessToken();
  const folderId = await getOrCreateDriveFolder();

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,mimeType,webViewLink,webContentLink,createdTime,size)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error('Error al listar archivos de Google Drive');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Deletes a file from Google Drive with mandatory user confirmation
 */
export async function deleteDriveFile(fileId: string, fileName: string): Promise<boolean> {
  const confirmed = window.confirm(
    `¿Está seguro de que desea eliminar permanentemente el archivo "${fileName}" de su Google Drive? Esta acción no se puede deshacer.`
  );
  if (!confirmed) return false;

  const token = await ensureAccessToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar el archivo de Google Drive');
  }

  return true;
}

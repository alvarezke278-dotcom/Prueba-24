/**
 * Currency utilities for Nicaraguan Córdobas (C$) and numeric formatting
 */

export function formatCurrency(amount: number, symbol: string = 'C$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol} 0.00`;
  }
  
  const formattedNumber = new Intl.NumberFormat('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol} ${formattedNumber}`;
}

export function formatGeneralNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0.00';
  }
  return value.toLocaleString('es-NI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Converts numeric amount to Spanish text for formal invoice footer
 * e.g., 425 -> "Cuatrocientos veinticinco córdobas netos"
 */
export function numberToWordsCordobas(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Cero córdobas con 00/100';

  const enteros = Math.floor(Math.abs(amount));
  const centavos = Math.round((Math.abs(amount) - enteros) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales: Record<number, string> = {
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
    21: 'veintiuno', 22: 'veintidós', 23: 'veintitrés', 24: 'veinticuatro',
    25: 'veinticinco', 26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve',
  };
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  function convertirGrupo(n: number): string {
    let output = '';
    if (n === 100) return 'cien';

    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const du = n % 100;

    if (c > 0) output += centenas[c] + ' ';

    if (especiales[du]) {
      output += especiales[du] + ' ';
    } else {
      if (d > 0) {
        output += decenas[d];
        if (u > 0) output += ' y ' + unidades[u] + ' ';
        else output += ' ';
      } else if (u > 0) {
        output += unidades[u] + ' ';
      }
    }
    return output.trim();
  }

  let letras = '';
  if (enteros >= 1000000) {
    const millones = Math.floor(enteros / 1000000);
    letras += (millones === 1 ? 'un millón ' : convertirGrupo(millones) + ' millones ');
  }

  const miles = Math.floor((enteros % 1000000) / 1000);
  if (miles > 0) {
    letras += (miles === 1 ? 'mil ' : convertirGrupo(miles) + ' mil ');
  }

  const resto = enteros % 1000;
  if (resto > 0 || enteros === 0) {
    letras += convertirGrupo(resto) + ' ';
  }

  letras = letras.trim();
  if (!letras) letras = 'cero';

  return `${letras.charAt(0).toUpperCase() + letras.slice(1)} córdobas con ${centavosStr}/100`;
}

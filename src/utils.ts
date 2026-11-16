/** Convierte dólares a centavos enteros para evitar errores de coma flotante. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Formatea centavos como "$1.25". */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Formatea dólares como "$1.25". */
export function money(amount: number): string {
  return formatCents(toCents(amount));
}

/** Minúsculas y sin tildes, para que "limon" encuentre "Limón". */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function newId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}`;
}

/** Fecha local en formato YYYY-MM-DD (para <input type="date">). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Inicio y fin (exclusivo) en milisegundos del día local indicado como YYYY-MM-DD. */
export function dayRange(dateValue: string): { from: number; to: number } {
  const [y, m, d] = dateValue.split('-').map(Number);
  const from = new Date(y, m - 1, d).getTime();
  const to = new Date(y, m - 1, d + 1).getTime();
  return { from, to };
}

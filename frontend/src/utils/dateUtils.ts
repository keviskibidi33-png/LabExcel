/**
 * Utilidades para manejo de fechas
 */

/**
 * Formatear fecha a DD/MM/YYYY
 */
export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formatear hora a HH:MM
 */
export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Obtener fecha actual formateada
 */
export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

/**
 * Obtener hora actual formateada
 */
export const getCurrentTime = (): string => {
  return formatTime(new Date());
};

/**
 * Validar si una fecha es válida
 */
export const isValidDate = (dateString: string): boolean => {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
};

/**
 * Validar si una hora es válida
 */
export const isValidTime = (timeString: string): boolean => {
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(timeString)) return false;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

/**
 * Convertir fecha DD/MM/YYYY a objeto Date
 */
export const parseDate = (dateString: string): Date | null => {
  if (!isValidDate(dateString)) return null;
  
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Convertir hora HH:MM a objeto Date (usando fecha actual)
 */
export const parseTime = (timeString: string): Date | null => {
  if (!isValidTime(timeString)) return null;
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
};

/**
 * Calcular días entre dos fechas
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Agregar días a una fecha
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Obtener fecha de vencimiento (agregando días a fecha actual)
 */
export const getExpirationDate = (days: number): string => {
  const expirationDate = addDays(new Date(), days);
  return formatDate(expirationDate);
};

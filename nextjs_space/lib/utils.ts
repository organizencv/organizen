import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Converte uma string de data (YYYY-MM-DD) em um objeto Date
 * sem problemas de timezone.
 * 
 * Adiciona "T12:00:00" à string para garantir que a data seja
 * interpretada no meio do dia, evitando que ajustes de timezone
 * façam a data retroceder um dia.
 * 
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Date object ou null se a string for vazia
 */
export function parseDateWithoutTimezone(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  // Se a string já contém hora, retorna como está
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Adiciona hora do meio-dia para evitar problemas de timezone
  return new Date(`${dateString}T12:00:00`);
}
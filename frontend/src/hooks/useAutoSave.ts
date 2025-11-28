import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface AutoSaveOptions<T> {
  storageKey: string;
  data: T;
  enabled?: boolean;
  debounceMs?: number;
  onSave?: (data: T) => void;
  onLoad?: (data: T) => void;
}

export function useAutoSave<T>({
  storageKey,
  data,
  enabled = true,
  debounceMs = 1000,
  onSave,
  onLoad
}: AutoSaveOptions<T>) {
  const [hasLoaded, setHasLoaded] = useState(false);

  // Cargar datos guardados al montar
  useEffect(() => {
    if (!enabled || hasLoaded) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar que no sea muy antiguo (más de 7 días)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          if (onLoad) {
            onLoad(parsed.data);
            toast.success('Se encontró un borrador guardado. Se ha restaurado automáticamente.', {
              duration: 3000,
              icon: '💾'
            });
          }
        } else {
          // Borrar datos antiguos
          localStorage.removeItem(storageKey);
        }
      }
      setHasLoaded(true);
    } catch (error) {
      console.warn('Error cargando datos guardados:', error);
      setHasLoaded(true);
    }
  }, [storageKey, enabled, hasLoaded, onLoad]);

  // Auto-guardar cuando cambien los datos
  useEffect(() => {
    if (!enabled || !hasLoaded) return;

    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        if (onSave) {
          onSave(data);
        }
      } catch (error) {
        console.warn('Error guardando borrador:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, storageKey, enabled, hasLoaded, debounceMs, onSave]);

  // Función para limpiar el borrador
  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Error limpiando borrador:', error);
    }
  };

  return { clearDraft };
}

// Utilidad para obtener todos los borradores guardados
export function getAllDrafts(): Array<{ key: string; data: any; timestamp: number; type: string }> {
  const drafts: Array<{ key: string; data: any; timestamp: number; type: string }> = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('-form-draft') || key.includes('-form-'))) {
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
              // Determinar el tipo de formulario
              let type = 'Desconocido';
              if (key.includes('orden-form')) type = 'Recepción';
              else if (key.includes('ot-form')) type = 'Orden de Trabajo';
              else if (key.includes('control-form')) type = 'Control de Concreto';
              else if (key.includes('verificacion-form')) type = 'Verificación de Muestras';
              
              drafts.push({
                key,
                data: parsed.data,
                timestamp: parsed.timestamp,
                type
              });
            }
          }
        } catch (error) {
          console.warn(`Error parseando borrador ${key}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn('Error obteniendo borradores:', error);
  }
  
  return drafts.sort((a, b) => b.timestamp - a.timestamp);
}

// Utilidad para cargar un borrador específico
export function loadDraft(key: string): any | null {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.data;
    }
  } catch (error) {
    console.warn('Error cargando borrador:', error);
  }
  return null;
}

// Utilidad para eliminar un borrador
export function deleteDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Error eliminando borrador:', error);
  }
}


import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface AutoSaveDBOptions<T> {
  data: T;
  enabled?: boolean;
  debounceMs?: number;
  onSave: (data: T) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useAutoSaveDB<T>({
  data,
  enabled = true,
  debounceMs = 2000,
  onSave,
  onError
}: AutoSaveDBOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T | null>(null);
  const isInitialMount = useRef(true);
  const skipNextSaveRef = useRef(false);

  // Función para actualizar el estado de referencia (útil cuando se cargan datos iniciales)
  const updateReference = (newData: T) => {
    previousDataRef.current = newData;
    isInitialMount.current = false;
  };

  // Comparar datos para detectar cambios
  useEffect(() => {
    if (isInitialMount.current) {
      previousDataRef.current = data;
      isInitialMount.current = false;
      return;
    }

    if (!enabled) return;
    
    // Si se debe saltar el siguiente guardado (por ejemplo, después de cargar datos iniciales)
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      previousDataRef.current = data;
      return;
    }

    // Comparar si hay cambios (comparación simple de JSON)
    const hasChanges = JSON.stringify(previousDataRef.current) !== JSON.stringify(data);
    
    if (hasChanges) {
      setHasUnsavedChanges(true);
      
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Crear nuevo timeout para guardar
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onSave(data);
          previousDataRef.current = data;
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          // Mostrar notificación discreta
          toast.success('Cambios guardados automáticamente', {
            duration: 2000,
            icon: '💾',
            position: 'bottom-right'
          });
        } catch (error: any) {
          console.error('Error guardando automáticamente:', error);
          if (onError) {
            onError(error);
          } else {
            toast.error('Error al guardar cambios', {
              duration: 3000,
              position: 'bottom-right'
            });
          }
        } finally {
          setIsSaving(false);
        }
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debounceMs, onSave, onError]);

  // Función para guardar manualmente
  const saveNow = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsSaving(true);
    try {
      await onSave(data);
      previousDataRef.current = data;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Cambios guardados', {
        duration: 2000,
        icon: '💾',
        position: 'bottom-right'
      });
    } catch (error: any) {
      console.error('Error guardando:', error);
      if (onError) {
        onError(error);
      } else {
        toast.error('Error al guardar cambios', {
          duration: 3000,
          position: 'bottom-right'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    updateReference,
    skipNextSave: () => { skipNextSaveRef.current = true; }
  };
}


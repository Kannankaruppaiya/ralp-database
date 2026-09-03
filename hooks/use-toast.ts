'use client';

import { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'info';
}

type Listener = (toasts: ToastMessage[]) => void;

let memoryToasts: ToastMessage[] = [];
const listeners: Listener[] = [];

function emitChange() {
  for (const listener of listeners) {
    listener([...memoryToasts]);
  }
}

export function toast({
  title,
  description,
  variant = 'default',
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive' | 'info';
}) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newToast: ToastMessage = { id, title, description, variant };
  memoryToasts = [...memoryToasts, newToast];
  emitChange();

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    emitChange();
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(memoryToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      memoryToasts = memoryToasts.filter((t) => t.id !== id);
      emitChange();
    },
  };
}

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

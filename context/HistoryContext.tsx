import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface HistoryEntry {
  id: string;
  formulaId: string;
  formulaName: string;
  category: string;
  inputs: Record<string, number | string>;
  result: number;
  unit: string;
  steps: string[];
  warnings: string[];
  timestamp: string;
  favorite: boolean;
  notes?: string;
  project?: string;
}

interface HistoryContextValue {
  entries: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, "id" | "favorite">) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  isLoading: boolean;
}

const STORAGE_KEY = "@oilcalc_history";

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: HistoryEntry[] = JSON.parse(raw);
        setEntries(parsed);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const saveHistory = async (updated: HistoryEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addEntry = useCallback(async (entry: Omit<HistoryEntry, "id" | "favorite">) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      favorite: false,
    };
    setEntries((prev) => {
      const updated = [newEntry, ...prev].slice(0, 200);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    setEntries((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e));
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setEntries([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <HistoryContext.Provider value={{ entries, addEntry, removeEntry, toggleFavorite, clearHistory, isLoading }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be inside HistoryProvider");
  return ctx;
}

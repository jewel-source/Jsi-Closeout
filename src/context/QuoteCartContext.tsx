"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { QuoteRequestItem } from "@/lib/types";
interface QuoteCartValue {
  items: QuoteRequestItem[];
  addItem: (item: Omit<QuoteRequestItem, "quantity">) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  isInCart: (id: string) => boolean;
}
const QuoteCartContext = createContext<QuoteCartValue | null>(null);
const STORAGE_KEY = "jsi-quote-cart";
export function QuoteCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteRequestItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);
  const addItem: QuoteCartValue["addItem"] = (item) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, { ...item, quantity: 1 }];
    });
  };
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };
  const setQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    );
  };
  const clear = () => setItems([]);
  const isInCart = (id: string) => items.some((i) => i.id === id);
  return (
    <QuoteCartContext.Provider
      value={{ items, addItem, removeItem, setQuantity, clear, isInCart }}
    >
      {children}
    </QuoteCartContext.Provider>
  );
}
export function useQuoteCart() {
  const ctx = useContext(QuoteCartContext);
  if (!ctx)
    throw new Error("useQuoteCart must be used within QuoteCartProvider");
  return ctx;
}

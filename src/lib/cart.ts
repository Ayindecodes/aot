import { useCallback, useSyncExternalStore } from "react";
import { getProduct } from "../data/products";
import { MAX_QUANTITY, type OrderLineInput } from "./order";

const STORAGE_KEY = "aot-cart-v1";

export type CartLine = OrderLineInput & { id: string };

const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;

export function lineId(line: OrderLineInput): string {
  return JSON.stringify([
    line.slug,
    line.option ?? "",
    line.size ?? "",
    line.color ?? "",
    line.measurements?.bust ?? "",
    line.measurements?.waist ?? "",
    line.measurements?.length ?? "",
    line.measurements?.notes ?? "",
  ]);
}

export function toOrderLine(line: CartLine): OrderLineInput {
  const { slug, quantity, option, size, color, measurements } = line;
  return { slug, quantity, option, size, color, measurements };
}

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const lines = Array.isArray(stored) ? (stored as OrderLineInput[]) : [];
    cache = lines
      .filter((line) => typeof line?.slug === "string" && getProduct(line.slug))
      .map((line) => ({ ...line, id: lineId(line) }));
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Private browsing can block storage. The cart still works until the tab closes.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noSubscription = () => () => {};

// The static HTML can't know what's in the cart, so cart views wait for this before rendering.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

function addLine(lines: CartLine[], line: OrderLineInput): CartLine[] {
  const id = lineId(line);
  const existing = lines.find((candidate) => candidate.id === id);
  if (!existing) return [...lines, { ...line, id }];
  return lines.map((candidate) =>
    candidate.id === id
      ? { ...candidate, quantity: Math.min(candidate.quantity + line.quantity, MAX_QUANTITY) }
      : candidate,
  );
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);

  const add = useCallback((line: OrderLineInput) => write(addLine(read(), line)), []);

  const remove = useCallback(
    (id: string) => write(read().filter((line) => line.id !== id)),
    [],
  );

  // Editing can make a line identical to another one, so it's removed and re-added to merge them.
  const update = useCallback((id: string, changes: Partial<OrderLineInput>) => {
    const current = read();
    const target = current.find((line) => line.id === id);
    if (!target) return;
    write(addLine(current.filter((line) => line.id !== id), { ...toOrderLine(target), ...changes }));
  }, []);

  const clear = useCallback(() => write([]), []);

  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    add,
    update,
    remove,
    clear,
  };
}

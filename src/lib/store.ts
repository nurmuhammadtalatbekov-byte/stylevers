// Local persistence (browser storage). Swap for Lovable Cloud when accounts are added.
import { useSyncExternalStore } from "react";
import { designSchema, collectionSchema } from "./design-schema";
import type { Design } from "./fashion";

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
}
export interface State {
  designs: Design[];
  collections: Collection[];
  likes: string[];
  favorites: string[];
}

const KEY = "styleverse:v1";
const EMPTY: State = { designs: [], collections: [], likes: [], favorites: [] };
let state: State = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function validItems<T>(value: unknown, schema: typeof designSchema | typeof collectionSchema): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = schema.safeParse(item);
    return parsed.success ? [parsed.data as T] : [];
  });
}

function stringItems(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return;
    const data = stored as Record<string, unknown>;
    state = {
      designs: validItems<Design>(data["designs"], designSchema),
      collections: validItems<Collection>(data["collections"], collectionSchema),
      likes: stringItems(data["likes"]),
      favorites: stringItems(data["favorites"]),
    };
  } catch {
    /* ignore corrupt storage */
  }
}
function commit(next: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw new Error("Storage is full — try removing custom textures or old designs.");
  }
  state = next;
  subs.forEach((f) => f());
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export const actions = {
  snapshot() {
    load();
    return structuredClone(state);
  },
  mergeWorkspace(incoming: State) {
    load();
    const designs = new Map(state.designs.map((d) => [d.id, d]));
    for (const d of incoming.designs) {
      const current = designs.get(d.id);
      if (!current || d.updatedAt > current.updatedAt) designs.set(d.id, d);
    }
    const collections = new Map(state.collections.map((c) => [c.id, c]));
    for (const c of incoming.collections) if (!collections.has(c.id)) collections.set(c.id, c);
    commit({
      designs: [...designs.values()],
      collections: [...collections.values()],
      likes: [...new Set([...state.likes, ...incoming.likes])],
      favorites: [...new Set([...state.favorites, ...incoming.favorites])],
    });
  },
  getDesign(id: string) {
    load();
    return state.designs.find((d) => d.id === id);
  },
  saveDesign(d: Design) {
    load();
    const next = { ...d, updatedAt: Date.now() };
    const exists = state.designs.some((x) => x.id === d.id);
    commit({
      ...state,
      designs: exists
        ? state.designs.map((x) => (x.id === d.id ? next : x))
        : [next, ...state.designs],
    });
    return next;
  },
  duplicateDesign(id: string) {
    const d = actions.getDesign(id);
    if (!d) return;
    const copy = {
      ...structuredClone(d),
      id: uid(),
      name: d.name + " (copy)",
      updatedAt: Date.now(),
    };
    commit({ ...state, designs: [copy, ...state.designs] });
  },
  deleteDesign(id: string) {
    load();
    commit({ ...state, designs: state.designs.filter((d) => d.id !== id) });
  },
  renameDesign(id: string, name: string) {
    load();
    commit({
      ...state,
      designs: state.designs.map((d) => (d.id === id ? { ...d, name, updatedAt: Date.now() } : d)),
    });
  },
  moveToCollection(id: string, collectionId?: string) {
    load();
    commit({
      ...state,
      designs: state.designs.map((d) =>
        d.id === id ? { ...d, collectionId, updatedAt: Date.now() } : d,
      ),
    });
  },
  createCollection(name: string) {
    load();
    const c = { id: uid(), name, createdAt: Date.now() };
    commit({ ...state, collections: [...state.collections, c] });
    return c;
  },
  deleteCollection(id: string) {
    load();
    commit({
      ...state,
      collections: state.collections.filter((c) => c.id !== id),
      designs: state.designs.map((d) =>
        d.collectionId === id ? { ...d, collectionId: undefined, updatedAt: Date.now() } : d,
      ),
    });
  },
  toggle(list: "likes" | "favorites", id: string) {
    load();
    const has = state[list].includes(id);
    commit({ ...state, [list]: has ? state[list].filter((x) => x !== id) : [...state[list], id] });
  },
  clearAll() {
    commit(EMPTY);
  },
};

// Local persistence (browser storage). Swap for Lovable Cloud when accounts are added.
import { useSyncExternalStore } from "react";
import type { Design } from "./fashion";

export interface Collection { id: string; name: string; createdAt: number }
interface State { designs: Design[]; collections: Collection[]; likes: string[]; favorites: string[] }

const KEY = "styleverse:v1";
const EMPTY: State = { designs: [], collections: [], likes: [], favorites: [] };
let state: State = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* ignore corrupt storage */ }
}
function commit(next: State) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); }
  catch { throw new Error("Storage is full — try removing custom textures or old designs."); }
  subs.forEach((f) => f());
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => { load(); return state; },
    () => EMPTY,
  );
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export const actions = {
  getDesign(id: string) { load(); return state.designs.find((d) => d.id === id); },
  saveDesign(d: Design) {
    load();
    const next = { ...d, updatedAt: Date.now() };
    const exists = state.designs.some((x) => x.id === d.id);
    commit({ ...state, designs: exists ? state.designs.map((x) => (x.id === d.id ? next : x)) : [next, ...state.designs] });
    return next;
  },
  duplicateDesign(id: string) {
    const d = actions.getDesign(id); if (!d) return;
    const copy = { ...structuredClone(d), id: uid(), name: d.name + " (copy)", updatedAt: Date.now() };
    commit({ ...state, designs: [copy, ...state.designs] });
  },
  deleteDesign(id: string) { load(); commit({ ...state, designs: state.designs.filter((d) => d.id !== id) }); },
  renameDesign(id: string, name: string) {
    load(); commit({ ...state, designs: state.designs.map((d) => (d.id === id ? { ...d, name } : d)) });
  },
  moveToCollection(id: string, collectionId?: string) {
    load(); commit({ ...state, designs: state.designs.map((d) => (d.id === id ? { ...d, collectionId } : d)) });
  },
  createCollection(name: string) {
    load(); const c = { id: uid(), name, createdAt: Date.now() };
    commit({ ...state, collections: [...state.collections, c] }); return c;
  },
  deleteCollection(id: string) {
    load();
    commit({
      ...state,
      collections: state.collections.filter((c) => c.id !== id),
      designs: state.designs.map((d) => (d.collectionId === id ? { ...d, collectionId: undefined } : d)),
    });
  },
  toggle(list: "likes" | "favorites", id: string) {
    load(); const has = state[list].includes(id);
    commit({ ...state, [list]: has ? state[list].filter((x) => x !== id) : [...state[list], id] });
  },
  clearAll() { commit(EMPTY); },
};

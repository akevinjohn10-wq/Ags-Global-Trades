// Signals when the intro preloader has finished, so the hero can start its entrance.
let ready = false;
const listeners = new Set<() => void>();

export function markReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
}

export function isReady() {
  return ready;
}

export function onReady(fn: () => void): () => void {
  if (ready) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}

import { microtask } from "framer-motion";

type Preparation = { read: () => () => void; active: boolean };

const pending = new Set<Preparation>();
let scheduled = false;

/** Prepare the current commit before paint, with every layout read ahead of every write. */
export function scheduleRevealPreparation(read: Preparation["read"]) {
  const preparation = { read, active: true };
  pending.add(preparation);
  if (!scheduled) {
    scheduled = true;
    // Motion renders newly created values later in this same microtask batch.
    microtask.read(() => {
      scheduled = false;
      const batch = [...pending];
      pending.clear();
      const writes = batch.map((item) => (item.active ? item.read() : undefined));
      writes.forEach((write, index) => {
        if (batch[index].active) write?.();
      });
    });
  }
  return () => {
    preparation.active = false;
    pending.delete(preparation);
  };
}

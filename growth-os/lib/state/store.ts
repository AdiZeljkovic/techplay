// Persistence behind an interface. Today: one JSON file on the machine that
// runs Growth OS. Later: implement StateStore against Postgres/Redis and
// change getStore() — nothing else in the app needs to know.
import fs from "node:fs";
import path from "node:path";
import { applyOp, normaliseState } from "./reducer";
import type { GrowthState, StateOp } from "./types";

export interface StateStore {
  read(): Promise<GrowthState>;
  apply(ops: StateOp[]): Promise<GrowthState>;
}

export class FileStateStore implements StateStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private file: string) {}

  async read(): Promise<GrowthState> {
    try {
      return normaliseState(JSON.parse(await fs.promises.readFile(this.file, "utf8")));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return normaliseState(null);
      throw e;
    }
  }

  /** Serialised read-modify-write with an atomic rename, so two tabs cannot interleave. */
  apply(ops: StateOp[]): Promise<GrowthState> {
    const run = async () => {
      let state = await this.read();
      for (const op of ops) state = applyOp(state, op);
      await fs.promises.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(state, null, 2));
      await fs.promises.rename(tmp, this.file);
      return state;
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }
}

let store: StateStore | null = null;
export function getStore(): StateStore {
  if (!store) {
    const file = process.env.GROWTH_OS_STATE_FILE || path.join(process.cwd(), "data", "state", "state.json");
    store = new FileStateStore(file);
  }
  return store;
}

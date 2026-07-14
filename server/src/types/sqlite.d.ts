// Type declarations for the built-in Node.js sqlite module (node:sqlite)
// Available since Node.js v22.5.0, stable in Node.js v24+

declare module 'node:sqlite' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number;
  }

  interface StatementSync {
    run(...params: any[]): RunResult;
    get(...params: any[]): Record<string, any> | undefined;
    all(...params: any[]): Record<string, any>[];
    iterate(...params: any[]): IterableIterator<Record<string, any>>;
  }

  class DatabaseSync {
    constructor(location: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export { DatabaseSync, StatementSync, RunResult };
}
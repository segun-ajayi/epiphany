// Portable SQLite-dialect contract. D1 and Node SQLite implement these operations.
export type SqlValue = string | number | null | ArrayBuffer;
export type SqlResult<T> = { results: T[]; success: boolean; meta?: Record<string, unknown> };
export interface SqlStatement {
  bind(...values: SqlValue[]): SqlStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<SqlResult<T>>;
  run<T = unknown>(): Promise<SqlResult<T>>;
}
export interface SqlDatabase {
  prepare(query: string): SqlStatement;
  // Executes all statements in order in one transaction; any failure rolls back all.
  batch<T = unknown>(statements: SqlStatement[]): Promise<SqlResult<T>[]>;
}

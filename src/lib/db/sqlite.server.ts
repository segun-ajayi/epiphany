import { DatabaseSync } from "node:sqlite";
import type { SqlDatabase, SqlResult, SqlStatement, SqlValue } from "./sql.types.ts";

export class SqliteDatabase implements SqlDatabase {
  readonly connection: DatabaseSync;
  constructor(path: string) {
    this.connection = new DatabaseSync(path);
    this.connection.exec(
      "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;",
    );
  }
  prepare(query: string): SqlStatement {
    return new Statement(this, query);
  }
  async batch<T>(statements: SqlStatement[]): Promise<SqlResult<T>[]> {
    // No await between BEGIN and COMMIT: concurrent requests cannot interleave
    // work on this shared synchronous connection inside another transaction.
    this.connection.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => {
        if (!(statement instanceof Statement) || statement.database !== this)
          throw new Error("Foreign database statement");
        return statement.execute<T>();
      });
      this.connection.exec("COMMIT");
      return results;
    } catch (error) {
      this.connection.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.connection.close();
  }
}

class Statement implements SqlStatement {
  readonly database: SqliteDatabase;
  readonly query: string;
  readonly values: SqlValue[];
  constructor(database: SqliteDatabase, query: string, values: SqlValue[] = []) {
    this.database = database;
    this.query = query;
    this.values = values;
  }
  bind(...values: SqlValue[]) {
    return new Statement(this.database, this.query, values);
  }
  parameters() {
    return this.values.map((value) =>
      value instanceof ArrayBuffer ? new Uint8Array(value) : value,
    );
  }
  async first<T>(): Promise<T | null> {
    const row = this.database.connection.prepare(this.query).get(...this.parameters());
    return row ? ({ ...row } as T) : null;
  }
  async all<T>(): Promise<SqlResult<T>> {
    return this.execute<T>();
  }
  async run<T>(): Promise<SqlResult<T>> {
    return this.execute<T>();
  }
  execute<T>(): SqlResult<T> {
    const statement = this.database.connection.prepare(this.query);
    if (statement.columns().length)
      return {
        success: true,
        results: statement.all(...this.parameters()).map((row) => ({ ...row })) as T[],
      };
    const result = statement.run(...this.parameters());
    return { success: true, results: [], meta: { changes: Number(result.changes) } };
  }
}

const connections = new Map<string, SqliteDatabase>();
export function getNodeDatabase() {
  const path = process.env.SQLITE_PATH;
  if (!path) throw new Error("Set SQLITE_PATH to an initialized SQLite database.");
  let database = connections.get(path);
  if (!database) {
    database = new SqliteDatabase(path);
    connections.set(path, database);
  }
  return database;
}

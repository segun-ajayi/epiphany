import { readFileSync } from "node:fs";
import { SqliteDatabase } from "../src/lib/db/sqlite.server.ts";
import { migrate } from "../scripts/migrations.ts";
import type { SqlStatement } from "../src/lib/db/sql.types.ts";

// Tests exercise the production SQLite adapter using isolated in-memory data.
export class TestDatabase extends SqliteDatabase {
  beforeBatch?: () => void;
  get sqlite() {
    return this.connection;
  }
  constructor(seed = true) {
    super(":memory:");
    migrate(this);
    if (seed) this.bootstrap();
  }
  bootstrap() {
    this.sqlite.exec(readFileSync(new URL("../seed/initial-admin.sql", import.meta.url), "utf8"));
  }
  override async batch<T>(statements: SqlStatement[]) {
    this.beforeBatch?.();
    return super.batch<T>(statements);
  }
}

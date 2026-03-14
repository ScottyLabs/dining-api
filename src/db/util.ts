import { sql, Column } from "drizzle-orm";
import { PgTable, PgUpdateSetSource } from "drizzle-orm/pg-core";

export function conflictUpdateSet<TTable extends PgTable>(
  table: TTable,
  columns: (keyof TTable["_"]["columns"] & keyof TTable)[]
): PgUpdateSetSource<TTable> {
  return Object.assign(
    {},
    ...columns.map((k) => ({
      [k]: sql.raw(`excluded.${(table[k] as Column).name}`),
    }))
  ) as PgUpdateSetSource<TTable>;
}

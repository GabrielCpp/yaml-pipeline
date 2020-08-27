import { getConnection } from 'typeorm';

export async function insertElements(
  tableName: string,
  columns: string[],
  elements: Record<string, unknown>[],
) {
  const values = elements.map((e) =>
    columns.reduce((p: Record<string, unknown>, c: string) => {
      p[c] = e[c];
      return p;
    }, {}),
  );

  await getConnection()
    .createQueryBuilder()
    .insert()
    .into(tableName, columns)
    .values(values)
    .execute();
}

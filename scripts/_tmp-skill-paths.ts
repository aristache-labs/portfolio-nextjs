import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("NO_URL");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false });
const before = await sql<{ n: number }[]>`
  select count(*)::int as n from skills where icon_path like '%/skills/brand/%'
`;
const updated = await sql`
  update skills
  set icon_path = replace(icon_path, '/skills/brand/', '/skills/')
  where icon_path like '%/skills/brand/%'
  returning id
`;
const left = await sql<{ n: number }[]>`
  select count(*)::int as n from skills where icon_path like '%/skills/brand/%'
`;
console.log("matched", before[0].n, "updated", updated.length, "remaining", left[0].n);
await sql.end();

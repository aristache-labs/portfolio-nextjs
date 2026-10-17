import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("NO_DATABASE_URL");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false });
const rows = await sql`SELECT hero_tagline FROM profile LIMIT 1`;
console.log(JSON.stringify({ heroTagline: rows[0]?.hero_tagline ?? null }));
await sql.end();

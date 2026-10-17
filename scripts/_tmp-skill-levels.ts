import postgres from "postgres";

const LEVELS: Record<string, string> = {
  JavaScript: "90",
  TypeScript: "85",
  Dart: "75",
  Python: "80",
  HTML: "90",
  CSS: "85",
  PHP: "60",
  React: "90",
  "React Native": "85",
  Expo: "80",
  Flutter: "70",
  "Next.js": "90",
  "Node.js": "85",
  Tailwind: "90",
  MySQL: "75",
  PostgreSQL: "80",
  Supabase: "85",
  Firebase: "75",
  Docker: "75",
  Nginx: "70",
  AWS: "70",
  Azure: "65",
  Cloudflare: "75",
  Windows: "90",
  Linux: "85",
  Git: "95",
  GitHub: "90",
  Bitbucket: "70",
  PowerShell: "85",
  Bash: "80",
  Ansible: "65",
  AiScript: "70",
};

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("NO_URL");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false });
let updated = 0;
for (const [name, level] of Object.entries(LEVELS)) {
  const rows = await sql`
    update skills set level = ${level}
    where name = ${name} and (level is null or level = '')
    returning id
  `;
  updated += rows.length;
}
const filled = await sql<{ n: number }[]>`
  select count(*)::int as n from skills where level is not null and level <> ''
`;
console.log("updated", updated, "with-level", filled[0].n);
await sql.end();

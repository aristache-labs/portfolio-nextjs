type Reports = { id: number; [key: string]: unknown }[];
const state = globalThis as typeof globalThis & { heroReloadReports?: Reports };

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const report = JSON.parse(await request.text()) as Reports[number];
  const reports = (state.heroReloadReports ??= []);
  const index = reports.findIndex((item) => item.id === report.id);
  if (index >= 0) reports[index] = report;
  else reports.push(report);
  if (reports.length > 20) reports.shift();
  return new Response(null, { status: 204 });
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  return Response.json(state.heroReloadReports ?? []);
}

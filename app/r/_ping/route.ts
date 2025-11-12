// app/r/_ping/route.ts
export async function GET() {
  return new Response("r segment OK", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

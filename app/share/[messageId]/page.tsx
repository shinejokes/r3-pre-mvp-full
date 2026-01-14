// app/share/[messageId]/page.tsx
import Link from "next/link";

export default function ShareMessagePage({
  params,
}: {
  params: { messageId: string };
}) {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Share</h1>
      <p style={{ marginTop: 12 }}>
        messageId: <code>{params.messageId}</code>
      </p>

      <div style={{ marginTop: 16 }}>
        <Link href="/">Go home</Link>
      </div>
    </main>
  );
}

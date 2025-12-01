// app/share/page.tsx
import ShareClient from "./ShareClient";

interface SharePageProps {
  searchParams?: {
    messageId?: string;
    parentRefCode?: string;
  };
}

export default function SharePage({ searchParams }: SharePageProps) {
  const messageId = searchParams?.messageId ?? "";
  const parentRefCode = searchParams?.parentRefCode ?? "";

  return (
    <ShareClient
      initialMessageId={messageId}
      parentRefCode={parentRefCode}
    />
  );
}

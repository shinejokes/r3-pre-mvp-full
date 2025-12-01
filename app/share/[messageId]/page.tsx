// app/share/[messageId]/page.tsx
import ShareClient from "../ShareClient";

interface ShareWithMessagePageProps {
  params: { messageId: string };
  searchParams?: { parentRefCode?: string };
}

export default function ShareWithMessagePage({
  params,
  searchParams,
}: ShareWithMessagePageProps) {
  const messageId = params.messageId;
  const parentRefCode = searchParams?.parentRefCode ?? "";

  return (
    <ShareClient
      initialMessageId={messageId}
      parentRefCode={parentRefCode}
    />
  );
}

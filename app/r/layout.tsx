// app/r/layout.tsx
import React from "react";

export default function RLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

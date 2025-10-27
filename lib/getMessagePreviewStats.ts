// lib/getMessagePreviewStats.ts
//
// 이 함수는 messageId로 DB에서 조회해서
// 우리가 카드/미리보기에서 쓸 값들을 꺼낸다.
//
// 이 예시는 Supabase 테이블 이름을 "messages"라고 가정한다.
// 그리고 그 테이블에 이런 컬럼이 있다고 가정한다:
//   id (text or uuid)
//   textSnippet (메시지 요약문 같은 짧은 텍스트)
//   totalHits (누적 조회수 숫자)
//   uniqueSharers (이 메시지를 자기 이름으로 퍼뜨린 서로 다른 사람 수)
//
// 만약 실제 컬럼명이 다르면 아래에서 맞게 바꿔주면 된다.
// 예: content, hits, sharers 이런 식이라면 각각 거기에 맞춰서 수정.

import { supabase } from "./supabaseClient";

export async function getMessagePreviewStats(messageId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("textSnippet, totalHits, uniqueSharers")
    .eq("id", messageId)
    .single();

  if (error || !data) {
    // 못 찾았거나 에러면 안전한 기본값
    return {
      snippet: "(not found)",
      hits: 0,
      sharers: 0,
    };
  }

  return {
    snippet: data.textSnippet || "",
    hits: data.totalHits || 0,
    sharers: data.uniqueSharers || 0,
  };
}

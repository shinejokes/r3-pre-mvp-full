// pages/api/preview-card/[messageId].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createCanvas } from "canvas";
import { supabaseServer } from "../../../server/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messageId } = req.query;

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("messages")
    .select("textSnippet, totalHits, uniqueSharers")
    .eq("id", messageId)
    .single();

  const snippet = !error && data?.textSnippet ? data.textSnippet : "(not found)";
  const hits = !error && data?.totalHits ? data.totalHits : 0;
  const sharers = !error && data?.uniqueSharers ? data.uniqueSharers : 0;

  const width = 1024;
  const height = 1024;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#000000";
  ctx.font = "bold 48px sans-serif";
  ctx.fillText(`${hits} views · ${sharers} sharers`, 60, 120);

  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#333333";
  const snippetShort = snippet.slice(0, 90);
  ctx.fillText(snippetShort, 60, 200);

  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#555555";
  ctx.fillText("R3", width - 120, height - 60);

  const buffer = canvas.toBuffer("image/png");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).send(buffer);
}

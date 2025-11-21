import { redirect } from "next/navigation";

export default function LabIndexPage() {
  // /lab 로 들어오면 바로 /lab/share 로 보내기
  redirect("/lab/share");
}

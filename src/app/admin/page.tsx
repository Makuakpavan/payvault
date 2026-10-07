import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AdminPanel from "@/components/AdminPanel";
export const dynamic = "force-dynamic";
export default async function Page() {
  const u = await getUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/dashboard");
  return <AdminPanel />;
}

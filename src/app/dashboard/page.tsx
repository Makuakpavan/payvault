import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await getUser())) redirect("/login");
  return <Dashboard />;
}

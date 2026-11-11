import { cookies } from "next/headers";
import { verifyAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountPageView } from "@/components/account";

export default function AccountPage() {
  const token = cookies().get("gcp_access")?.value;
  let isLoggedIn = false;
  if (token) {
    try {
      const s = verifyAccess(token);
      if (s.kind === "CUSTOMER") isLoggedIn = true;
    } catch {
      /* not logged in */
    }
  }

  if (!isLoggedIn) {
    redirect("/login?next=/account");
  }

  return <AccountPageView />;
}

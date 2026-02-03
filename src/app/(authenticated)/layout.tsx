import { NavBar } from "@/components/NavBar";
import { TermsAcceptanceCheck } from "@/components/TermsAcceptanceCheck";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <NavBar />
      <TermsAcceptanceCheck userId={user.id}>
        {children}
      </TermsAcceptanceCheck>
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/landing/Hero";
import ProductPreview from "@/components/landing/ProductPreview";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustPillars from "@/components/landing/TrustPillars";
import FinalCta from "@/components/landing/FinalCta";

// The public landing page. Each section is its own component (see
// components/landing/*) so the page stays a simple, readable outline
// and sections are easy to reorder, reword, or extend.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const loggedIn = Boolean(user);

  return (
    <main className="flex flex-1 flex-col">
      <Hero loggedIn={loggedIn} />
      <ProductPreview />
      <HowItWorks />
      <TrustPillars />
      <FinalCta loggedIn={loggedIn} />
    </main>
  );
}

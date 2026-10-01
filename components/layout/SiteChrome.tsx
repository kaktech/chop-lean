import { Toaster } from "sonner";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileTabBar } from "./MobileTabBar";
import { CartDrawer } from "./CartDrawer";
import { MenuDrawer } from "./MenuDrawer";
import { CartSync } from "./CartSync";
import { auth } from "@/auth";

export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);
  return (
    <>
      <CartSync signedIn={!!session?.user} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-yellow focus:px-4 focus:py-2 focus:font-bold">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileTabBar />
      <CartDrawer />
      <MenuDrawer />
      <Toaster position="bottom-left" offset={{ bottom: 88, left: 16 }} mobileOffset={{ bottom: 80, left: 16 }} />
    </>
  );
}

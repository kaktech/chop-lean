import { SiteChrome } from "@/components/layout/SiteChrome";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}

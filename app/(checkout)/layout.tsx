import { Toaster } from "sonner";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main id="main">{children}</main>
      <Toaster position="bottom-left" />
    </>
  );
}

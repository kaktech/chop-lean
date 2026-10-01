import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { FavouritesList } from "@/components/shop/FavouritesList";

export const metadata: Metadata = { title: "Saved dishes", robots: { index: false } };

export default function FavouritesPage() {
  return (
    <>
      <PageHero image="jollof.jpg" eyebrow="Your list" title="Saved" accent="favourites" blurb="Plans and dishes you've hearted, saved in this browser." crumbs={[{ label: "Home", href: "/" }, { label: "Saved" }]} size="sm" />
      <div className="container-x py-12 md:py-20"><FavouritesList /></div>
    </>
  );
}

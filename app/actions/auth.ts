"use server";
import { signIn, signOut } from "@/auth";

const safePath = (p: string) => (p.startsWith("/") && !p.startsWith("//") ? p : "/");

export async function signInWithGoogle(redirectTo: string = "/") {
  await signIn("google", { redirectTo: safePath(redirectTo) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

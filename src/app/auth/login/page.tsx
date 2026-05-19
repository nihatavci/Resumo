import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login | Resumo",
  description: "Sign in to your Resumo account.",
};

export default async function LoginPage() {
  redirect("/home");
}

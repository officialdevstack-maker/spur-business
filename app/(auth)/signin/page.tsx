import type { Metadata } from "next";
import Link from "next/link";
import { SpursSignInButton } from "@spurs-cloud/accounts/react";

export const metadata: Metadata = {
  title: "Sign in | Spurs Business",
  description: "Sign in to Spurs Business with your Spurs account.",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#EEF3F4] px-6 py-12 text-[#12343B]">
      <section className="w-full max-w-md rounded-2xl border border-[#12343B]/10 bg-white p-8 shadow-sm sm:p-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-[#F2B632] text-lg font-bold">
            S
          </span>
          Spurs Business
        </Link>
        <h1 className="mt-10 text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-3 leading-relaxed text-[#4C6267]">
          Use your Spurs account to securely access your business workspaces.
        </p>
        <div className="mt-8">
          <SpursSignInButton
            issuer={process.env.SPURS_ISSUER}
            returnTo="/"
            style={{
              width: "100%",
              height: 52,
              justifyContent: "center",
              padding: "0 16px",
              borderRadius: 12,
              background: "#F2B632",
              color: "#12343B",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Sign in with Spurs
          </SpursSignInButton>
        </div>
        <p className="mt-6 text-center text-sm text-[#6A7E82]">
          <Link href="/" className="underline underline-offset-4">
            Back to Spurs Business
          </Link>
        </p>
      </section>
    </main>
  );
}

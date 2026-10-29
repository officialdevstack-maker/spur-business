import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSpursUser } from "@spurs-cloud/accounts/next";
import { SpursAccountMenu, SpursSignInButton } from "@spurs-cloud/accounts/react";

async function HomeContent() {
  await connection();
  const user = await getSpursUser();

  return (
    <main className="flex min-h-dvh flex-col bg-[#EEF3F4] text-[#12343B]">
      <header className="flex items-center justify-between border-b border-[#12343B]/10 px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-[#F2B632] text-lg font-bold">
            S
          </span>
          Spurs Business
        </Link>
        {user ? (
          <SpursAccountMenu user={user} accent="#F2B632" accentTo="#D89B14" />
        ) : (
          <Link
            href="/signin"
            className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#12343B]/5"
          >
            Sign in
          </Link>
        )}
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20 sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6A7E82]">
          Spurs Business
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          One place to manage your business on Spurs.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#4C6267]">
          Sign in with your Spurs account to get started. Your Spurs session works
          across first-party Spurs apps.
        </p>

        {user ? (
          <div className="mt-10 max-w-xl rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#6A7E82]">Signed in as</p>
            <p className="mt-1 text-xl font-semibold">{user.name ?? user.username ?? "Spurs user"}</p>
            {user.email && <p className="mt-1 text-sm text-[#6A7E82]">{user.email}</p>}
            <p className="mt-5 border-t border-[#12343B]/10 pt-4 text-sm leading-relaxed text-[#4C6267]">
              Your Spurs account is connected. Workspace setup is the next step.
            </p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-start gap-4">
            <SpursSignInButton
              issuer={process.env.SPURS_ISSUER}
              returnTo="/"
              style={{
                height: 52,
                padding: "0 24px",
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
        )}
      </section>

      <footer className="border-t border-[#12343B]/10 px-6 py-5 text-center text-sm text-[#6A7E82] sm:px-10">
        One Spurs identity across Spurs services.
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[#EEF3F4] px-6 text-[#4C6267]">
          Checking your Spurs session…
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SpursSignInButton } from "@spurs-cloud/accounts/react";
import { getSessionUser, sessionProfile } from "@/lib/auth/session";
import { getLandingPath } from "@/lib/workspaces/service";

const OFFERINGS = [
  {
    title: "VTU business",
    description:
      "Run an airtime and data business with a business wallet, bulk purchases and reseller tools.",
    badge: "VTU",
  },
  {
    title: "School",
    description:
      "Manage student fees and payments, and get your own school management site at a link you can share.",
    badge: "School",
  },
];

const STEPS = [
  { title: "Sign in with Spurs", description: "Use the same Spurs account you use everywhere." },
  { title: "Create a workspace", description: "Name your business and choose VTU or school." },
  { title: "Start managing", description: "Your dashboard is ready as soon as you're in." },
];

function Landing() {
  return (
    <main className="flex min-h-dvh flex-col bg-[#EEF3F4] text-[#12343B]">
      <header className="flex items-center justify-between border-b border-[#12343B]/10 px-6 py-5 sm:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-[#F2B632] text-lg font-bold">
            S
          </span>
          Spurs Business
        </Link>
        <Link
          href="/signin"
          className="rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#12343B]/5"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 py-20 sm:px-10 sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6A7E82]">
          Spurs Business
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          One place to run your business on Spurs.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#4C6267]">
          Create a workspace for your VTU business or your school in minutes, using the Spurs
          account you already have.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
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
            Get started with Spurs
          </SpursSignInButton>
          <span className="text-sm text-[#6A7E82]">Free to set up · Up to 5 workspaces</span>
        </div>
      </section>

      <section className="border-y border-[#12343B]/10 bg-white">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-14 sm:grid-cols-2 sm:px-10">
          {OFFERINGS.map((offering) => (
            <div key={offering.title} className="rounded-2xl border border-[#12343B]/10 p-6">
              <span className="rounded-full bg-[#F2B632]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {offering.badge}
              </span>
              <h2 className="mt-4 text-xl font-semibold">{offering.title}</h2>
              <p className="mt-2 leading-relaxed text-[#4C6267]">{offering.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-[#12343B]/10 bg-white p-5">
              <span className="grid size-8 place-items-center rounded-full bg-[#12343B] text-sm font-semibold text-white">
                {index + 1}
              </span>
              <p className="mt-4 font-semibold">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#4C6267]">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto border-t border-[#12343B]/10 px-6 py-5 text-center text-sm text-[#6A7E82] sm:px-10">
        One Spurs identity across Spurs services.
      </footer>
    </main>
  );
}

async function HomeGate() {
  await connection();
  const user = await getSessionUser();
  if (user) redirect(await getLandingPath(user.sub, sessionProfile(user).email));
  return <Landing />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-[#EEF3F4] px-6 text-[#4C6267]">
          Loading…
        </main>
      }
    >
      <HomeGate />
    </Suspense>
  );
}

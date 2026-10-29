import Link from "next/link";
import { Icon, type IconName } from "@/components/layout/icons";
import { getNavSections } from "@/components/layout/nav-config";
import { requireUser } from "@/lib/auth/session";
import { requireWorkspace, schoolSiteUrl } from "@/lib/workspaces/service";

type StepStatus = "done" | "pending" | "soon";

type Step = {
  title: string;
  description: string;
  status: StepStatus;
  href?: string;
};

type QuickAction = {
  label: string;
  description: string;
  icon: IconName;
  href: string;
};

function safeSchoolSiteUrl(slug: string | null): string | null {
  try {
    return schoolSiteUrl(slug);
  } catch (error) {
    console.error("Could not build school site URL.", error);
    return null;
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

function StatusDot({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green-500 text-white">
        <Icon name="check" className="size-4" />
      </span>
    );
  }

  return (
    <span
      className={`size-7 shrink-0 rounded-full border-2 ${
        status === "pending" ? "border-[#F2B632]" : "border-[#12343B]/15"
      }`}
    />
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneCls =
    tone === "success"
      ? "bg-green-500"
      : tone === "warning"
        ? "bg-[#F2B632]"
        : "bg-[#12343B]/30";

  return (
    <div className="rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#6A7E82]">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-xl font-semibold capitalize">
        <span className={`size-2.5 rounded-full ${toneCls}`} />
        {value}
      </p>
      {hint && <p className="mt-2 text-sm leading-relaxed text-[#4C6267]">{hint}</p>}
    </div>
  );
}

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const { workspace, role } = await requireWorkspace(workspaceId, user.sub);

  const base = `/w/${workspace.id}`;
  const isVtu = workspace.type === "vtu";
  const typeLabel = isVtu ? "VTU business" : "School";
  const payActive = Boolean(workspace.payIdentityId);
  const siteUrl = isVtu ? null : safeSchoolSiteUrl(workspace.slug);
  const createdOn = dateFormatter.format(new Date(workspace.createdAt));
  const firstName = user.name?.trim().split(/\s+/)[0];

  const steps: Step[] = [
    {
      title: "Create your workspace",
      description: `${workspace.name} is set up and ready.`,
      status: "done",
    },
    {
      title: "Pay account activated",
      description: payActive
        ? "Your Pay account is active."
        : "Spurs will set this up for your business. You'll see it here when it's ready.",
      status: payActive ? "done" : "pending",
      href: `${base}/settings`,
    },
    isVtu
      ? {
          title: "Fund your business wallet",
          description: "Wallet funding is coming soon.",
          status: "soon",
        }
      : {
          title: "Launch your school site",
          description: "Your school site will go live once the schools app is ready.",
          status: "soon",
        },
    {
      title: "Invite your team",
      description: "Team invites and roles are coming soon.",
      status: "soon",
    },
  ];

  const actionable = steps.filter((step) => step.status !== "soon");
  const completed = actionable.filter((step) => step.status === "done").length;
  const progress = Math.round((completed / actionable.length) * 100);

  const quickActions: QuickAction[] = [
    isVtu
      ? {
          label: "VTU business",
          description: "Wallet, bulk purchases and reseller tools.",
          icon: "phone",
          href: `${base}/vtu`,
        }
      : {
          label: "School site",
          description: "Your school management site.",
          icon: "school",
          href: `${base}/school`,
        },
    {
      label: "Settings",
      description: "Workspace details and Pay account status.",
      icon: "settings",
      href: `${base}/settings`,
    },
    {
      label: "All workspaces",
      description: "Switch between your workspaces.",
      icon: "grid",
      href: "/workspaces",
    },
  ];

  const comingSoon = getNavSections(workspace.type)
    .flatMap((section) => section.items)
    .filter((item) => item.soon);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[#6A7E82]">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </p>
          <h1 className="mt-1 truncate text-3xl font-bold tracking-tight">{workspace.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F2B632]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {typeLabel}
            </span>
            <span className="rounded-full bg-[#12343B]/5 px-3 py-1 text-xs font-semibold capitalize">
              {role}
            </span>
            <span className="text-xs text-[#6A7E82]">Created {createdOn}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pay account"
          value={payActive ? "Active" : "Pending"}
          tone={payActive ? "success" : "warning"}
          hint={
            payActive
              ? undefined
              : "Spurs will set this up for your business. You'll see it here when it's ready."
          }
        />
        <StatCard label="Your role" value={role} />
        {isVtu ? (
          <StatCard
            label="Wallet"
            value="Coming soon"
            hint="Your business wallet will appear here."
          />
        ) : (
          <div className="rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#6A7E82]">School site</p>
            {siteUrl ? (
              <>
                <p className="mt-2 break-all text-sm font-semibold">{siteUrl}</p>
                <p className="mt-2 text-sm text-[#4C6267]">Not live yet.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[#4C6267]">
                The school address isn&apos;t available right now.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#12343B]/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Getting started</h2>
          <p className="text-sm text-[#6A7E82]">
            {completed} of {actionable.length} steps complete
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-[#12343B]/5"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Setup progress"
        >
          <div
            className="h-full rounded-full bg-[#F2B632] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-6 space-y-5">
          {steps.map((step) => {
            const body = (
              <div className="min-w-0 flex-1">
                <p
                  className={`flex items-center gap-2 text-sm font-semibold ${
                    step.status === "soon" ? "text-[#12343B]/50" : ""
                  }`}
                >
                  {step.title}
                  {step.status === "soon" && (
                    <span className="rounded-full bg-[#12343B]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Soon
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-[#4C6267]">
                  {step.description}
                </p>
              </div>
            );

            return (
              <li key={step.title} className="flex items-start gap-4">
                <StatusDot status={step.status} />
                {step.href && step.status === "pending" ? (
                  <Link href={step.href} className="min-w-0 flex-1 hover:opacity-80">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-start gap-4 rounded-2xl border border-[#12343B]/10 bg-white p-5 shadow-sm transition hover:border-[#F2B632]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2B632]/20 text-[#12343B]">
                <Icon name={action.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{action.label}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-[#4C6267]">
                  {action.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {comingSoon.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Coming soon</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {comingSoon.map((item) => (
              <li
                key={item.path}
                className="flex items-center gap-2 rounded-full border border-dashed border-[#12343B]/20 px-4 py-2 text-sm text-[#12343B]/60"
              >
                <Icon name={item.icon} className="size-4" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

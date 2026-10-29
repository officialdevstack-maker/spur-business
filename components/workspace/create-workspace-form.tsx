"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TypePicker } from "@/components/workspace/type-picker";
import type { WorkspaceType } from "@/lib/constants";

type ApiResponse = {
  error?: string;
  workspace?: { id?: string };
};

function isApiResponse(value: unknown): value is ApiResponse {
  return typeof value === "object" && value !== null;
}

const ERRORS: Record<string, string> = {
  LIMIT_REACHED: "You've reached the limit of 5 workspaces.",
  SLUG_UNAVAILABLE: "Couldn't generate a unique school address. Try a different name.",
  INVALID_INPUT: "Please check the name and workspace type and try again.",
};

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceType>("vtu");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        const code = isApiResponse(data) && typeof data.error === "string"
          ? data.error
          : "";
        setError(ERRORS[code] ?? "Something went wrong. Try again.");
        return;
      }

      if (
        !isApiResponse(data) ||
        !isApiResponse(data.workspace) ||
        typeof data.workspace.id !== "string"
      ) {
        throw new Error("Workspace API returned an invalid success response.");
      }

      router.push(`/w/${encodeURIComponent(data.workspace.id)}`);
      router.refresh();
    } catch (submitError) {
      console.error("Could not submit workspace creation form.", submitError);
      setError("Could not create the workspace. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="workspace-name" className="text-sm font-medium">
          Business name
        </label>
        <input
          id="workspace-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={60}
          placeholder="e.g. Bright Future Academy"
          className="mt-2 w-full rounded-xl border border-[#12343B]/15 bg-white px-4 py-3 outline-none focus:border-[#F2B632]"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Type</legend>
        <TypePicker value={type} onChange={setType} />
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-[#F2B632] px-6 font-semibold text-[#12343B] disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}

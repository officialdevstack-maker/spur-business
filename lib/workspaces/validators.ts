import { WORKSPACE_TYPES, type WorkspaceType } from "@/lib/constants";

export type CreateWorkspaceInput = {
  name: string;
  type: WorkspaceType;
};

export type CreateWorkspaceFieldErrors = Partial<
  Record<keyof CreateWorkspaceInput, string[]>
>;

export function validateCreateWorkspace(
  input: unknown,
):
  | { success: true; data: CreateWorkspaceInput }
  | { success: false; fieldErrors: CreateWorkspaceFieldErrors } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { success: false, fieldErrors: { name: ["Enter a workspace name."] } };
  }

  const record = input as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const type = record.type;
  const fieldErrors: CreateWorkspaceFieldErrors = {};

  if (name.length < 2 || name.length > 60) {
    fieldErrors.name = ["Name must be between 2 and 60 characters."];
  }
  if (
    typeof type !== "string" ||
    !WORKSPACE_TYPES.includes(type as WorkspaceType)
  ) {
    fieldErrors.type = ["Choose a valid workspace type."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return { success: true, data: { name, type: type as WorkspaceType } };
}

const RESERVED_SCHOOL_SLUGS = new Set([
  "about",
  "admin",
  "api",
  "auth",
  "help",
  "login",
  "register",
  "schools",
  "signin",
  "signup",
]);

export function schoolSlugBase(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");

  const base = normalized || "school";
  return RESERVED_SCHOOL_SLUGS.has(base) ? `${base}-school` : base;
}

export function schoolSlugCandidate(base: string, suffix: number): string {
  if (suffix === 0) return base;

  const ending = `-${suffix + 1}`;
  return `${base.slice(0, 48 - ending.length).replace(/-+$/g, "")}${ending}`;
}

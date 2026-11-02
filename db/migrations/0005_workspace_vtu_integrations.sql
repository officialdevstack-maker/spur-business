CREATE TABLE vtu_host_allowlist (
  host text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspace_vtu_integrations (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  host text NOT NULL REFERENCES vtu_host_allowlist(host),
  base_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

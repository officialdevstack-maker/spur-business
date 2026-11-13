CREATE TABLE IF NOT EXISTS workspace_vtu_connections (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  site_url text NOT NULL,
  host text NOT NULL,
  verify_token text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);

ALTER TABLE workspace_vtu_integrations
  ADD COLUMN IF NOT EXISTS secret_enc text;

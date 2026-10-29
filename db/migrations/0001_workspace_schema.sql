CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(60) NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  type text NOT NULL CHECK (type IN ('vtu', 'school')),
  slug varchar(48) UNIQUE,
  pay_identity_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (type = 'school' OR slug IS NULL)
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_user_role_idx
  ON workspace_members (user_id, role);

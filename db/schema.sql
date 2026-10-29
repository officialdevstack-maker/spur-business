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

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS name varchar(120),
  ADD COLUMN IF NOT EXISTS email varchar(254);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_members_one_owner_idx
  ON workspace_members (workspace_id)
  WHERE role = 'owner';

CREATE TABLE IF NOT EXISTS workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email varchar(254) CHECK (email IS NULL OR email = lower(email)),
  invitee_user_id varchar(64),
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (email IS NOT NULL OR invitee_user_id IS NOT NULL),
  CHECK (email IS NULL OR invitee_user_id IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS workspace_invites_pending_email_idx
  ON workspace_invites (workspace_id, email)
  WHERE status = 'pending' AND email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS workspace_invites_pending_user_idx
  ON workspace_invites (workspace_id, invitee_user_id)
  WHERE status = 'pending' AND invitee_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS workspace_invites_email_lookup_idx
  ON workspace_invites (email) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS workspace_invites_user_lookup_idx
  ON workspace_invites (invitee_user_id) WHERE status = 'pending';

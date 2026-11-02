ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS operator_type text;

UPDATE workspaces
   SET operator_type = 'third_party'
 WHERE type = 'vtu' AND operator_type IS NULL;

DO $$ BEGIN
  ALTER TABLE workspaces
    ADD CONSTRAINT workspaces_operator_type_check
    CHECK (
      (type = 'vtu' AND operator_type IN ('spurs', 'third_party'))
      OR (type = 'school' AND operator_type IS NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS workspace_customers (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  name varchar(120),
  email varchar(254),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_customers_user_idx
  ON workspace_customers (user_id);
CREATE INDEX IF NOT EXISTS workspace_customers_workspace_created_idx
  ON workspace_customers (workspace_id, created_at DESC);

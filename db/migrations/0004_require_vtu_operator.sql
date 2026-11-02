ALTER TABLE workspaces
  DROP CONSTRAINT IF EXISTS workspaces_operator_type_check;

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_operator_type_check
  CHECK (
    (type = 'vtu' AND operator_type IS NOT NULL AND operator_type IN ('spurs', 'third_party'))
    OR (type = 'school' AND operator_type IS NULL)
  );

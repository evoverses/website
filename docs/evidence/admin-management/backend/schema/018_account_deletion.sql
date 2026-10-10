-- Retain immutable audit/financial records while permanently closing accounts.
BEGIN;
ALTER TABLE player.beta_admin_operations DROP CONSTRAINT beta_admin_operations_action_check;
ALTER TABLE player.beta_admin_operations ADD CONSTRAINT beta_admin_operations_action_check
 CHECK(action IN ('bootstrap','approve','revoke','grant_evoros','grant_item','promote_admin','revoke_admin','ban','unban','delete'));
COMMIT;

-- Additive website-owned local extension to the shared player database.
-- No provider mapping, balance, inventory or NFT ownership is changed.
CREATE TABLE player.wallet_crypto_config (
  singleton boolean PRIMARY KEY CHECK (singleton=true),
  key_verifier text NOT NULL CHECK (key_verifier ~ '^[a-f0-9]{64}$')
);
CREATE TABLE player.wallet_links (
  player_id uuid NOT NULL REFERENCES player.players(id),
  id uuid PRIMARY KEY,
  chain_id integer NOT NULL CHECK (chain_id=43114),
  address_fingerprint text NOT NULL CHECK (address_fingerprint ~ '^[a-f0-9]{64}$'),
  address_ciphertext text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(player_id,address_fingerprint)
);
CREATE INDEX wallet_links_by_player ON player.wallet_links(player_id);
CREATE TABLE player.wallet_link_challenges (
  player_id uuid PRIMARY KEY REFERENCES player.players(id),
  id uuid UNIQUE NOT NULL,
  address_fingerprint text NOT NULL CHECK (address_fingerprint ~ '^[a-f0-9]{64}$'),
  session_hash text NOT NULL CHECK (session_hash ~ '^[a-f0-9]{64}$'),
  address_ciphertext text NOT NULL,
  nonce text NOT NULL CHECK (nonce ~ '^[a-f0-9]{32}$'),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL CHECK (expires_at>issued_at)
);
CREATE TABLE player.wallet_link_audit (
  id uuid PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES player.players(id),
  action text NOT NULL CHECK (action IN ('wallet_linked','wallet_unlinked')),
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TRIGGER append_only_wallet_link_audit BEFORE UPDATE OR DELETE ON player.wallet_link_audit
  FOR EACH ROW EXECUTE FUNCTION player.reject_record_mutation();
REVOKE ALL ON player.wallet_crypto_config,player.wallet_links,player.wallet_link_challenges,player.wallet_link_audit FROM PUBLIC;

CREATE TABLE IF NOT EXISTS sandbox_collections (
  reference UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  request_key UUID NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise BETWEEN 100 AND 10000000),
  provider_id TEXT UNIQUE,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','created','paid','expired','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  UNIQUE (user_id,request_key)
);
CREATE INDEX IF NOT EXISTS sandbox_collections_history ON sandbox_collections(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS sandbox_collection_credits (
  reference UUID PRIMARY KEY REFERENCES sandbox_collections(reference),
  amount_paise INTEGER NOT NULL CHECK(amount_paise>0),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION post_verified_sandbox_collection() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='paid' AND NEW.verified_at IS NOT NULL AND NEW.provider_id IS NOT NULL THEN
    INSERT INTO sandbox_collection_credits(reference,amount_paise) VALUES(NEW.reference,NEW.amount_paise)
    ON CONFLICT(reference) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sandbox_collection_credit ON sandbox_collections;
CREATE TRIGGER sandbox_collection_credit AFTER UPDATE OF status ON sandbox_collections
FOR EACH ROW EXECUTE FUNCTION post_verified_sandbox_collection();

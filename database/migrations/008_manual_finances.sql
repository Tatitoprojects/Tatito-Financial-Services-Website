CREATE TABLE IF NOT EXISTS manual_finance_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  title VARCHAR(160) NOT NULL,
  category VARCHAR(60) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK(amount>0),
  posted_on DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS finance_entries_by_owner ON manual_finance_entries(user_id,posted_on);
CREATE TABLE IF NOT EXISTS manual_category_limits (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  category VARCHAR(60) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK(amount>0),
  PRIMARY KEY(user_id,month_start,category)
);

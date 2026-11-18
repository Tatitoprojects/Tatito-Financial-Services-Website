-- The baseline imports explicit IDs. Advance serial sequences only if seed IDs occupy future values.
DO $$
DECLARE
  tbl text;
  seq_name regclass;
  largest bigint;
  current_value bigint;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','loan_products','loan_applications','mutual_funds','agent_leads'] LOOP
    EXECUTE format('LOCK TABLE %I IN SHARE ROW EXCLUSIVE MODE',tbl);
    seq_name := pg_get_serial_sequence(tbl,'id')::regclass;
    EXECUTE format('SELECT max(id) FROM %I',tbl) INTO largest;
    EXECUTE format('SELECT last_value FROM %s',seq_name) INTO current_value;
    IF largest IS NOT NULL AND current_value <= largest THEN
      PERFORM setval(seq_name, largest, true);
    END IF;
  END LOOP;
END
$$;

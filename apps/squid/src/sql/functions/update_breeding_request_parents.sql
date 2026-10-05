CREATE OR REPLACE FUNCTION metadata.update_breeding_request_parents(_request_id NUMERIC)
  RETURNS VOID
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM squid.breeding_request br
    JOIN squid.nursery_evo ne ON ne.id = br.parent1_id OR ne.id = br.parent2_id
    WHERE br.request_id = _request_id
  ) THEN
    RAISE EXCEPTION 'Legacy Brenda counter updates cannot modify canonical Nursery parents';
  END IF;
  WITH breed_parents AS (
    SELECT
      br.parent1_id::NUMERIC AS parent1_token_id,
      br.parent2_id::NUMERIC AS parent2_token_id,
      b.timestamp AS breed_timestamp
    FROM squid.breeding_request AS br
           LEFT JOIN squid.transaction AS t ON t.id = br.tx_id
           LEFT JOIN squid.block AS b ON b.id = t.block_id
    WHERE br.request_id = _request_id
  )
  UPDATE metadata.evo
  SET
    last_breed_time = breed_parents.breed_timestamp,
    total_breeds = total_breeds + 1
  FROM breed_parents
  WHERE evo.token_id = breed_parents.parent1_token_id
     OR evo.token_id = breed_parents.parent2_token_id;
END;
$$ LANGUAGE plpgsql;
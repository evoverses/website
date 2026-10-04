CREATE OR REPLACE FUNCTION update_breeding_request_parents(_request_id NUMERIC)
  RETURNS VOID
AS $$
BEGIN
  WITH breed_parents AS (
    SELECT
      br.parent1_id::NUMERIC AS parent1_token_id,
      br.parent2_id::NUMERIC AS parent2_token_id,
      b.timestamp AS breed_timestamp
    FROM breeding_request AS br
           LEFT JOIN transaction AS t ON t.id = br.tx_id
           LEFT JOIN block AS b ON b.id = t.block_id
    WHERE br.request_id = _request_id
  )
  UPDATE evo
  SET
    last_breed_time = breed_parents.breed_timestamp,
    total_breeds = total_breeds + 1
  FROM breed_parents
  WHERE evo.token_id = breed_parents.parent1_token_id
     OR evo.token_id = breed_parents.parent2_token_id;
END;
$$ LANGUAGE plpgsql;
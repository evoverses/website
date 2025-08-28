CREATE OR REPLACE FUNCTION get_breeding_request_by_id(_request_id NUMERIC)
  RETURNS TABLE (
    id TEXT,
    request_id NUMERIC,
    amount_paid NUMERIC,
    status TEXT,
    tx JSON,
    breeder TEXT,
    parent1 JSON,
    parent2 JSON
  )
AS
$$
BEGIN
  RETURN QUERY
    SELECT
      br.id::TEXT, -- Explicitly cast to TEXT
      br.request_id,
      br.amount_paid,
      br.status::TEXT, -- Explicitly cast to TEXT
      -- Transaction details (JSON object)
      JSON_BUILD_OBJECT(
        'hash', t.hash,
        'block_number', b.number,
        'timestamp', b.timestamp
      ) AS tx,
      breeder_wallet.address AS breeder,
      JSON_BUILD_OBJECT(
        'id', e1.id,
        'tokenId', e1.token_id,
        'gender', e1.gender,
        'species_id', e1.species_id,
        'species', s1.species,
        'primary_type', s1.primary_type,
        'secondary_type', s1.secondary_type,
        'generation', e1.generation,
        'total_breeds', e1.total_breeds,
        'last_breed_time', e1.last_breed_time,
        'owner', owner_wallet1.address
      ) AS parent1,
      -- Parent 2 details (JSON object)
      JSON_BUILD_OBJECT(
        'id', e2.id,
        'tokenId', e2.token_id,
        'gender', e2.gender,
        'species_id', e2.species_id,
        'species', s2.species,
        'primary_type', s2.primary_type,
        'secondary_type', s2.secondary_type,
        'generation', e2.generation,
        'total_breeds', e2.total_breeds,
        'last_breed_time', e2.last_breed_time,
        'owner', owner_wallet2.address
      ) AS parent2
    FROM breeding_request AS br
           LEFT JOIN transaction AS t ON t.id = br.tx_id
           LEFT JOIN block AS b ON b.id = t.block_id
           LEFT JOIN wallet AS breeder_wallet ON breeder_wallet.id = br.breeder_id
           LEFT JOIN evo AS e1 ON e1.token_id = br.parent1_id::NUMERIC -- Cast parent1_id to NUMERIC
           LEFT JOIN nft AS nft1 ON nft1.id = br.parent1_id
           LEFT JOIN wallet AS owner_wallet1 ON owner_wallet1.id = nft1.owner_id
           LEFT JOIN species AS s1 ON s1.id = e1.species_id
           LEFT JOIN evo AS e2 ON e2.token_id = br.parent2_id::NUMERIC -- Cast parent2_id to NUMERIC
           LEFT JOIN nft AS nft2 ON nft2.id = br.parent2_id
           LEFT JOIN wallet AS owner_wallet2 ON owner_wallet2.id = nft2.owner_id
           LEFT JOIN species AS s2 ON s2.id = e2.species_id
    WHERE br.request_id = _request_id;
END;
$$ LANGUAGE plpgsql;
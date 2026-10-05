-- One read model for both lists and single-token metadata/image lookups.
-- The canonical overlay is keyed by the full NFT ID (chain + collection + token).
create or replace function metadata.evo_metadata(_nft_id text)
returns jsonb language sql stable as $$
  select coalesce(to_jsonb(e), '{}'::jsonb) || coalesce(ne.metadata, '{}'::jsonb) || jsonb_build_object(
    'xp', coalesce(e.xp, 0),
    'species', s.species,
    'primary_type', coalesce(ne.metadata -> 'primary_type', to_jsonb(s.primary_type)),
    'secondary_type', coalesce(ne.metadata -> 'secondary_type', to_jsonb(s.secondary_type)),
    'type', coalesce(ne.metadata ->> 'type', case when e.gender = 'unknown' then 'EGG' else 'EVO' end),
    'parent1_id', coalesce(ne.metadata -> 'parent1_token_id', to_jsonb(e.parent1_token_id)),
    'parent2_id', coalesce(ne.metadata -> 'parent2_token_id', to_jsonb(e.parent2_token_id))
  )
  from squid.nft n
  join squid.contract c on c.id = n.contract_id
  left join metadata.evo e on e.token_id = n.token_id and c.chain_id = '43114'
    and lower(c.address) = '0x4151b8afa10653d304fdac9a781afccd45ec164c'
  left join squid.nursery_evo ne on ne.id = n.id
  join metadata.species s on s.id = coalesce((ne.metadata ->> 'species_id')::integer, e.species_id)
  where n.id = _nft_id and (e.token_id is not null or ne.id is not null)
$$;

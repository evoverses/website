create or replace view metadata.evos_aggregated_view as
select
  n.id::text as nft_id,
  n.token_id::text as tokenId,
  ch.id::text as chainId,
  c.address,
  w.address as owner,
  to_jsonb(e) || jsonb_build_object(
    'primary_type', s.primary_type,
    'secondary_type', s.secondary_type,
    'species', s.species
  ) as metadata,
  (
    select dls.total_price
    from squid.direct_listing_sale dls
    join squid.direct_listing dl on dls.listing_id = dl.id
    where dl.nft_id = n.id
    order by dls.id desc
    limit 1
  ) as last_sale,
  (
    select max(o.total_price)
    from squid.offer o
    where o.nft_id = n.id and o.status = 'CREATED' and o.expires_at > now()
  ) as top_offer,
  (
    select min(dl.price_per_token)
    from squid.direct_listing dl
    where dl.nft_id = n.id and dl.status = 'CREATED' and dl.end_at > now()
  ) as listing_price,
  (
    select max(dl.start_at)
    from squid.direct_listing dl
    where dl.nft_id = n.id and dl.status = 'CREATED'
  ) as listed_at,
  (
    select max(dls.id)::text
    from squid.direct_listing_sale dls
    join squid.direct_listing dl on dls.listing_id = dl.id
    where dl.nft_id = n.id
  ) as sold_at,
  n.updated_at as created_at
from squid.nft n
join squid.contract c on c.id = n.contract_id
join squid.chain ch on ch.id = c.chain_id
join squid.wallet w on w.id = n.owner_id
join metadata.evo e on e.token_id = n.token_id
join metadata.species s on s.id = e.species_id;

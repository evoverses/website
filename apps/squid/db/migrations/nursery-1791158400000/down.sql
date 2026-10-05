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
    'species', s.species,
    'type', case when e.gender = 'unknown' then 'EGG' else 'EVO' end
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

create or replace function metadata.get_evo(_tokenId text)
returns table (
  tokenId text,
  chainId text,
  address text,
  owner text,
  metadata jsonb,
  offers jsonb[],
  listings jsonb[],
  auctions jsonb[]
)
language plpgsql
as $$
begin
  return query
  select
    n.token_id::text as tokenId,
    ch.id::text as chainId,
    c.address,
    w.address as owner,
    meta.metadata, -- ✅ pulled from lateral

    coalesce(array_agg(jsonb_build_object(
      'id', o.id,
      'offerId', o.offer_id::text,
      'quantity', o.quantity::text,
      'totalPrice', o.total_price::text,
      'expiresAt', o.expires_at,
      'currencyId', o.currency_id,
      'offerorId', o.offeror_id
    ) order by o.expires_at) filter (where o.id is not null), '{}') as offers,

    coalesce(array_agg(jsonb_build_object(
      'id', dl.id,
      'listingId', dl.listing_id::text,
      'quantity', dl.quantity::text,
      'pricePerToken', dl.price_per_token::text,
      'startAt', dl.start_at,
      'endAt', dl.end_at,
      'currencyId', dl.currency_id,
      'creatorId', dl.creator_id
    ) order by dl.start_at) filter (where dl.id is not null), '{}') as listings,

    coalesce(array_agg(jsonb_build_object(
      'id', ea.id,
      'auctionId', ea.auction_id::text,
      'quantity', ea.quantity::text,
      'minimumBidAmount', ea.minimum_bid_amount::text,
      'buyoutBidAmount', ea.buyout_bid_amount::text,
      'startAt', ea.start_at,
      'endAt', ea.end_at,
      'currencyId', ea.currency_id,
      'creatorId', ea.creator_id,
      'status', ea.status
    ) order by ea.start_at) filter (where ea.id is not null), '{}') as auctions

  from squid.nft n
  join squid.contract c on c.id = n.contract_id
  join squid.chain ch on ch.id = c.chain_id
  join squid.wallet w on w.id = n.owner_id

  -- ✅ lateral join to fetch evo + species metadata as a single jsonb blob
  left join lateral (
    select to_jsonb(e) || jsonb_build_object(
      'species', s.species,
      'primary_type', s.primary_type,
      'secondary_type', s.secondary_type,
      'type', case when e.gender = 'unknown' then 'EGG' else 'EVO' end
    ) as metadata
    from metadata.evo e
    join metadata.species s on s.id = e.species_id
    where e.token_id = n.token_id
    limit 1
  ) meta on true

  left join squid.offer o
    on o.nft_id = n.id and o.status = 'CREATED' and o.expires_at > now()

  left join squid.direct_listing dl
    on dl.nft_id = n.id and dl.status = 'CREATED' and dl.end_at > now()

  left join squid.english_auction ea
    on ea.nft_id = n.id and ea.status = 'CREATED' and ea.end_at > now()

  where n.token_id::text = _tokenId
  group by n.token_id, ch.id, c.address, w.address, meta.metadata;
end;
$$;

CREATE OR REPLACE FUNCTION metadata.update_breeding_request_parents(_request_id NUMERIC)
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
DROP FUNCTION metadata.evo_metadata(text);
DROP TABLE squid.nursery_evo;

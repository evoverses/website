CREATE TABLE squid.nursery_evo (
 id character varying PRIMARY KEY,
 hatcher text NOT NULL,
 block_number integer NOT NULL,
 block_hash text NOT NULL,
 metadata jsonb NOT NULL
);
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
create or replace view metadata.evos_aggregated_view as
select
  n.id::text as nft_id,
  n.token_id::text as tokenId,
  ch.id::text as chainId,
  c.address,
  w.address as owner,
  meta.metadata,
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
join lateral (select metadata.evo_metadata(n.id) as metadata) meta on meta.metadata is not null;
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

  join lateral (select metadata.evo_metadata(n.id) as metadata) meta on meta.metadata is not null

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
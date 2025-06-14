create or replace function metadata.get_evos(
  _limit int,
  _page int,
  _sort text,
  _owners text[] default null,
  _listed boolean default null,
  _attributes jsonb default null
)
returns jsonb
language sql
as $$
with filtered_ids as (
  select nft_id from metadata.evos_filtered(_owners, _listed, _attributes)
),
sorted as (
  select *
  from metadata.evos_sorted(_sort)
  where nft_id in (select nft_id from filtered_ids)
  order by sort_key desc nulls last
  limit _limit
  offset _limit * _page
),
total as (
  select count(*) as total_count from filtered_ids
)
select jsonb_build_object(
  'items', jsonb_agg(jsonb_build_object(
    'tokenId', s.tokenId,
    'chainId', s.chainId,
    'address', s.address,
    'owner', s.owner,
    'metadata', s.metadata,
    'offers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', o.id,
        'offerId', o.offer_id::text,
        'quantity', o.quantity::text,
        'totalPrice', o.total_price::text,
        'expiresAt', o.expires_at,
        'currencyId', o.currency_id,
        'offerorId', o.offeror_id,
        'status', o.status
      )), '[]')
      from public.offer o
      where o.nft_id::text = s.nft_id and o.status = 'CREATED' and o.expires_at > now()
    ),
    'listings', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', dl.id,
        'listingId', dl.listing_id::text,
        'quantity', dl.quantity::text,
        'pricePerToken', dl.price_per_token::text,
        'startAt', dl.start_at,
        'endAt', dl.end_at,
        'currencyId', dl.currency_id,
        'creatorId', dl.creator_id,
        'status', dl.status,
        'sales', (
           select coalesce(jsonb_agg(jsonb_build_object(
             'buyerId', dls.buyer_id,
             'quantity', dls.quantity::text,
             'totalPrice', dls.total_price::text,
             'timestamp', b.timestamp
           )), '[]')
           from public.direct_listing_sale dls
           join public.transaction tx on dls.tx_id = tx.id
           join public.block b on tx.block_id = b.id
           where dls.listing_id = dl.id
        )
      )), '[]')
      from public.direct_listing dl
      where dl.nft_id::text = s.nft_id and dl.status = 'CREATED' and dl.end_at > now()
    ),
    'auctions', (
      select coalesce(jsonb_agg(jsonb_build_object(
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
      )), '[]')
      from public.english_auction ea
      where ea.nft_id::text = s.nft_id and ea.status = 'CREATED' and ea.end_at > now()
    )
  )),
  'total_count', (select total_count from total),
  'next_page', ((select total_count from total) > (_limit * (_page + 1)))
)
from sorted s
$$;

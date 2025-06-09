create or replace function public.get_evos_marketplace(
  _limit int,
  _page int,
  _sort text
)
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
language sql
as $$
with base as (
  select
    n.id as nft_id,
    n.token_id::text as tokenId,
    ch.id::text as chainId,
    c.address,
    w.address as owner,
    n.metadata,
    (
      select dls.total_price
      from public.direct_listing_sale dls
      join public.direct_listing dl on dls.listing_id = dl.id
      where dl.nft_id = n.id
      order by dls.id desc
      limit 1
    ) as last_sale,
    (
      select max(o.total_price)
      from public.offer o
      where o.nft_id = n.id and o.status = 'CREATED' and o.expires_at > now()
    ) as top_offer,
    (
      select min(dl.price_per_token)
      from public.direct_listing dl
      where dl.nft_id = n.id and dl.status = 'CREATED' and dl.end_at > now()
    ) as listing_price,
    (
      select max(dl.start_at)
      from public.direct_listing dl
      where dl.nft_id = n.id and dl.status = 'CREATED'
    ) as listed_at,
    (
      select max(dls.id)::text
      from public.direct_listing_sale dls
      join public.direct_listing dl on dls.listing_id = dl.id
      where dl.nft_id = n.id
    ) as sold_at,
    n.updated_at as created_at
  from public.nft n
  join public.contract c on c.id = n.contract_id
  join public.chain ch on ch.id = c.chain_id
  join public.wallet w on w.id = n.owner_id
),
ranked as (
  select *,
    case _sort
      when 'PRICE_HIGH_TO_LOW'    then listing_price
      when 'PRICE_LOW_TO_HIGH'    then -1 * listing_price
      when 'RECENTLY_LISTED'      then extract(epoch from listed_at)
      when 'HIGHEST_LAST_SALE'    then last_sale
      when 'LOWEST_LAST_SALE'     then -1 * last_sale
      when 'TOP_OFFER'            then top_offer
      when 'NEWEST'               then extract(epoch from created_at)
      when 'OLDEST'               then -1 * extract(epoch from created_at)
      when 'RECENTLY_SOLD'        then sold_at::bigint
      else extract(epoch from created_at)
    end as sort_key
  from base
  where tokenId is not null
),
paged as (
  select *
  from ranked
  order by sort_key desc nulls last
  limit _limit
  offset _limit * _page
)
select
  p.tokenId,
  p.chainId,
  p.address,
  p.owner,
  p.metadata,

  -- Offers
  coalesce(array_agg(jsonb_build_object(
    'id', o.id,
    'offerId', o.offer_id,
    'quantity', o.quantity,
    'totalPrice', o.total_price,
    'expiresAt', o.expires_at,
    'currencyId', o.currency_id,
    'offerorId', o.offeror_id
  ) order by o.expires_at) filter (where o.id is not null), '{}') as offers,

  -- Listings
  coalesce(array_agg(jsonb_build_object(
    'id', dl.id,
    'listingId', dl.listing_id,
    'quantity', dl.quantity,
    'pricePerToken', dl.price_per_token,
    'startAt', dl.start_at,
    'endAt', dl.end_at,
    'currencyId', dl.currency_id,
    'creatorId', dl.creator_id
  ) order by dl.start_at) filter (where dl.id is not null), '{}') as listings,

  -- Auctions
  coalesce(array_agg(jsonb_build_object(
    'id', ea.id,
    'auctionId', ea.auction_id,
    'quantity', ea.quantity,
    'minimumBidAmount', ea.minimum_bid_amount,
    'buyoutBidAmount', ea.buyout_bid_amount,
    'startAt', ea.start_at,
    'endAt', ea.end_at,
    'currencyId', ea.currency_id,
    'creatorId', ea.creator_id,
    'status', ea.status
  ) order by ea.start_at) filter (where ea.id is not null), '{}') as auctions

from paged p
left join public.offer o on o.nft_id::text = p.nft_id::text and o.status = 'CREATED' and o.expires_at > now()
left join public.direct_listing dl on dl.nft_id = p.nft_id and dl.status = 'CREATED' and dl.end_at > now()
left join public.english_auction ea on ea.nft_id = p.nft_id and ea.status = 'CREATED' and ea.end_at > now()
group by p.tokenId, p.chainId, p.address, p.owner, p.metadata;
$$;

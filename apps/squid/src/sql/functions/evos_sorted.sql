create or replace function metadata.evos_sorted(_sort text)
returns table (
  nft_id text,
  tokenId text,
  chainId text,
  address text,
  owner text,
  metadata jsonb,
  last_sale numeric,
  top_offer numeric,
  listing_price numeric,
  listed_at timestamptz,
  sold_at text,
  created_at timestamptz,
  sort_key numeric
)
language sql
as $$
  select *,
    case _sort
      when 'PRICE_HIGH_TO_LOW' then coalesce(-1 * listing_price, -1e99)
      when 'PRICE_LOW_TO_HIGH' then -1 * coalesce(listing_price, 1e99)
      when 'RECENTLY_LISTED'   then extract(epoch from listed_at)
      when 'HIGHEST_LAST_SALE' then coalesce(last_sale, -1e99)
      when 'LOWEST_LAST_SALE'  then -1 * coalesce(last_sale, 1e99)
      when 'TOP_OFFER'         then coalesce(top_offer, -1e99)
      when 'NEWEST'            then extract(epoch from created_at)
      when 'OLDEST'            then -1 * extract(epoch from created_at)
      when 'RECENTLY_SOLD'     then coalesce(sold_at::bigint, 0)
      else extract(epoch from created_at)
    end as sort_key
  from metadata.evos_aggregated_view
$$;

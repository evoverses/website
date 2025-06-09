DROP FUNCTION IF EXISTS public.get_evo_marketplace(_tokenId text);
CREATE OR REPLACE FUNCTION public.get_evo_marketplace(_tokenId text)
RETURNS TABLE (
  "tokenId" text,
  "chainId" text,
  address text,
  owner text,
  offers jsonb[],
  listings jsonb[],
  auctions jsonb[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.token_id::text AS tokenId,
    ch.id::text AS chainId,
    c.address,
    w.address AS owner,

    coalesce(array_agg(DISTINCT jsonb_build_object(
      'id', o.id,
      'offerId', o.offer_id::text,
      'quantity', o.quantity::text,
      'totalPrice', o.total_price::text,
      'expiresAt', o.expires_at,
      'currency', o.currency_id,
      'offeror', o.offeror_id
    )) FILTER (WHERE o.id IS NOT NULL), '{}') AS offers,

    coalesce(array_agg(distinct jsonb_build_object(
      'id', dl.id,
      'listingId', dl.listing_id::text,
      'quantity', dl.quantity::text,
      'pricePerToken', dl.price_per_token::text,
      'startAt', dl.start_at,
      'endAt', dl.end_at,
      'currency', dl.currency_id,
      'creator', dl.creator_id
    )) FILTER (WHERE dl.id IS NOT NULL), '{}') AS listings,

    coalesce(array_agg(distinct jsonb_build_object(
      'id', ea.id,
      'auctionId', ea.auction_id::text,
      'quantity', ea.quantity::text,
      'minimumBidAmount', ea.minimum_bid_amount::text,
      'buyoutBidAmount', ea.buyout_bid_amount::text,
      'startAt', ea.start_at,
      'endAt', ea.end_at,
      'currency', ea.currency_id,
      'creator', ea.creator_id,
      'status', ea.status
    )) FILTER (WHERE ea.id IS NOT NULL), '{}') AS auctions

  from public.nft n
  JOIN public.contract c ON c.id = n.contract_id
  JOIN public.chain ch ON ch.id = c.chain_id
  JOIN public.wallet w ON w.id = n.owner_id

  LEFT JOIN public.offer o
    ON o.nft_id = n.id AND o.status = 'CREATED' AND o.expires_at > now()

  LEFT JOIN public.direct_listing dl
    ON dl.nft_id = n.id AND dl.status = 'CREATED' AND dl.end_at > now()

  LEFT JOIN public.english_auction ea
    ON ea.nft_id = n.id AND ea.status = 'CREATED' AND ea.end_at > now()

  WHERE n.token_id::text = _tokenId
  GROUP BY n.token_id, ch.id, c.address, w.address;
END;
$$;

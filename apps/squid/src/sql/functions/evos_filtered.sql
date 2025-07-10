create or replace function metadata.evos_filtered(
  _owners text[] default null,
  _listed boolean default null,
  _attributes jsonb default null
)
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
  created_at timestamptz
)
language sql
as $$
  select *
  from metadata.evos_aggregated_view
  where (_owners is null or owner = any (_owners))
    and (_listed is null or (_listed = true and listing_price is not null) or (_listed = false and listing_price is null))
    and (
      _attributes is null or (
        select bool_and(
          case
            when jsonb_typeof(_attributes -> key) = 'array'
              then (metadata ->> key) = any (select jsonb_array_elements_text(_attributes -> key))
            when jsonb_typeof(_attributes -> key) = 'object'
              then (
                ( (_attributes -> key ->> 'gt')  is null or (metadata ->> key)::numeric >  (_attributes -> key ->> 'gt')::numeric ) and
                ( (_attributes -> key ->> 'gte') is null or (metadata ->> key)::numeric >= (_attributes -> key ->> 'gte')::numeric ) and
                ( (_attributes -> key ->> 'lt')  is null or (metadata ->> key)::numeric <  (_attributes -> key ->> 'lt')::numeric ) and
                ( (_attributes -> key ->> 'lte') is null or (metadata ->> key)::numeric <= (_attributes -> key ->> 'lte')::numeric )
              )
            else true
          end
        ) from jsonb_object_keys(_attributes) key
      )
    )
$$;

create or replace view metadata.evos_marketplace_summary_aggregated_view as
select
  min(e.listing_price) as floor_price,
  max(e.top_offer) as top_offer,
  sum(e.last_sale) as total_volume,
  count(*) filter (where e.listing_price is not null) as listed,
  count(distinct e.owner) as unique_owners,
  count(*) as total
from metadata.evos_aggregated_view e;

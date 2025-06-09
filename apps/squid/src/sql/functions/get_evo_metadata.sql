create or replace function public.get_evo_metadata(_tokenId text)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
begin
  -- Try Evo first and enrich with species types
  select to_jsonb(e) || jsonb_build_object(
           'type', 'EVO',
           'primaryType', st."primary",
           'secondaryType', st.secondary
         )
  into result
  from public."Evo" e
  join public."SpeciesTypes" st on e.species = st.species
  where e."tokenId"::text = _tokenId;

  if result is not null then
    return result;
  end if;

  -- Try Egg next
  select to_jsonb(eg) || jsonb_build_object('type', 'EGG')
  into result
  from public."Egg" eg
  where eg."tokenId"::text = _tokenId;

  return result;
end;
$$;

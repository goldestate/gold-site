-- "Loft" joins the unit types. GOLD's own rentals are copied into the Rental
-- Desk under its broader types, and a loft is matched there as an apartment
-- rather than "other". Run in the Supabase SQL editor. Safe to re-run.

create or replace function public.map_unit_type_to_rental_property_type(p_unit_type text)
returns text
language sql
immutable
as $$
  select case p_unit_type
    when 'apartment' then 'apartment'
    when 'loft' then 'apartment'
    when 'duplex' then 'apartment'
    when 'penthouse' then 'apartment'
    when 'studio' then 'apartment'
    when 'villa' then 'villa'
    when 'townhouse' then 'villa'
    when 'twinhouse' then 'villa'
    when 'chalet' then 'chalet'
    when 'cabin' then 'chalet'
    when 'office' then 'office'
    when 'clinic' then 'office'
    when 'commercial' then 'retail'
    else 'other'
  end;
$$;

-- CHECK after running: should return 'apartment'.
-- select public.map_unit_type_to_rental_property_type('loft');

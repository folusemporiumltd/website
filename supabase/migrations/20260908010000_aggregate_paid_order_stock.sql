-- Aggregate repeated order lines before validating and deducting stock.
-- This RPC remains callable only by the server's service_role key.
create or replace function public.mark_order_paid(p_payment_reference text, p_amount_kobo integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_payment_status text;
  v_total numeric;
  v_item record;
begin
  select id, payment_status, total into v_order_id, v_payment_status, v_total
  from public.orders where payment_reference = p_payment_reference for update;
  if v_order_id is null then return null; end if;
  if v_payment_status = 'paid' then return v_order_id; end if;
  if round(v_total * 100) <> p_amount_kobo then raise exception 'Payment amount does not match order total'; end if;

  -- Lock and validate each variant once, using its total ordered quantity.
  for v_item in
    select a.variant_id, a.quantity, pv.stock_quantity, p.name as product_name
    from (
      select variant_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order_id and variant_id is not null
      group by variant_id
    ) a
    join public.product_variants pv on pv.id = a.variant_id
    join public.products p on p.id = pv.product_id
    for update of pv, p
  loop
    if v_item.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for %', v_item.product_name;
    end if;
  end loop;

  -- Lock and validate each non-variant product once.
  for v_item in
    select a.product_id, a.quantity, p.stock_quantity, p.name as product_name
    from (
      select product_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order_id and variant_id is null
      group by product_id
    ) a
    join public.products p on p.id = a.product_id
    for update of p
  loop
    if v_item.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for %', v_item.product_name;
    end if;
  end loop;

  for v_item in
    select variant_id, product_id, sum(quantity)::integer as quantity
    from public.order_items where order_id = v_order_id
    group by variant_id, product_id
  loop
    if v_item.variant_id is not null then
      update public.product_variants set stock_quantity = stock_quantity - v_item.quantity, updated_at = now()
      where id = v_item.variant_id;
    else
      update public.products set stock_quantity = stock_quantity - v_item.quantity, updated_at = now()
      where id = v_item.product_id;
    end if;
  end loop;

  update public.orders set payment_status = 'paid',
    status = case when status = 'pending' then 'processing' else status end,
    updated_at = now() where id = v_order_id;
  return v_order_id;
end;
$$;
revoke all on function public.mark_order_paid(text, integer) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, integer) to service_role;

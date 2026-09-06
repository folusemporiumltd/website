-- Payment-order RPCs must be callable only by trusted server code.
-- The Next.js routes use a server-only Supabase secret/service key; browsers keep using the publishable key.

drop function if exists public.create_pending_order(text, text, text, jsonb, text);
drop function if exists public.mark_order_paid(text);

create or replace function public.create_pending_order(
  p_email text,
  p_phone text,
  p_delivery_address text,
  p_items jsonb,
  p_payment_reference text,
  p_customer_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_subtotal numeric := 0;
  v_item record;
  v_product record;
  v_existing uuid;
begin
  if coalesce(trim(p_email), '') = '' or coalesce(trim(p_payment_reference), '') = '' then
    raise exception 'Email and payment reference are required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  select id into v_existing
  from public.orders
  where payment_reference = p_payment_reference
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  for v_item in
    select
      (value->>'id')::uuid as product_id,
      sum(greatest(1, least(coalesce((value->>'quantity')::integer, 1), 100)))::integer as quantity
    from jsonb_array_elements(p_items)
    group by (value->>'id')::uuid
  loop
    select id, name, price, stock_quantity, is_active
      into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found or not v_product.is_active then
      raise exception 'Product is unavailable';
    end if;
    if v_product.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  end loop;

  insert into public.orders (
    id, user_id, customer_name, email, status, payment_status, payment_reference,
    subtotal, delivery_fee, total, delivery_address, phone
  )
  values (
    v_order_id, auth.uid(), nullif(trim(p_customer_name), ''), nullif(trim(p_email), ''),
    'pending', 'pending', p_payment_reference, v_subtotal, 0, v_subtotal,
    nullif(trim(p_delivery_address), ''), nullif(trim(p_phone), '')
  );

  for v_item in
    select
      (value->>'id')::uuid as product_id,
      sum(greatest(1, least(coalesce((value->>'quantity')::integer, 1), 100)))::integer as quantity
    from jsonb_array_elements(p_items)
    group by (value->>'id')::uuid
  loop
    select id, name, price into v_product
    from public.products
    where id = v_item.product_id;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_item.quantity, v_product.price * v_item.quantity);
  end loop;

  return v_order_id;
end;
$$;

create or replace function public.mark_order_paid(
  p_payment_reference text,
  p_amount_kobo integer
)
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
  select id, payment_status, total
    into v_order_id, v_payment_status, v_total
  from public.orders
  where payment_reference = p_payment_reference
  for update;

  if v_order_id is null then
    return null;
  end if;
  if v_payment_status = 'paid' then
    return v_order_id;
  end if;
  if round(v_total * 100) <> p_amount_kobo then
    raise exception 'Payment amount does not match order total';
  end if;

  for v_item in
    select oi.product_id, sum(oi.quantity)::integer as quantity, p.stock_quantity, p.name
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = v_order_id
    group by oi.product_id, p.stock_quantity, p.name
    for update of p
  loop
    if v_item.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for %', v_item.name;
    end if;
  end loop;

  for v_item in
    select oi.product_id, sum(oi.quantity)::integer as quantity
    from public.order_items oi
    where oi.order_id = v_order_id
    group by oi.product_id
  loop
    update public.products
    set stock_quantity = stock_quantity - v_item.quantity,
        updated_at = now()
    where id = v_item.product_id;
  end loop;

  update public.orders
  set payment_status = 'paid',
      status = case when status = 'pending' then 'processing' else status end,
      updated_at = now()
  where id = v_order_id;

  return v_order_id;
end;
$$;

revoke execute on function public.create_pending_order(text, text, text, jsonb, text, text) from public, anon, authenticated;
revoke execute on function public.mark_order_paid(text, integer) from public, anon, authenticated;
grant execute on function public.create_pending_order(text, text, text, jsonb, text, text) to service_role;
grant execute on function public.mark_order_paid(text, integer) to service_role;

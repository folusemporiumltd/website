create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text check (char_length(title) <= 120),
  review text not null check (char_length(review) between 10 and 2000),
  reviewer_name text check (char_length(reviewer_name) <= 120),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text check (char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references auth.users(id) on delete set null,
  unique(order_id, product_id, user_id)
);

create index if not exists product_reviews_public_idx on public.product_reviews(product_id, created_at desc) where status = 'approved';
create index if not exists product_reviews_moderation_idx on public.product_reviews(status, created_at desc);

alter table public.product_reviews enable row level security;
grant select on public.product_reviews to anon, authenticated;
grant insert, update on public.product_reviews to authenticated;

drop policy if exists "Approved reviews are public" on public.product_reviews;
create policy "Approved reviews are public" on public.product_reviews for select to anon, authenticated using (status = 'approved');
drop policy if exists "Customers can read their reviews" on public.product_reviews;
create policy "Customers can read their reviews" on public.product_reviews for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.submit_product_review(
  p_order_id uuid,
  p_product_id uuid,
  p_rating integer,
  p_title text,
  p_review text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_review_id uuid;
  v_name text;
begin
  if v_user_id is null then raise exception 'Please sign in to submit your review.'; end if;
  if p_rating not between 1 and 5 then raise exception 'Rating must be between 1 and 5.'; end if;
  if char_length(trim(coalesce(p_review,''))) not between 10 and 2000 then raise exception 'Review must contain between 10 and 2000 characters.'; end if;
  if char_length(trim(coalesce(p_title,''))) > 120 then raise exception 'Review title is too long.'; end if;

  if not exists (
    select 1 from public.orders o
    where o.id = p_order_id
      and o.user_id = v_user_id
      and (o.payment_status = 'paid' or o.status = 'delivered')
      and exists (
        select 1 from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) item
        where coalesce(item->>'product_id', item->>'id') = p_product_id::text
      )
  ) then
    raise exception 'Only customers who purchased this product can review it.';
  end if;

  select nullif(trim(p.full_name),'') into v_name from public.profiles p where p.id = v_user_id;

  insert into public.product_reviews(product_id,order_id,user_id,rating,title,review,reviewer_name,status,updated_at,moderated_at,moderated_by,admin_note)
  values(p_product_id,p_order_id,v_user_id,p_rating,nullif(trim(coalesce(p_title,'')),''),trim(p_review),coalesce(v_name,'Verified customer'),'pending',now(),null,null,null)
  on conflict(order_id,product_id,user_id) do update set
    rating=excluded.rating,title=excluded.title,review=excluded.review,reviewer_name=excluded.reviewer_name,
    status='pending',updated_at=now(),moderated_at=null,moderated_by=null,admin_note=null
  returning id into v_review_id;
  return v_review_id;
end;
$$;

revoke all on function public.submit_product_review(uuid,uuid,integer,text,text) from public, anon;
grant execute on function public.submit_product_review(uuid,uuid,integer,text,text) to authenticated;

create or replace function public.list_admin_product_reviews()
returns table(id uuid,product_id uuid,product_name text,order_id uuid,user_id uuid,customer_name text,customer_email text,rating smallint,title text,review text,status text,admin_note text,created_at timestamptz,updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin') then raise exception 'Admin access required.'; end if;
  return query select r.id,r.product_id,p.name,r.order_id,r.user_id,r.reviewer_name,o.email,r.rating,r.title,r.review,r.status,r.admin_note,r.created_at,r.updated_at
  from public.product_reviews r join public.products p on p.id=r.product_id join public.orders o on o.id=r.order_id
  order by case r.status when 'pending' then 0 when 'approved' then 1 else 2 end,r.created_at desc;
end;
$$;
revoke all on function public.list_admin_product_reviews() from public, anon;
grant execute on function public.list_admin_product_reviews() to authenticated;

create or replace function public.admin_moderate_product_review(p_review_id uuid,p_status text,p_admin_note text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin') then raise exception 'Admin access required.'; end if;
  if p_status not in ('approved','rejected') then raise exception 'Invalid moderation status.'; end if;
  update public.product_reviews set status=p_status,admin_note=nullif(trim(coalesce(p_admin_note,'')),''),moderated_at=now(),moderated_by=auth.uid(),updated_at=now() where id=p_review_id;
  return found;
end;
$$;
revoke all on function public.admin_moderate_product_review(uuid,text,text) from public, anon;
grant execute on function public.admin_moderate_product_review(uuid,text,text) to authenticated;

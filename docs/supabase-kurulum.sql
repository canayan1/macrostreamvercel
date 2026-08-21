-- Kalibre Markets — hesap katmanı veritabanı kurulumu
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tek seferlik çalıştırılır; tekrar çalıştırmak zararsızdır.

-- 1) Kullanıcı kayıtları (portföy, izleme listesi, defter…) tek genel tabloda.
create table if not exists public.kalibre_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('portfoy','portfoyum','izleme','defter','seri')),
  name        text not null default '',
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists kalibre_items_user_kind_idx
  on public.kalibre_items (user_id, kind, updated_at desc);

-- 2) Row Level Security: herkes YALNIZCA kendi satırlarını görür ve değiştirir.
--    Sitedeki "anon" anahtarı herkese açıktır; veriyi koruyan katman budur.
alter table public.kalibre_items enable row level security;

drop policy if exists "kendi kayitlarini okur"    on public.kalibre_items;
drop policy if exists "kendi kayitlarini ekler"   on public.kalibre_items;
drop policy if exists "kendi kayitlarini gunceller" on public.kalibre_items;
drop policy if exists "kendi kayitlarini siler"   on public.kalibre_items;

create policy "kendi kayitlarini okur"
  on public.kalibre_items for select
  using (auth.uid() = user_id);

create policy "kendi kayitlarini ekler"
  on public.kalibre_items for insert
  with check (auth.uid() = user_id);

create policy "kendi kayitlarini gunceller"
  on public.kalibre_items for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "kendi kayitlarini siler"
  on public.kalibre_items for delete
  using (auth.uid() = user_id);

-- 3) Kullanıcı başına kayıt sınırı (kötüye kullanıma karşı basit fren).
create or replace function public.kalibre_items_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.kalibre_items where user_id = new.user_id) >= 200 then
    raise exception 'Kayıt sınırına ulaşıldı (200).';
  end if;
  return new;
end $$;

drop trigger if exists kalibre_items_limit_trg on public.kalibre_items;
create trigger kalibre_items_limit_trg
  before insert on public.kalibre_items
  for each row execute function public.kalibre_items_limit();

-- 4) updated_at otomatik tazelensin.
create or replace function public.kalibre_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists kalibre_items_touch_trg on public.kalibre_items;
create trigger kalibre_items_touch_trg
  before update on public.kalibre_items
  for each row execute function public.kalibre_touch();

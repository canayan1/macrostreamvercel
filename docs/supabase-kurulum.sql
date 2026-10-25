-- Kalibre Lab: hesap veritabanı kurulumu (Supabase)
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zararsızdır (idempotent). Adım adım kurulum: docs/HESAP-KURULUMU.md
--
-- Tutulanlar: profil (e-posta, ad, dil, izinler), kullanıcının kaydettiği stratejiler ve izleme
-- listeleri, lisans görüntüsü. Piyasa verisi, pozisyon, işlem geçmişi, MT5 eşleştirme kodu ve aracı
-- kurum anahtarları burada TUTULMAZ.
-- Her tabloda Row Level Security açıktır: sitedeki anon anahtarı herkese açıktır, veriyi koruyan
-- katman bu kurallardır. Hizmet rolü (service_role) RLS'i aşar ve yalnız Vercel sunucusunda durur.

-- ------------------------------------------------------------------ 1) profiller
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text,
  display_name          text check (display_name is null or char_length(display_name) <= 80),
  locale                text not null default 'en' check (locale in ('en', 'tr')),
  marketing_consent     boolean not null default false,
  marketing_consent_at  timestamptz,
  terms_accepted_at     timestamptz,
  terms_version         text check (terms_version is null or char_length(terms_version) <= 20),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- Ekleme yalnız tetikleyiciyle (kayıt anında); silme yalnız hesap silinince (CASCADE).

-- Kullanıcı yalnız bu sütunları değiştirebilir (e-posta ve tarihler sunucuda yönetilir).
revoke update on public.profiles from authenticated, anon;
grant select on public.profiles to authenticated;
grant update (display_name, locale, marketing_consent, terms_accepted_at, terms_version) on public.profiles to authenticated;

-- Kayıt olunca profil açılır. Dil, e-postayla girişte gönderilen meta veriden okunur.
create or replace function public.kalibre_profil_ac()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dil text := coalesce(new.raw_user_meta_data->>'locale', 'en');
begin
  insert into public.profiles (id, email, display_name, locale)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 80),
    case when dil in ('en', 'tr') then dil else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists kalibre_profil_ac_trg on auth.users;
create trigger kalibre_profil_ac_trg after insert on auth.users
  for each row execute function public.kalibre_profil_ac();

-- E-posta değişirse profile de yansır.
create or replace function public.kalibre_eposta_esle()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email, updated_at = now() where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists kalibre_eposta_esle_trg on auth.users;
create trigger kalibre_eposta_esle_trg after update of email on auth.users
  for each row execute function public.kalibre_eposta_esle();

-- Pazarlama izni değişince zamanı sunucu yazar; updated_at tazelenir.
create or replace function public.kalibre_profil_guncel()
returns trigger language plpgsql as $$
begin
  if new.marketing_consent is distinct from old.marketing_consent then
    new.marketing_consent_at = now();
  end if;
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists kalibre_profil_guncel_trg on public.profiles;
create trigger kalibre_profil_guncel_trg before update on public.profiles
  for each row execute function public.kalibre_profil_guncel();

-- Daha önce kayıt olmuş ama profili olmayan kullanıcılar (kurulumdan önce giriş yapılmışsa).
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- ------------------------------------------------------------------ 2) kullanıcı kayıtları
-- strateji: laboratuvar taslakları ve kaydedilen stratejiler (kural dosyası JSON'u)
-- izleme: sembol listeleri   ayar: arayüz tercihleri   not: kısa notlar
create table if not exists public.user_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('strateji', 'izleme', 'ayar', 'not')),
  name        text not null default '' check (char_length(name) <= 120),
  payload     jsonb not null default '{}'::jsonb check (pg_column_size(payload) <= 262144),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists user_items_user_kind_idx on public.user_items (user_id, kind, updated_at desc);

alter table public.user_items enable row level security;
drop policy if exists "user_items_select_own" on public.user_items;
drop policy if exists "user_items_insert_own" on public.user_items;
drop policy if exists "user_items_update_own" on public.user_items;
drop policy if exists "user_items_delete_own" on public.user_items;
create policy "user_items_select_own" on public.user_items for select using (auth.uid() = user_id);
create policy "user_items_insert_own" on public.user_items for insert with check (auth.uid() = user_id);
create policy "user_items_update_own" on public.user_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_items_delete_own" on public.user_items for delete using (auth.uid() = user_id);
grant select, insert, update, delete on public.user_items to authenticated;

-- Kullanıcı başına 200 kayıt (kötüye kullanıma karşı basit fren).
create or replace function public.kalibre_kayit_siniri()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.user_items where user_id = new.user_id) >= 200 then
    raise exception 'Kayıt sınırına ulaşıldı (200).';
  end if;
  return new;
end $$;

drop trigger if exists kalibre_kayit_siniri_trg on public.user_items;
create trigger kalibre_kayit_siniri_trg before insert on public.user_items
  for each row execute function public.kalibre_kayit_siniri();

create or replace function public.kalibre_tazele()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists kalibre_kayit_tazele_trg on public.user_items;
create trigger kalibre_kayit_tazele_trg before update on public.user_items
  for each row execute function public.kalibre_tazele();

-- ------------------------------------------------------------------ 3) lisans görüntüsü
-- Tek Kalibre Markets hesabı birden çok ürünü kapsar: her lisans bir ürüne aittir (product).
-- Şimdilik 'lab' (Kalibre Lab); sonraki ürünler yeni bir değerle eklenir, şema değişmez.
-- Asıl lisans kaydı Vercel'deki depodadır (Upstash). Bu tablo yalnız görüntüdür: anahtarın son 5
-- karakteri, durum ve bitiş. Satırları yalnız sunucu (hizmet rolü) yazar; kullanıcı yalnız okur.
create table if not exists public.licenses (
  id           text primary key,                 -- anahtarın özeti (anahtarın kendisi değil)
  user_id      uuid not null references auth.users(id) on delete cascade,
  product      text not null default 'lab' check (product ~ '^[a-z][a-z0-9-]{1,30}$'),
  key_hint     text not null check (char_length(key_hint) <= 8),
  status       text not null,
  valid_until  timestamptz not null,
  addons       text[] not null default array['motor', 'kopru'], -- ürün içindeki eklentiler (Lab: Motor, Köprü)
  beta         boolean not null default false,
  updated_at   timestamptz not null default now()
);
create index if not exists licenses_user_idx on public.licenses (user_id, product);
-- Önceki taslaktan yükseltme (sütunlar varsa dokunulmaz).
alter table public.licenses add column if not exists product text not null default 'lab';
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'licenses' and column_name = 'products') then
    alter table public.licenses rename column products to addons;
  end if;
end $$;

alter table public.licenses enable row level security;
drop policy if exists "licenses_select_own" on public.licenses;
create policy "licenses_select_own" on public.licenses for select using (auth.uid() = user_id);
revoke insert, update, delete on public.licenses from authenticated, anon;
grant select on public.licenses to authenticated;

-- ------------------------------------------------------------------ eski kurulum
-- Önceki taslakta "kalibre_items" tablosu vardı. Projede veri yoksa elle silinebilir:
--   drop table if exists public.kalibre_items;

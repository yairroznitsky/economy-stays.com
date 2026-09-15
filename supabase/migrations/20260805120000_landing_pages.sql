-- Landing page system for Economy Stays hotel ads

create extension if not exists "pgcrypto";

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  country_code text not null,
  lat double precision not null,
  lng double precision not null,
  airport_code text,
  kayak_destination_id text,
  kayak_city_slug text,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists cities_active_priority_idx
  on public.cities (active, priority desc);

create table if not exists public.landing_page_intents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  category text not null,
  star_rating integer,
  amenities jsonb,
  audience text,
  prompt_notes text,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  intent_id uuid references public.landing_page_intents (id) on delete restrict,
  path text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  noindex boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (city_id, intent_id)
);

create index if not exists landing_pages_status_idx
  on public.landing_pages (status);

create table if not exists public.landing_page_content (
  id uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references public.landing_pages (id) on delete cascade,
  version integer not null,
  is_current boolean not null default false,
  h1 text not null,
  subtitle text not null,
  meta_title text not null,
  meta_description text not null,
  intro_text text not null,
  faqs jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  cta_text text not null,
  search_defaults jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now(),
  unique (landing_page_id, version)
);

create unique index if not exists landing_page_content_current_idx
  on public.landing_page_content (landing_page_id)
  where is_current = true;

create table if not exists public.landing_page_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in ('page_view', 'search', 'clickout')),
  landing_page_id uuid references public.landing_pages (id) on delete set null,
  city_id uuid references public.cities (id) on delete set null,
  intent_id uuid references public.landing_page_intents (id) on delete set null,
  session_landing_id text,
  gclid text,
  gbraid text,
  wbraid text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  click_id text,
  params jsonb not null default '{}'::jsonb
);

create index if not exists landing_page_events_page_created_idx
  on public.landing_page_events (landing_page_id, created_at desc);

create index if not exists landing_page_events_gclid_idx
  on public.landing_page_events (gclid)
  where gclid is not null;

alter table public.cities enable row level security;
alter table public.landing_page_intents enable row level security;
alter table public.landing_pages enable row level security;
alter table public.landing_page_content enable row level security;
alter table public.landing_page_events enable row level security;

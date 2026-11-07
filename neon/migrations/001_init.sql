-- cardxflow: initial Neon schema (fresh start)
-- Run once in Neon Console -> SQL Editor.
create extension if not exists pgcrypto;

-- App users. id = Better Auth (Neon Auth) user id.
-- New users get approved=false. Approve manually:
--   update users set approved = true where email = 'someone@example.com';
create table if not exists users (
  id            text primary key,
  email         text unique not null,
  full_name     text,
  approved      boolean not null default false,
  is_admin      boolean not null default false,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now()
);

create table if not exists folders (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references users(id) on delete cascade,
  name          text not null,
  color         text,
  parent_id     uuid references folders(id) on delete cascade,
  "order"       integer not null default 0,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now()
);
create index if not exists folders_user_idx on folders(user_id);

create table if not exists tags (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references users(id) on delete cascade,
  name          text not null,
  color         text,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists cards (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null references users(id) on delete cascade,
  folder_id      uuid references folders(id) on delete set null,
  title          text not null default '',
  color          text,
  content_blocks jsonb not null default '[]'::jsonb,
  tags           text[] not null default '{}',
  is_favorite    boolean not null default false,
  is_smart_card  boolean not null default false,
  metadata       jsonb not null default '{}'::jsonb,
  "order"        integer not null default 0,
  created_date   timestamptz not null default now(),
  updated_date   timestamptz not null default now()
);
create index if not exists cards_user_idx on cards(user_id);
create index if not exists cards_folder_idx on cards(folder_id);

-- AI providers (OpenRouter, Gemini, GitHub Models, any OpenAI-compatible).
-- api_key is encrypted by the server before insert; never sent to browser.
create table if not exists ai_providers (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null references users(id) on delete cascade,
  name              text not null,
  base_url          text not null,
  api_key_encrypted text,
  models            jsonb not null default '[]'::jsonb,  -- [{id, context_window, priority}]
  is_default        boolean not null default false,
  created_date      timestamptz not null default now(),
  updated_date      timestamptz not null default now()
);

-- Hidden per-card AI chat
create table if not exists card_ai_messages (
  id            uuid primary key default gen_random_uuid(),
  card_id       uuid not null references cards(id) on delete cascade,
  user_id       text not null references users(id) on delete cascade,
  role          text not null check (role in ('user','assistant','system')),
  content       text not null,
  model         text,
  tokens        integer,
  created_date  timestamptz not null default now()
);
create index if not exists card_ai_messages_card_idx on card_ai_messages(card_id, created_date);

-- Per-card memory: rolling summary + pinned facts
create table if not exists card_ai_memory (
  card_id         uuid primary key references cards(id) on delete cascade,
  user_id         text not null references users(id) on delete cascade,
  summary         text not null default '',
  pinned_facts    jsonb not null default '[]'::jsonb,
  summarized_upto timestamptz,
  updated_date    timestamptz not null default now()
);

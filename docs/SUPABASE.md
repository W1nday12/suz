# Сүз · опциональная синхронизация через Supabase

Приложение уже умеет хранить прогресс локально (IndexedDB). Опрос Supabase не подключён и не используется по умолчанию.

## Что можно добавить позже

1. **Регистрация/вход** — email + magic link через Supabase Auth.
2. **Синхронизация профиля** — таблица `profiles` (user_id, display_name, created_at) и `progress` (one row per user with JSONB for mistakes, wordStats, lessonsCompleted и т.д.).
3. **Синхронизация урока** — при `finishLesson`/`finishReview` отправлять результат на сервер, получать обратно и применять SRS-обновления.
4. **Дуэли** — таблица `duels` (id, challenger_id, opponent_id, status, created_at, expires_at, payload) с realtime-каналами для живого поражения/победы.

## Пример SQL

```sql
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Ученик',
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

## Env

Добавить в `vite.config.ts` / `src/lib/sync.ts` переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.

> При сдаче серверных данных Supabase нужен публичный проект и RLS-политики доступа.

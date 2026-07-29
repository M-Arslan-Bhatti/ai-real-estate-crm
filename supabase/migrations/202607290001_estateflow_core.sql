create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'sales_agent');
create type public.lead_status as enum ('new', 'qualified', 'viewing', 'negotiation', 'won', 'lost');
create type public.lead_temperature as enum ('hot', 'warm', 'cold');
create type public.lead_source as enum ('website', 'whatsapp', 'facebook', 'manual');
create type public.message_channel as enum ('whatsapp', 'email', 'sms');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'sent', 'failed');
create type public.workflow_status as enum ('queued', 'running', 'completed', 'failed', 'retrying');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'sales_agent',
  status text not null default 'active' check (status in ('active', 'inactive')),
  specialization text[] not null default '{}',
  languages text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  normalized_phone text,
  source public.lead_source not null default 'manual',
  status public.lead_status not null default 'new',
  temperature public.lead_temperature not null default 'cold',
  score integer not null default 0 check (score between 0 and 100),
  score_reason text,
  intent text,
  budget_min bigint,
  budget_max bigint,
  preferred_area text,
  property_type text,
  purchase_timeline text,
  summary text,
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  next_follow_up_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index leads_normalized_phone_unique
  on public.leads(normalized_phone)
  where normalized_phone is not null;
create unique index leads_email_unique
  on public.leads(lower(email))
  where email is not null;
create index leads_status_idx on public.leads(status);
create index leads_agent_idx on public.leads(assigned_agent_id);
create index leads_next_follow_up_idx on public.leads(next_follow_up_at);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  title text not null,
  description text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index timeline_lead_created_idx on public.timeline_events(lead_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index tasks_assignee_due_idx on public.tasks(assigned_to, due_at);

create table public.message_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel public.message_channel not null,
  content text not null,
  status public.approval_status not null default 'pending',
  generated_by text not null default 'rules',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  sent_at timestamptz,
  external_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index message_drafts_status_idx on public.message_drafts(status, created_at desc);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_name text not null,
  entity_type text not null,
  entity_id uuid,
  status public.workflow_status not null default 'queued',
  attempt_count integer not null default 0,
  idempotency_key text not null unique,
  error_message text,
  duration_ms numeric,
  next_retry_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index workflow_status_retry_idx on public.workflow_runs(status, next_retry_at);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  signature_valid boolean not null default false,
  payload jsonb not null,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

create table public.assignment_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  priority integer not null default 100,
  active boolean not null default true,
  conditions jsonb not null default '{}'::jsonb,
  target_agent_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when not exists (select 1 from public.profiles)
      then 'admin'::public.app_role
      else 'sales_agent'::public.app_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute procedure public.touch_updated_at();
create trigger leads_touch_updated_at before update on public.leads
for each row execute procedure public.touch_updated_at();
create trigger drafts_touch_updated_at before update on public.message_drafts
for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.timeline_events enable row level security;
alter table public.tasks enable row level security;
alter table public.message_drafts enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.webhook_events enable row level security;
alter table public.assignment_rules enable row level security;

create policy "profiles self or admin read" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "leads assigned or admin read" on public.leads
for select to authenticated
using (assigned_agent_id = auth.uid() or public.is_admin());
create policy "authenticated create leads" on public.leads
for insert to authenticated
with check (assigned_agent_id = auth.uid() or public.is_admin() or assigned_agent_id is null);
create policy "leads assigned or admin update" on public.leads
for update to authenticated
using (assigned_agent_id = auth.uid() or public.is_admin())
with check (assigned_agent_id = auth.uid() or public.is_admin());
create policy "admin delete leads" on public.leads
for delete to authenticated
using (public.is_admin());

create policy "timeline follows lead access" on public.timeline_events
for select to authenticated
using (exists (
  select 1 from public.leads
  where leads.id = timeline_events.lead_id
    and (leads.assigned_agent_id = auth.uid() or public.is_admin())
));
create policy "timeline authenticated insert" on public.timeline_events
for insert to authenticated
with check (actor_id = auth.uid() or public.is_admin());

create policy "tasks assignee or admin all" on public.tasks
for all to authenticated
using (assigned_to = auth.uid() or public.is_admin())
with check (assigned_to = auth.uid() or public.is_admin());

create policy "drafts follow lead access" on public.message_drafts
for select to authenticated
using (exists (
  select 1 from public.leads
  where leads.id = message_drafts.lead_id
    and (leads.assigned_agent_id = auth.uid() or public.is_admin())
));
create policy "drafts follow lead write" on public.message_drafts
for all to authenticated
using (exists (
  select 1 from public.leads
  where leads.id = message_drafts.lead_id
    and (leads.assigned_agent_id = auth.uid() or public.is_admin())
))
with check (exists (
  select 1 from public.leads
  where leads.id = message_drafts.lead_id
    and (leads.assigned_agent_id = auth.uid() or public.is_admin())
));

create policy "admin workflow access" on public.workflow_runs
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin webhook access" on public.webhook_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin assignment rule access" on public.assignment_rules
for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.timeline_events;
alter publication supabase_realtime add table public.message_drafts;

comment on table public.message_drafts is 'Human approval outbox. Messages may only be sent after approved status.';

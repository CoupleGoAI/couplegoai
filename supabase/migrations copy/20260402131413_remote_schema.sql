drop policy "Users can insert own messages" on "public"."messages";

revoke update on table "public"."profiles" from "authenticated";


  create table "public"."rate_limits" (
    "user_id" uuid not null,
    "endpoint" text not null,
    "window_start" timestamp with time zone not null,
    "count" integer not null default 0
      );


alter table "public"."rate_limits" enable row level security;

alter table "public"."couples" add column "dating_start_date" date;

alter table "public"."couples" add column "help_focus" text;

CREATE UNIQUE INDEX rate_limits_pkey ON public.rate_limits USING btree (user_id, endpoint, window_start);

CREATE INDEX rate_limits_window_start_idx ON public.rate_limits USING btree (window_start);

alter table "public"."rate_limits" add constraint "rate_limits_pkey" PRIMARY KEY using index "rate_limits_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_endpoint text, p_max_per_minute integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_window timestamptz := date_trunc('minute', now());
  v_count  integer;
BEGIN
  INSERT INTO public.rate_limits (user_id, endpoint, window_start, count)
  VALUES (p_user_id, p_endpoint, v_window, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_per_minute;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_pairing_tokens()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  DELETE FROM public.pairing_tokens
  WHERE used = true OR expires_at < now();
$function$
;

grant delete on table "public"."rate_limits" to "anon";

grant insert on table "public"."rate_limits" to "anon";

grant references on table "public"."rate_limits" to "anon";

grant select on table "public"."rate_limits" to "anon";

grant trigger on table "public"."rate_limits" to "anon";

grant truncate on table "public"."rate_limits" to "anon";

grant update on table "public"."rate_limits" to "anon";

grant delete on table "public"."rate_limits" to "authenticated";

grant insert on table "public"."rate_limits" to "authenticated";

grant references on table "public"."rate_limits" to "authenticated";

grant select on table "public"."rate_limits" to "authenticated";

grant trigger on table "public"."rate_limits" to "authenticated";

grant truncate on table "public"."rate_limits" to "authenticated";

grant update on table "public"."rate_limits" to "authenticated";

grant delete on table "public"."rate_limits" to "service_role";

grant insert on table "public"."rate_limits" to "service_role";

grant references on table "public"."rate_limits" to "service_role";

grant select on table "public"."rate_limits" to "service_role";

grant trigger on table "public"."rate_limits" to "service_role";

grant truncate on table "public"."rate_limits" to "service_role";

grant update on table "public"."rate_limits" to "service_role";


  create policy "Partners can view couple setup messages"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using (((conversation_type = 'couple_setup'::public.conversation_type) AND (user_id = public.get_partner_id())));




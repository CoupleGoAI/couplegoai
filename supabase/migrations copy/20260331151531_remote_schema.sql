create extension if not exists "pg_cron" with schema "pg_catalog";

alter table "public"."messages" alter column "conversation_type" drop default;

alter type "public"."conversation_type" rename to "conversation_type__old_version_to_be_dropped";

create type "public"."conversation_type" as enum ('chat', 'onboarding', 'couple_setup', 'couple_chat');

alter table "public"."messages" alter column conversation_type type "public"."conversation_type" using conversation_type::text::"public"."conversation_type";

alter table "public"."messages" alter column "conversation_type" set default 'chat'::public.conversation_type;

drop type "public"."conversation_type__old_version_to_be_dropped";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_pairing_tokens()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  delete from public.pairing_tokens
  where used = true
     or expires_at < now();
$function$
;


  create policy "Partners can view couple chat messages"
  on "public"."messages"
  as permissive
  for select
  to authenticated
using (((conversation_type = 'couple_chat'::public.conversation_type) AND (user_id = public.get_partner_id())));




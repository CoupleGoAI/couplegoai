drop policy "Users can view partner profile" on "public"."profiles";


  create policy "Users can view partner profile"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((id = public.get_partner_id()));



  create policy "authenticated users can receive pairing broadcasts"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using ((realtime.topic() ~~ 'pairing:%'::text));



  create policy "authenticated users can send pairing broadcasts"
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check ((realtime.topic() ~~ 'pairing:%'::text));




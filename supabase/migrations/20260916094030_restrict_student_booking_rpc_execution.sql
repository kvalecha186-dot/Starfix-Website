alter function public.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) security invoker;
revoke execute on function public.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) to authenticated;

-- Starfix Admin: live operational metrics
-- These functions are intentionally admin-only. They derive mentor/learner
-- metrics from real Starfix activity tables instead of catalog counters.

create or replace function public.get_admin_mentor_metrics()
returns table (
  mentor_id uuid, profile_id uuid, name text, email text, headline text, company text,
  category text, years_experience integer, location text, education text, linkedin_url text,
  onboarding_completed boolean, catalog_rating numeric, catalog_students_count integer,
  active_mentees bigint, total_bookings bigint, confirmed_or_completed_sessions bigint,
  completed_sessions bigint, cancelled_sessions bigint, review_count bigint,
  verified_review_rating numeric, feedback_count bigint, feedback_rating numeric,
  future_available_slots bigint, mentor_status text, performance_band text
)
language sql stable security invoker set search_path = ''
as $$
  with booking_stats as (
    select b.mentor_id,
      count(*) total_bookings,
      count(*) filter (where b.status in ('confirmed','completed')) confirmed_or_completed_sessions,
      count(*) filter (where b.status='completed') completed_sessions,
      count(*) filter (where b.status in ('cancelled','canceled')) cancelled_sessions,
      count(distinct b.student_id) filter (where b.status in ('confirmed','completed')) active_mentees
    from public.bookings b where b.mentor_id is not null group by b.mentor_id
  ), review_stats as (
    select r.mentor_id,count(*) review_count,round(avg(r.rating)::numeric,2) verified_review_rating
    from public.reviews r group by r.mentor_id
  ), feedback_stats as (
    select f.mentor_id,count(*) feedback_count,round(avg(f.rating)::numeric,2) feedback_rating
    from public.mentor_feedback f group by f.mentor_id
  ), availability_stats as (
    select a.mentor_id,count(*) filter (where a.status='available' and a.start_at>now()) future_available_slots
    from public.mentor_availability a group by a.mentor_id
  )
  select m.id,m.profile_id,coalesce(m.name,p.full_name,'Unnamed mentor'),coalesce(m.email,p.email),
    m.headline,m.company,m.category,m.years_experience,m.location,m.education,m.linkedin_url,
    coalesce(m.onboarding_completed,false),m.rating,coalesce(m.students_count,0),
    coalesce(bs.active_mentees,0),coalesce(bs.total_bookings,0),
    coalesce(bs.confirmed_or_completed_sessions,0),coalesce(bs.completed_sessions,0),
    coalesce(bs.cancelled_sessions,0),coalesce(rs.review_count,0),rs.verified_review_rating,
    coalesce(fs.feedback_count,0),fs.feedback_rating,coalesce(av.future_available_slots,0),
    case when m.profile_id is not null then 'Registered mentor' else 'Catalog listing' end,
    case
      when coalesce(bs.confirmed_or_completed_sessions,0)=0 and coalesce(bs.active_mentees,0)=0
       and coalesce(rs.review_count,0)=0 and coalesce(fs.feedback_count,0)=0 then 'Insufficient live data'
      when coalesce(rs.review_count,0)>=3 and coalesce(rs.verified_review_rating,0)>=4.5
       and coalesce(bs.completed_sessions,0)>=5 then 'Strong live signals'
      when coalesce(rs.review_count,0)>=1 and coalesce(rs.verified_review_rating,0)>=4.0
       and coalesce(bs.confirmed_or_completed_sessions,0)>=2 then 'Established'
      when coalesce(bs.confirmed_or_completed_sessions,0)>0
       or coalesce(rs.review_count,0)>0 or coalesce(fs.feedback_count,0)>0 then 'Developing'
      else 'Insufficient live data'
    end
  from public.mentors m left join public.profiles p on p.id=m.profile_id
  left join booking_stats bs on bs.mentor_id=m.id
  left join review_stats rs on rs.mentor_id=m.id
  left join feedback_stats fs on fs.mentor_id=m.id
  left join availability_stats av on av.mentor_id=m.id
  where public.is_admin()
  order by coalesce(bs.active_mentees,0) desc,coalesce(bs.completed_sessions,0) desc,m.name;
$$;

create or replace function public.get_admin_learner_metrics()
returns table (
  learner_id uuid,name text,email text,country text,career_goal text,level text,created_at timestamptz,
  progress_records bigint,average_progress numeric,max_streak integer,total_xp bigint,
  active_mentor_count bigint,completed_or_confirmed_sessions bigint,last_active_date date,learner_status text
)
language sql stable security invoker set search_path = ''
as $$
  with progress_stats as (
    select up.user_id,count(*) progress_records,round(avg(up.overall_progress)::numeric,1) average_progress,
      coalesce(max(up.streak),0) max_streak,coalesce(sum(up.xp),0) total_xp,max(up.last_active_date) last_active_date
    from public.user_progress up group by up.user_id
  ), mentor_stats as (
    select b.student_id,
      count(distinct b.mentor_id) filter (where b.status in ('confirmed','completed')) active_mentor_count,
      count(*) filter (where b.status in ('confirmed','completed')) completed_or_confirmed_sessions
    from public.bookings b group by b.student_id
  )
  select p.id,coalesce(p.full_name,p.email,'Unnamed learner'),p.email,p.country,coalesce(p.career_goal,p.goal_title),p.level,p.created_at,
    coalesce(ps.progress_records,0),coalesce(ps.average_progress,0),coalesce(ps.max_streak,0),coalesce(ps.total_xp,0),
    coalesce(ms.active_mentor_count,0),coalesce(ms.completed_or_confirmed_sessions,0),ps.last_active_date,
    case when ps.last_active_date>=current_date-7 then 'Active'
         when ps.last_active_date>=current_date-21 then 'At risk' else 'Inactive' end
  from public.profiles p left join progress_stats ps on ps.user_id=p.id left join mentor_stats ms on ms.student_id=p.id
  where p.role='student' and public.is_admin() order by p.created_at desc;
$$;

create or replace function public.get_admin_overview_metrics()
returns table (
  registered_learners bigint,mentor_listings bigint,registered_mentors bigint,active_mentees bigint,
  total_bookings bigint,completed_sessions bigint,verified_reviews bigint,growth_paths bigint,
  progress_records bigint,explore_items bigint
)
language sql stable security invoker set search_path = ''
as $$
  select
    (select count(*) from public.profiles where role='student'),
    (select count(*) from public.mentors),
    (select count(*) from public.mentors where profile_id is not null),
    (select count(distinct b.student_id) from public.bookings b where b.student_id is not null and b.status in ('confirmed','completed')),
    (select count(*) from public.bookings),
    (select count(*) from public.bookings where status='completed'),
    (select count(*) from public.reviews),
    (select count(*) from public.growth_paths),
    (select count(*) from public.user_progress),
    (select count(*) from public.explore_content)
  where public.is_admin();
$$;

revoke all on function public.get_admin_mentor_metrics() from public,anon;
revoke all on function public.get_admin_learner_metrics() from public,anon;
revoke all on function public.get_admin_overview_metrics() from public,anon;
grant execute on function public.get_admin_mentor_metrics() to authenticated;
grant execute on function public.get_admin_learner_metrics() to authenticated;
grant execute on function public.get_admin_overview_metrics() to authenticated;

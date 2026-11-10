-- profile_id nullable: these are catalog listings, not yet claimed by a
-- real logged-in mentor account (there's no mentor-signup flow yet).
-- "A mentor can update their own listing" policy already only matches
-- when auth.uid() = profile_id, so a NULL profile_id just means nobody
-- can self-edit it yet — safe by construction, not by omission.
alter table public.mentors
  alter column profile_id drop not null,
  add column name text,
  add column initials text,
  add column color text,
  add column category text,
  add column skills text[] not null default '{}',
  add column price text,
  add column free boolean not null default false,
  add column availability text,
  add column students_count integer not null default 0;

insert into public.mentors (legacy_id, name, initials, color, headline, company, category, rating, students_count, price, free, availability, skills, languages)
values
  (1,  'Aria Chen',      'AC', '#6366F1', 'Senior ML Engineer',            'Google',           'AI/ML',             4.9, 1240, '₹2,500/hr', false, 'Today',     '{PyTorch,NLP,"Computer Vision"}', '{English}'),
  (2,  'Marcus Webb',    'MW', '#E85D75', 'Growth Coach',                  'a16z Portfolio',   'Entrepreneurship',  4.8, 890,  '₹3,200/hr', false, 'Tomorrow',  '{"Startup Strategy",Fundraising,GTM}', '{English}'),
  (3,  'Priya Sharma',   'PS', '#20B2AA', 'Lead UX Designer',              'Figma',            'UI/UX',             5.0, 2100, 'Free',      true,  'Today',     '{Figma,"Design Systems","User Research"}', '{English,Hindi}'),
  (4,  'Daniel Park',    'DP', '#F4A261', 'Certified Financial Planner',   'Fidelity',         'Finance',           4.7, 567,  '₹1,800/hr', false, 'This week', '{Investing,"Tax Planning",Budgeting}', '{English}'),
  (5,  'Sofia Torres',   'ST', '#A78BFA', 'Software Engineer',             'Stripe',           'Coding',            4.9, 1580, 'Free',      true,  'Today',     '{Python,React,"System Design"}', '{English}'),
  (6,  'Rahul Gupta',    'RG', '#34D399', 'IELTS Trainer',                 'British Council',  'Languages',         4.8, 3400, '₹1,200/hr', false, 'Today',     '{IELTS,TOEFL,"Business English"}', '{English,Hindi}'),
  (7,  'Emma Walsh',     'EW', '#FB923C', 'Content Strategist',            'HubSpot',          'Content',           4.6, 720,  '₹2,000/hr', false, 'Tomorrow',  '{Instagram,YouTube,"Brand Building"}', '{English}'),
  (8,  'Kenji Nakamura', 'KN', '#38BDF8', 'Communication Coach',           'TEDx Speaker',     'Communication',     4.9, 890,  '₹2,800/hr', false, 'Today',     '{"Public Speaking",Storytelling,Confidence}', '{English}'),
  (9,  'Jake Morrison',  'JM', '#F87171', 'Certified Personal Trainer',    'Equinox',          'Fitness',           4.8, 1120, '₹1,500/hr', false, 'Today',     '{"Strength Training",Nutrition,"Fat Loss"}', '{English}'),
  (10, 'Leela Anand',    'LA', '#14B8A6', 'Meditation & Mindfulness Coach','Headspace',        'Meditation',        4.9, 640,  'Free',      true,  'Tomorrow',  '{Meditation,Breathwork,"Stress Relief"}', '{English,Hindi}');

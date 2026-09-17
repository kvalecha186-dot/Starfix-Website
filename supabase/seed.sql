-- ============================================================
-- STARFIX DATABASE SEED DATA (COMPATIBLE WITH UUID PRIMARY KEYS)
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql
-- ============================================================

-- 1. SEED GROWTH PATHS
insert into public.growth_paths (id, slug, title, category, description, timeline, level, color, milestones_count)
values
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'coding', 'Coding & Development', 'Career & Tech', 'Become a software developer from beginner to advanced with full-stack mastery.', '3–6 months', 'All Levels', '#6366F1', 5),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'ai-ml', 'AI & Machine Learning', 'Career & Tech', 'Learn to build and train intelligent machine learning models from scratch.', '4–8 months', 'Intermediate', '#8B5CF6', 5),
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'uiux', 'UI/UX Design', 'Career & Tech', 'Design digital products people genuinely love to use.', '3–5 months', 'All Levels', '#EC4899', 5),
  ('c0000000-0000-0000-0000-000000000004'::uuid, 'finance', 'Finance & Investing', 'Career & Tech', 'Understand money, markets, and long-term portfolio building deeply.', '4–6 months', 'Beginner', '#059669', 5),
  ('c0000000-0000-0000-0000-000000000005'::uuid, 'communication', 'Communication & Leadership', 'Mindset', 'Speak with clarity, unshakeable confidence, and executive presence.', '2–4 months', 'All Levels', '#F59E0B', 5),
  ('c0000000-0000-0000-0000-000000000006'::uuid, 'entrepreneurship', 'Entrepreneurship & Startups', 'Career & Tech', 'Turn your idea into a venture-backed or bootstrapped real business.', 'Ongoing', 'All Levels', '#D97706', 5),
  ('c0000000-0000-0000-0000-000000000007'::uuid, 'meditation', 'Meditation & Mindfulness', 'Mindset', 'Build a calm, focused mind through daily meditation and breathwork.', '1–3 months', 'All Levels', '#8B5CF6', 5),
  ('c0000000-0000-0000-0000-000000000008'::uuid, 'fitness', 'Strength & Physical Longevity', 'Health & Fitness', 'Build strength, optimize nutrition, and develop sustainable physical habits.', '3–6 months', 'All Levels', '#EF4444', 5)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  timeline = excluded.timeline,
  color = excluded.color;

-- 2. SEED MILESTONES
insert into public.milestones (id, path_id, title, description, order_index, xp_reward)
values
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Python & Web Fundamentals', 'Core syntax, control flow, functions, and web basics', 1, 50),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Frontend & React Mastery', 'Component architectures, state management, modern CSS', 2, 75),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Backend APIs & Databases', 'RESTful services, PostgreSQL, auth, and schema design', 3, 100),
  ('d0000000-0000-0000-0000-000000000004'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'System Design & Scalability', 'Caching, queues, microservices, and load balancing', 4, 125),
  ('d0000000-0000-0000-0000-000000000005'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Full-Stack Capstone Project', 'End-to-end production application deployment', 5, 200),

  ('d0000000-0000-0000-0000-000000000006'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Linear Algebra & Calculus for ML', 'Mathematical foundations behind gradient descent', 1, 50),
  ('d0000000-0000-0000-0000-000000000007'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'PyTorch Fundamentals', 'Tensors, autograd, and building basic networks', 2, 75),
  ('d0000000-0000-0000-0000-000000000008'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Computer Vision & CNNs', 'Convolutional layers, feature extraction, transfer learning', 3, 100),
  ('d0000000-0000-0000-0000-000000000009'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'NLP & Transformers', 'Attention mechanisms, tokenization, and LLM fine-tuning', 4, 125),
  ('d0000000-0000-0000-0000-000000000010'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Model Deployment & MLOps', 'Serving models with ONNX, FastAPI, and Docker', 5, 200),

  ('d0000000-0000-0000-0000-000000000011'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Design Systems & Figma Basics', 'Typography, color palettes, auto-layout, and components', 1, 50),
  ('d0000000-0000-0000-0000-000000000012'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Wireframing & Prototyping', 'Interactive prototypes and user journeys', 2, 75),
  ('d0000000-0000-0000-0000-000000000013'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'User Research & Testing', 'Usability testing, interviewing, and analytics synthesis', 3, 100),
  ('d0000000-0000-0000-0000-000000000014'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Mobile & Web Interaction Design', 'Micro-interactions, animations, and accessibility', 4, 125),
  ('d0000000-0000-0000-0000-000000000015'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Portfolio Case Study Launch', 'Comprehensive product case study for top design roles', 5, 200)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  xp_reward = excluded.xp_reward;

-- 3. SEED MENTORS
insert into public.mentors (
  id, mentor_num, name, initials, color, title, company, category, rating, students_count,
  price, free, availability, skills, bio, about, location, response_time,
  pricing, availability_slots
)
values
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 1, 'Aria Chen', 'AC', '#6366F1', 'Senior ML Engineer', 'Google', 'AI/ML', 4.9, 1240,
    '₹2,500/hr', false, 'Today',
    array['PyTorch', 'NLP', 'Computer Vision']::text[],
    'Aria spent six years building recommendation systems at Google before turning to teaching full-time.',
    'Aria began as a backend engineer, drifted into machine learning through a fraud-detection project, and never looked back.',
    'San Francisco, CA (Remote)', 'Within 2 hours',
    '[{"label":"30 min Session","price":"₹1,299","sub":"Quick check-in or Q&A"},{"label":"60 min Session","price":"₹2,500","sub":"Full teaching session"}]'::jsonb,
    '[{"date":"Today","slots":["4:00 PM","6:30 PM"]},{"date":"Tomorrow","slots":["10:00 AM","2:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid, 2, 'Marcus Webb', 'MW', '#E85D75', 'Growth Coach', 'a16z Portfolio', 'Entrepreneurship', 4.8, 890,
    '₹3,200/hr', false, 'Tomorrow',
    array['Startup Strategy', 'Fundraising', 'GTM']::text[],
    'Ex-founder with 2 exits. Mentored 40+ founders across YC and Techstars cohorts.',
    'Marcus helps founders find true product-market fit, design scalable GTM strategies, and pitch top-tier venture funds.',
    'New York, NY (Remote)', 'Within 4 hours',
    '[{"label":"45 min Strategy","price":"₹3,200","sub":"Pitch deck & GTM teardown"},{"label":"Monthly Retainer","price":"₹12,000","sub":"Bi-weekly sessions + Slack"}]'::jsonb,
    '[{"date":"Tomorrow","slots":["11:00 AM","3:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid, 3, 'Priya Sharma', 'PS', '#20B2AA', 'Lead UX Designer', 'Figma', 'UI/UX', 5.0, 2100,
    'Free', true, 'Today',
    array['Figma', 'Design Systems', 'User Research']::text[],
    'Design systems architect at Figma. Passionate about helping aspiring designers break into tech.',
    'Priya designs the foundational design system primitives used by millions of designers around the world.',
    'Bengaluru, India (Remote)', 'Within 1 hour',
    '[{"label":"30 min Portfolio Review","price":"Free","sub":"Community mentorship slot"},{"label":"60 min Deep Dive","price":"₹1,800","sub":"Comprehensive case study audit"}]'::jsonb,
    '[{"date":"Today","slots":["2:00 PM","5:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004'::uuid, 4, 'Daniel Park', 'DP', '#F4A261', 'Certified Financial Planner', 'Fidelity', 'Finance', 4.7, 567,
    '₹1,800/hr', false, 'This week',
    array['Investing', 'Tax Planning', 'Budgeting']::text[],
    'Helps high earners and young professionals build institutional-grade personal portfolios.',
    'Daniel breaks down complex asset allocation, risk mitigation, and retirement planning into crystal clear steps.',
    'Chicago, IL (Remote)', 'Within 6 hours',
    '[{"label":"45 min Planning Session","price":"₹1,800","sub":"Personal finance audit"}]'::jsonb,
    '[{"date":"Thursday","slots":["10:00 AM","4:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005'::uuid, 5, 'Sofia Torres', 'ST', '#A78BFA', 'Software Engineer', 'Stripe', 'Coding', 4.9, 1580,
    'Free', true, 'Today',
    array['Python', 'React', 'System Design']::text[],
    'Building developer platforms at Stripe. Mentored 150+ engineers into FAANG and unicorn startups.',
    'Sofia focuses on clean code craftsmanship, distributed architectures, and preparing engineers for senior technical interviews.',
    'London, UK (Remote)', 'Within 2 hours',
    '[{"label":"30 min Intro Call","price":"Free","sub":"Career trajectory review"},{"label":"60 min Mock Interview","price":"₹2,200","sub":"System design or coding live"}]'::jsonb,
    '[{"date":"Today","slots":["3:00 PM","7:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000006'::uuid, 6, 'Rahul Gupta', 'RG', '#34D399', 'IELTS Trainer', 'British Council', 'Languages', 4.8, 3400,
    '₹1,200/hr', false, 'Today',
    array['IELTS', 'TOEFL', 'Business English']::text[],
    'Certified master trainer with over 10 years experience helping students score 8+ bands in IELTS.',
    'Rahul provides high-impact feedback on speaking, writing, and professional executive communication.',
    'New Delhi, India (Remote)', 'Within 1 hour',
    '[{"label":"45 min Mock Speaking","price":"₹1,200","sub":"Score feedback & diagnostics"}]'::jsonb,
    '[{"date":"Today","slots":["11:00 AM","1:00 PM","6:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000007'::uuid, 7, 'Emma Walsh', 'EW', '#FB923C', 'Content Strategist', 'HubSpot', 'Content', 4.6, 720,
    '₹2,000/hr', false, 'Tomorrow',
    array['Instagram', 'YouTube', 'Brand Building']::text[],
    'Grew social channels to over 500K followers. Advises tech brands on storytelling.',
    'Emma teaches creators and professionals how to build sustainable personal media channels.',
    'Austin, TX (Remote)', 'Within 3 hours',
    '[{"label":"45 min Channel Audit","price":"₹2,000","sub":"Content positioning review"}]'::jsonb,
    '[{"date":"Tomorrow","slots":["2:00 PM","4:30 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000008'::uuid, 8, 'Kenji Nakamura', 'KN', '#38BDF8', 'Communication Coach', 'TEDx Speaker', 'Communication', 4.9, 890,
    '₹2,800/hr', false, 'Today',
    array['Public Speaking', 'Storytelling', 'Confidence']::text[],
    '2x TEDx speaker and executive coach for C-suite leaders and keynote presenters.',
    'Kenji uses proven storytelling frameworks to help professionals command the room with authentic confidence.',
    'Tokyo / Remote', 'Within 2 hours',
    '[{"label":"45 min Pitch & Speech Coaching","price":"₹2,800","sub":"Live performance critique"}]'::jsonb,
    '[{"date":"Today","slots":["5:00 PM","8:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000009'::uuid, 9, 'Jake Morrison', 'JM', '#F87171', 'Certified Personal Trainer', 'Equinox', 'Fitness', 4.8, 1120,
    '₹1,500/hr', false, 'Today',
    array['Strength Training', 'Nutrition', 'Fat Loss']::text[],
    '12 years coaching busy professionals to build aesthetic, healthy, and durable bodies.',
    'Jake designs evidence-based training routines that fit into 45-minute daily windows without burnout.',
    'Los Angeles, CA (Remote)', 'Within 3 hours',
    '[{"label":"45 min Fitness Assessment","price":"₹1,500","sub":"Form audit & nutrition targets"}]'::jsonb,
    '[{"date":"Today","slots":["9:00 AM","6:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000010'::uuid, 10, 'Leela Anand', 'LA', '#14B8A6', 'Meditation & Mindfulness Coach', 'Headspace', 'Meditation', 4.9, 640,
    'Free', true, 'Tomorrow',
    array['Meditation', 'Stress Relief', 'Breathwork']::text[],
    'Former monastery practitioner and meditation instructor at leading tech campuses.',
    'Leela guides high performers through modern somatic breathwork and mindfulness for mental clarity.',
    'Remote / Global', 'Within 2 hours',
    '[{"label":"30 min Guided Session","price":"Free","sub":"Community breathwork practice"}]'::jsonb,
    '[{"date":"Tomorrow","slots":["7:00 AM","7:00 PM"]}]'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  mentor_num = excluded.mentor_num,
  title = excluded.title,
  company = excluded.company,
  category = excluded.category,
  rating = excluded.rating,
  price = excluded.price,
  free = excluded.free,
  availability = excluded.availability,
  skills = excluded.skills,
  bio = excluded.bio,
  about = excluded.about;

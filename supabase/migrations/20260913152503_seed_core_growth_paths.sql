insert into public.growth_paths (slug,title,category,description,level,duration,rating,learner_count)
values
('coding','Coding','Career & Tech','Become a software developer from beginner to advanced.','Beginner to Advanced','3–6 months',4.9,0),
('ai-ml','AI & Machine Learning','Career & Tech','Learn to build and train intelligent machine learning models.','Beginner to Advanced','4–8 months',4.9,0),
('data-science','Data Science','Career & Tech','Turn raw data into insights that drive real decisions.','Beginner to Advanced','4–8 months',4.8,0),
('uiux','UI/UX Design','Career & Tech','Design digital products people genuinely love to use.','Beginner to Advanced','3–5 months',4.8,0),
('webdev','Web Development','Career & Tech','Build fast, modern websites from the ground up.','Beginner to Advanced','3–6 months',4.9,0),
('dsa','DSA','Career & Tech','Master data structures and algorithms for top interviews.','Beginner to Advanced','3–6 months',4.8,0)
on conflict (slug) do update set title=excluded.title, category=excluded.category, description=excluded.description, level=excluded.level, duration=excluded.duration, rating=excluded.rating;

with path_data as (
  select id, slug from public.growth_paths where slug in ('coding','ai-ml','data-science','uiux','webdev','dsa')
), milestones as (
  select 'coding' slug, 1 n, 'Python Fundamentals' title union all
  select 'coding',2,'JavaScript & Web Basics' union all select 'coding',3,'Real Projects' union all select 'coding',4,'Data Structures & Algorithms' union all select 'coding',5,'Git, GitHub & System Design' union all
  select 'ai-ml',1,'Math & Python for ML' union all select 'ai-ml',2,'Core ML Algorithms' union all select 'ai-ml',3,'Neural Networks' union all select 'ai-ml',4,'Real-World Projects' union all select 'ai-ml',5,'Deploying ML Models' union all
  select 'data-science',1,'Statistics Foundations' union all select 'data-science',2,'Data Wrangling with Pandas' union all select 'data-science',3,'Data Visualization' union all select 'data-science',4,'Machine Learning Basics' union all select 'data-science',5,'Real Dataset Projects' union all
  select 'uiux',1,'Design Principles' union all select 'uiux',2,'Figma Fundamentals' union all select 'uiux',3,'Wireframing & Prototyping' union all select 'uiux',4,'User Research' union all select 'uiux',5,'Portfolio Case Study' union all
  select 'webdev',1,'HTML & CSS' union all select 'webdev',2,'JavaScript Essentials' union all select 'webdev',3,'React Fundamentals' union all select 'webdev',4,'Backend Basics' union all select 'webdev',5,'Full-Stack Project' union all
  select 'dsa',1,'Arrays & Strings' union all select 'dsa',2,'Trees & Graphs' union all select 'dsa',3,'Dynamic Programming' union all select 'dsa',4,'Sorting & Searching' union all select 'dsa',5,'Mock Interviews'
)
insert into public.milestones (path_id,title,description,phase,week_number,order_index)
select p.id, m.title, 'Core milestone for this Growth Path.', 'Phase ' || m.n, m.n, m.n
from milestones m join path_data p on p.slug=m.slug
where not exists (
  select 1 from public.milestones x where x.path_id=p.id and x.order_index=m.n
);

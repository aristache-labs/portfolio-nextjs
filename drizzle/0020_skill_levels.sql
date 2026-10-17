-- Production rows were inserted before levels existed. Seed skips a populated
-- database, so these percents never landed. Fill only empty levels.
UPDATE "skills" AS s
SET "level" = v.level
FROM (
  VALUES
    ('JavaScript'::text, '90'::text),
    ('TypeScript', '85'),
    ('Dart', '75'),
    ('Python', '80'),
    ('HTML', '90'),
    ('CSS', '85'),
    ('PHP', '60'),
    ('React', '90'),
    ('React Native', '85'),
    ('Expo', '80'),
    ('Flutter', '70'),
    ('Next.js', '90'),
    ('Node.js', '85'),
    ('Tailwind', '90'),
    ('Docker', '75'),
    ('Nginx', '70'),
    ('Windows', '90'),
    ('Linux', '85'),
    ('Git', '95'),
    ('GitHub', '90'),
    ('Bitbucket', '70'),
    ('PowerShell', '85'),
    ('Bash', '80'),
    ('Ansible', '65'),
    ('AiScript', '70'),
    ('MySQL', '75'),
    ('PostgreSQL', '80'),
    ('Supabase', '85'),
    ('Firebase', '75'),
    ('AWS', '70'),
    ('Azure', '65'),
    ('Cloudflare', '75')
) AS v(name, level)
WHERE s."name" = v.name
  AND s."level" IS NULL;

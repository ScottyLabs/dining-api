CREATE TABLE IF NOT EXISTS emails (
    name TEXT NOT NULL,
    email TEXT NOT NULL
);

create table dashboard_changes (
 conceptid integer primary key,
name TEXT,
description TEXT,
shortdescription TEXT,
times JSONB,
menu TEXT,
accepts_online_orders boolean
);

insert into emails (name, email) values ('Bulgaria','bulgaria@un.org'),
('Czech Republic','czech@un.org'),
('Slovakia','slovakia@un.org'),
('Poland','poland@un.org'),
('Hungary','hungary@un.org'),
('Romania','romania@un.org');

INSERT INTO dashboard_changes (
  conceptid,
  shortdescription
) VALUES (
  110,
  'Bulgaria'
);

INSERT INTO dashboard_changes
  (conceptid, name, description, shortdescription, menu, times)
VALUES (
  109,
  'Dockerfile test',
  $$This is in SQL
This is the description
I hope you like SQL
I like SQL
SQL is fun
Is Drizzle?
idk$$,
  'This is a test admin override. Add these to override API data.',
  'https://www.youtube.com/watch?v=eYMdw4z1me8',
  '[
    {
      "start": { "day": 0, "hour": 12, "minute": 0 },
      "end":   { "day": 0, "hour": 20, "minute": 0 }
    },
{
      "start": { "day": 0, "hour": 21, "minute": 0 },
      "end":   { "day": 0, "hour": 22, "minute": 0 }
    },
    {
      "start": { "day": 1, "hour": 0, "minute": 30 },
      "end":   { "day": 1, "hour": 23, "minute": 0 }
    },
    {
      "start": { "day": 2, "hour": 19, "minute": 30 },
      "end":   { "day": 2, "hour": 20, "minute": 0 }
    },
    {
      "start": { "day": 3, "hour": 10, "minute": 30 },
      "end":   { "day": 3, "hour": 13, "minute": 0 }
    },
    {
      "start": { "day": 4, "hour": 10, "minute": 30 },
      "end":   { "day": 4, "hour": 10, "minute": 40 }
    },
    {
      "start": { "day": 5, "hour": 10, "minute": 30 },
      "end":   { "day": 5, "hour": 16, "minute": 0 }
    }
  ]'::jsonb
);

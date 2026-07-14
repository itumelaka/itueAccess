insert into public.locations(name, code) values
  ('Auditorium', 'AUDITORIUM'),
  ('Bilik Server', 'BILIK-SERVER'),
  ('Bilik Komputer', 'BILIK-KOMPUTER'),
  ('Bilik Mesyuarat', 'BILIK-MESYUARAT'),
  ('Bilik Merak', 'BILIK-MERAK'),
  ('Bilik Bangau', 'BILIK-BANGAU')
on conflict (code) do update set name = excluded.name;

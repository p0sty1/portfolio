with rows(category, title, subtitle, link_url, image_url, note, sort_order) as (
  values
    ('celebrity'::public.portfolio_favorite_category, '陈绮贞', 'Cheer Chen', 'https://zh.wikipedia.org/wiki/%E9%99%B3%E7%B6%BA%E8%B2%9E', '/favorites/cheer-chen.jpg', '', 6),
    ('celebrity'::public.portfolio_favorite_category, 'Lana Del Rey', 'Singer-songwriter', 'https://en.wikipedia.org/wiki/Lana_Del_Rey', '/favorites/lana-del-rey.jpg', '', 7),
    ('celebrity'::public.portfolio_favorite_category, 'Lorde', 'Singer-songwriter', 'https://en.wikipedia.org/wiki/Lorde', '/favorites/lorde.jpg', '', 8),
    ('celebrity'::public.portfolio_favorite_category, 'Red Velvet', 'K-pop girl group', 'https://en.wikipedia.org/wiki/Red_Velvet_(group)', '/favorites/red-velvet.jpg', '', 9),
    ('celebrity'::public.portfolio_favorite_category, '陶喆', 'David Tao', 'https://en.wikipedia.org/wiki/David_Tao', '/favorites/david-tao.jpg', '', 10),
    ('celebrity'::public.portfolio_favorite_category, '张惠妹', 'A-Mei', 'https://en.wikipedia.org/wiki/A-Mei', '/favorites/a-mei.jpg', '', 11),
    ('celebrity'::public.portfolio_favorite_category, 'BLACKPINK', 'K-pop girl group', 'https://en.wikipedia.org/wiki/Blackpink', '/favorites/blackpink.png', '', 12),
    ('celebrity'::public.portfolio_favorite_category, 'Billie Eilish', 'Singer-songwriter', 'https://en.wikipedia.org/wiki/Billie_Eilish', '/favorites/billie-eilish.jpg', '', 13),
    ('celebrity'::public.portfolio_favorite_category, 'Troye Sivan', 'Singer-songwriter · actor', 'https://en.wikipedia.org/wiki/Troye_Sivan', '/favorites/troye-sivan.jpg', '', 14)
)
insert into public.portfolio_favorites (
  category,
  title,
  subtitle,
  link_url,
  image_url,
  note,
  sort_order
)
select
  category,
  title,
  subtitle,
  link_url,
  image_url,
  note,
  sort_order
from rows
where not exists (
  select 1
  from public.portfolio_favorites existing
  where existing.category = rows.category
    and existing.title = rows.title
);

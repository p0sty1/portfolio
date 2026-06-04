with rows(category, title, subtitle, link_url, image_url, note, sort_order) as (
  values
    ('song'::public.portfolio_favorite_category, '纯妹妹', '单依纯 · 2025', 'https://music.apple.com/cn/album/%E7%BA%AF%E5%A6%B9%E5%A6%B9/1864543075?uo=4', '/favorites/pure-sister.jpg', '', 4),
    ('song'::public.portfolio_favorite_category, '极限', '徐佳莹 · 2010', 'https://music.apple.com/tw/album/%E6%A5%B5%E9%99%90/672974493?uo=4', '/favorites/lala-hsu-limit.jpg', '', 5),
    ('song'::public.portfolio_favorite_category, 'Wishbone', 'Conan Gray · 2025', 'https://www.deezer.com/album/801417931', '/favorites/wishbone-conan-gray.jpg', '', 6),
    ('song'::public.portfolio_favorite_category, 'Lover', 'Taylor Swift · 2019', 'https://www.deezer.com/album/108447472', '/favorites/lover.jpg', '', 7),
    ('song'::public.portfolio_favorite_category, 'Melodrama', 'Lorde · 2017', 'https://www.deezer.com/album/42886601', '/favorites/melodrama.jpg', '', 8),
    ('song'::public.portfolio_favorite_category, 'My 21st Century Blues', 'RAYE · 2023', 'https://www.deezer.com/album/393727427', '/favorites/my-21st-century-blues.jpg', '', 9),
    ('song'::public.portfolio_favorite_category, 'Sexistential', 'Robyn · 2026', 'https://www.deezer.com/album/933146091', '/favorites/sexistential.jpg', '', 10),
    ('song'::public.portfolio_favorite_category, 'Pure Heroine', 'Lorde · 2013', 'https://www.deezer.com/album/6909237', '/favorites/pure-heroine.jpg', '', 11),
    ('song'::public.portfolio_favorite_category, 'Hollywood''s Bleeding', 'Post Malone · 2019', 'https://www.deezer.com/album/110040592', '/favorites/hollywoods-bleeding.jpg', '', 12),
    ('song'::public.portfolio_favorite_category, 'Virgin', 'Lorde · 2025', 'https://www.deezer.com/album/777441001', '/favorites/virgin-lorde.jpg', '', 13),
    ('song'::public.portfolio_favorite_category, '陶喆同名专辑', '陶喆 · 1997', 'https://music.apple.com/tw/album/%E9%99%B6%E5%96%86%E5%90%8C%E5%90%8D%E5%B0%88%E8%BC%AF/1416149926?uo=4', '/favorites/david-tao-album.jpg', '', 14),
    ('song'::public.portfolio_favorite_category, 'I''m O.K.', '陶喆 · 1999', 'https://music.apple.com/tw/album/im-o-k/905206471?uo=4', '/favorites/im-ok-david-tao.jpg', '', 15),
    ('song'::public.portfolio_favorite_category, '渺小', '田馥甄 · 2013', 'https://music.apple.com/tw/album/%E6%B8%BA%E5%B0%8F/744962939?uo=4', '/favorites/insignificance-hebe.jpg', '', 16),
    ('song'::public.portfolio_favorite_category, 'The Fame Monster', 'Lady Gaga · 2009', 'https://music.apple.com/us/album/the-fame-monster/1440814077?uo=4', '/favorites/the-fame-monster.jpg', '', 17),
    ('song'::public.portfolio_favorite_category, 'MAYHEM', 'Lady Gaga · 2025', 'https://www.deezer.com/album/722147851', '/favorites/mayhem.jpg', '', 18),
    ('song'::public.portfolio_favorite_category, 'eternal sunshine', 'Ariana Grande · 2024', 'https://www.deezer.com/album/556294552', '/favorites/eternal-sunshine.jpg', '', 19),
    ('song'::public.portfolio_favorite_category, 'BRAT', 'Charli xcx · 2024', 'https://www.deezer.com/album/597350882', '/favorites/brat.jpg', '', 20),
    ('song'::public.portfolio_favorite_category, '无人知晓', '田馥甄 · 2020', 'https://music.apple.com/tw/album/%E7%84%A1%E4%BA%BA%E7%9F%A5%E6%9B%89/1534004626?uo=4', '/favorites/no-one-knows-hebe.jpg', '', 21),
    ('song'::public.portfolio_favorite_category, 'reputation', 'Taylor Swift · 2017', 'https://www.deezer.com/album/52612062', '/favorites/reputation.jpg', '', 22),
    ('song'::public.portfolio_favorite_category, 'Golden Hour', 'Kacey Musgraves · 2018', 'https://www.deezer.com/album/60649622', '/favorites/golden-hour.jpg', '', 23),
    ('song'::public.portfolio_favorite_category, 'Ultraviolence', 'Lana Del Rey · 2014', 'https://www.deezer.com/album/7898271', '/favorites/ultraviolence.jpg', '', 24),
    ('song'::public.portfolio_favorite_category, 'Blue Banisters', 'Lana Del Rey · 2021', 'https://www.deezer.com/album/267169752', '/favorites/blue-banisters.jpg', '', 25),
    ('song'::public.portfolio_favorite_category, 'Short n'' Sweet', 'Sabrina Carpenter · 2024', 'https://www.deezer.com/album/631839161', '/favorites/short-n-sweet.jpg', '', 26),
    ('song'::public.portfolio_favorite_category, '19', 'Adele · 2008', 'https://www.deezer.com/album/251821', '/favorites/adele-19.jpg', '', 27),
    ('song'::public.portfolio_favorite_category, 'HIT ME HARD AND SOFT', 'Billie Eilish · 2024', 'https://www.deezer.com/album/586786102', '/favorites/hit-me-hard-and-soft.jpg', '', 28),
    ('song'::public.portfolio_favorite_category, '25', 'Adele · 2015', 'https://www.deezer.com/album/14880539', '/favorites/adele-25.jpg', '', 29),
    ('song'::public.portfolio_favorite_category, 'WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?', 'Billie Eilish · 2019', 'https://www.deezer.com/album/91598612', '/favorites/when-we-all-fall-asleep.jpg', '', 30),
    ('song'::public.portfolio_favorite_category, 'thank u, next', 'Ariana Grande · 2019', 'https://www.deezer.com/album/86773062', '/favorites/thank-u-next.jpg', '', 31),
    ('song'::public.portfolio_favorite_category, 'Merry Christmas', 'Mariah Carey · 1994', 'https://www.deezer.com/album/6155526', '/favorites/merry-christmas-mariah-carey.jpg', '', 32),
    ('song'::public.portfolio_favorite_category, 'Dangerous Woman', 'Ariana Grande · 2016', 'https://music.apple.com/us/album/dangerous-woman/1440835631?uo=4', '/favorites/dangerous-woman.jpg', '', 33),
    ('song'::public.portfolio_favorite_category, 'GUTS', 'Olivia Rodrigo · 2023', 'https://www.deezer.com/album/484372295', '/favorites/guts.jpg', '', 34),
    ('song'::public.portfolio_favorite_category, 'Chill Kill', 'Red Velvet · 2023', 'https://music.apple.com/us/album/chill-kill-the-3rd-album/1766620383?uo=4', '/favorites/chill-kill.jpg', '', 35),
    ('song'::public.portfolio_favorite_category, '1989', 'Taylor Swift · 2014', 'https://www.deezer.com/album/9007779', '/favorites/1989.jpg', '', 36),
    ('song'::public.portfolio_favorite_category, 'Bloom', 'Troye Sivan · 2018', 'https://www.deezer.com/album/71592302', '/favorites/bloom-troye-sivan.jpg', '', 37),
    ('song'::public.portfolio_favorite_category, 'Blue Neighbourhood', 'Troye Sivan · 2015', 'https://music.apple.com/us/album/blue-neighbourhood/1876132053?uo=4', '/favorites/blue-neighbourhood.jpg', '', 38),
    ('song'::public.portfolio_favorite_category, '吉他手', '陈绮贞 · 2002', 'https://music.apple.com/tw/album/%E5%90%89%E4%BB%96%E6%89%8B/152197399?uo=4', '/favorites/guitarist-cheer-chen.jpg', '', 39),
    ('song'::public.portfolio_favorite_category, '阿密特意识专辑', '张惠妹 · 2009', 'https://music.apple.com/tw/album/%E9%98%BF%E5%AF%86%E7%89%B9%E6%84%8F%E8%AD%98%E5%B0%88%E8%BC%AF-%E6%84%9F%E5%AE%98%E5%8D%87%E7%B4%9A%E7%89%88/1834202426?uo=4', '/favorites/amit.jpg', '', 40),
    ('song'::public.portfolio_favorite_category, 'UNFORGIVEN', 'LE SSERAFIM · 2023', 'https://www.deezer.com/album/434848357', '/favorites/unforgiven.jpg', '', 41),
    ('song'::public.portfolio_favorite_category, 'Did you know that there''s a tunnel under Ocean Blvd', 'Lana Del Rey · 2023', 'https://www.deezer.com/album/420368197', '/favorites/ocean-blvd.jpg', '', 42),
    ('song'::public.portfolio_favorite_category, '还是会寂寞', '陈绮贞 · 2000', 'https://music.apple.com/tw/album/%E9%82%84%E6%98%AF%E6%9C%83%E5%AF%82%E5%AF%9E/152200437?uo=4', '/favorites/still-lonely.jpg', '', 43),
    ('song'::public.portfolio_favorite_category, '让我想一想', '陈绮贞 · 1998', 'https://music.apple.com/tw/album/%E8%AE%93%E6%88%91%E6%83%B3%E4%B8%80%E6%83%B3/152235788?uo=4', '/favorites/let-me-think.jpg', '', 44),
    ('song'::public.portfolio_favorite_category, 'Born This Way', 'Lady Gaga · 2011', 'https://www.deezer.com/album/1075405', '/favorites/born-this-way.jpg', '', 45),
    ('song'::public.portfolio_favorite_category, 'Guitar Songs', 'Billie Eilish · 2022', 'https://www.deezer.com/album/338169017', '/favorites/guitar-songs.jpg', '', 46),
    ('song'::public.portfolio_favorite_category, '~how i''m feeling~', 'Lauv · 2020', 'https://www.deezer.com/album/363784187', '/favorites/how-im-feeling-lauv.jpg', '', 47),
    ('song'::public.portfolio_favorite_category, 'beerbongs & bentleys', 'Post Malone · 2018', 'https://www.deezer.com/album/62183462', '/favorites/beerbongs-and-bentleys.jpg', '', 48),
    ('song'::public.portfolio_favorite_category, 'NewJeans 1st EP ''New Jeans''', 'NewJeans · 2022', 'https://www.deezer.com/album/340450917', '/favorites/new-jeans-1st-ep.jpg', '', 49),
    ('song'::public.portfolio_favorite_category, '华丽的冒险', '陈绮贞 · 2005', 'https://music.apple.com/tw/album/%E8%8F%AF%E9%BA%97%E7%9A%84%E5%86%92%E9%9A%AA/818157917?uo=4', '/favorites/gorgeous-adventure.jpg', '', 50),
    ('song'::public.portfolio_favorite_category, 'Norman Fucking Rockwell!', 'Lana Del Rey · 2019', 'https://www.deezer.com/album/108706862', '/favorites/norman-fucking-rockwell.jpg', '', 51)
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

export type FavoriteCategory =
  | 'anime'
  | 'celebrity'
  | 'game'
  | 'movie'
  | 'pornstar'
  | 'song'
  | 'tv'
  | 'video';

export interface FavoriteItem {
  category: FavoriteCategory;
  created_at: string;
  id: string;
  image_url: string;
  link_url: string;
  note: string;
  sort_order: number;
  subtitle: string;
  title: string;
}

export const FAVORITE_CATEGORIES: {
  filterLabel: string;
  id: FavoriteCategory;
  label: string;
}[] = [
  { id: 'movie', label: '电影', filterLabel: '电影' },
  { id: 'tv', label: '电视', filterLabel: '电视' },
  { id: 'anime', label: '动漫', filterLabel: '动漫' },
  { id: 'game', label: '游戏', filterLabel: '游戏' },
  { id: 'song', label: '歌曲', filterLabel: '歌曲' },
  { id: 'celebrity', label: '明星', filterLabel: '明星' },
  { id: 'video', label: '视频', filterLabel: '视频' },
  { id: 'pornstar', label: '私人', filterLabel: '私人' },
];

export type FavoriteFilter =
  | '全部'
  | '动漫'
  | '明星'
  | '歌曲'
  | '游戏'
  | '电影'
  | '电视'
  | '视频'
  | '私人';

export const favoriteFilters: FavoriteFilter[] = [
  '全部',
  '电影',
  '电视',
  '动漫',
  '游戏',
  '歌曲',
  '明星',
  '视频',
  '私人',
];

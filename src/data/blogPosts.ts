export interface BlogPost {
  id: string;
  title: string;
  meta: string;
  excerpt: string;
  publishedAt: string;
  markdown?: string;
  markdownFile?: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'how-to-build-this-site',
    title: '如何做一个这样的网站',
    meta: 'Guide · 8 min read',
    excerpt:
      '从 React 前端、Supabase 社交模块，到 Cloudflare Worker 与 R2 画廊，拆解这个个人社交空间的技术选型与落地方式。',
    publishedAt: '2026-06-02',
    markdownFile: '/api/gallery/media/blog/markdown/how-to-build-this-site.md',
  },
];

export const getBlogPost = (id: string) =>
  blogPosts.find((post) => post.id === id);

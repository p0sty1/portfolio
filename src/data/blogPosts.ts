export interface BlogPost {
  id: string;
  title: string;
  meta: string;
  theme: string;
  excerpt: string;
  publishedAt: string;
  markdown?: string;
  markdownFile?: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'how-to-build-personal-site',
    title: '如何做一个个人网站',
    meta: 'Guide · 6 min read',
    theme: '主题：从想法到上线',
    excerpt:
      '记录我做这个网站时用到的工具、账号、部署方式和个人准备。重点不是会不会写代码，而是能不能把需求说清楚。',
    publishedAt: '2026-06-02',
    markdownFile: '/blog/how-to-build-personal-site.md',
  },
];

export const getBlogPost = (id: string) =>
  blogPosts.find((post) => post.id === id);

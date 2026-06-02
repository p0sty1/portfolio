# 如何做一个这样的网站

![网站界面预览](/blog/images/how-to-build-cover.jpg)

## 它是什么

这不是传统作品集，也不是 SaaS 后台。它更像一个人的**互联网房间**：动态、画廊、长文、匿名信箱、留言和收藏，都挂在同一套前端里。目标是「可读、可看、可互动」，而不是只放简历。

## 前端技术栈

- **React 19 + TypeScript**：页面按「房间」拆分（动态、身份、画廊、长文等），用 `AppView` 切换视图。
- **Create React App**：本地 `npm start`，构建后产物交给 Cloudflare Worker 静态托管。
- **styled-components**：组件级样式，暖色主题、圆角卡片、移动端底部导航都在这套体系里。
- **react-markdown + remark-gfm**：长文支持 `.md` 文件、图片、表格、代码块和链接。

## 后端与数据

- **Supabase（Postgres + RLS）**
  - `portfolio_demo_notes`：留言板
  - `portfolio_favorites`：喜欢 / 收藏
  - `portfolio_anonymous_questions`：匿名提问与回答
  - `portfolio_blog_posts_meta` + `portfolio_blog_comments`：长文点赞和评论
- 浏览器端用 **`@supabase/supabase-js`** + `REACT_APP_SUPABASE_*` 环境变量（构建时注入）。
- 互动策略：匿名可读写受限，回答与管理由站主在后台处理。

## Markdown 与资源存储

- Markdown 和文章图片都放在 **Cloudflare R2**（`portfolio-gallery` 桶）：
  - `blog/markdown/how-to-build-this-site.md`
  - `blog/images/how-to-build-cover.jpg`
- **Cloudflare Worker**（`worker/index.ts`）通过 `/api/gallery/media/{key}` 提供访问。
- 前端 `BlogRoom` 直接读取 R2 markdown URL，做到内容与代码解耦。

## 部署

1. `npm run build` 时写入 Supabase 等 `REACT_APP_*` 变量。
2. **GitHub Actions**（`.github/workflows/deploy.yml`）构建并 `wrangler deploy`。
3. 自定义域名 **jyangb1y.site** 绑在 Worker 上（见 `wrangler.toml`）。

## 信息架构怎么排

| 房间        | 作用                          |
| ----------- | ----------------------------- |
| 动态        | Feed + 身份侧栏，入口感       |
| 画廊        | 瀑布流影像                    |
| 长文        | Markdown 文章（支持 R2 文件） |
| 匿名信箱    | 提问入库，未答显示状态        |
| 留言 / 喜欢 | Supabase 表驱动               |

## 本地怎么跑

```bash
# .env.local
REACT_APP_SUPABASE_URL=https://你的项目.supabase.co
REACT_APP_SUPABASE_ANON_KEY=你的anon_key

npm start
```

改环境变量后需要**重启** dev server。现在长文可以读取 `.md` 文件，也支持图片语法；生产环境可直接读取 R2 文件。

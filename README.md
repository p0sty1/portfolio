# Portfolio (local)

基于 [adamalston/v2](https://github.com/adamalston/v2) 模板的个人作品集，已替换为占位信息，便于自定义。

## 本地运行

```bash
npm install
npm start
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 自定义

编辑 `src/App/config.tsx` 修改姓名、职位与社交链接；页脚见 `src/components/Footer.tsx`。

## 构建

```bash
npm run build
```

## 画廊 · Cloudflare R2

部署到 Workers 后，画廊从 R2 桶 `portfolio-gallery` 读取 `gallery/manifest.json`，图片通过 `/api/gallery/media/<key>` 访问。

首次配置（需先 `npx wrangler login`）：

```powershell
.\scripts\r2-gallery-setup.ps1
# 或
npm run r2:init
npm run r2:upload-manifest
```

上传单张图片示例：

```bash
npx wrangler r2 object put portfolio-gallery/gallery/g1.jpg --file=./photos/g1.jpg --content-type=image/jpeg
```

本地带 Worker 预览：`npm run dev:worker`（需先 build）。

## 自定义域名 · Worker（非 Pages 静态）

生产域名 `jyangb1y.site` 应绑在 **Worker `portfolio`**（`wrangler.toml` 的 `routes`），不要绑在 Pages 项目，否则 `/api/gallery/*` 会退回 HTML，R2 头像无法显示。

从 Pages 迁到 Worker 后，在本地执行（需 `npx wrangler login`）：

```powershell
.\scripts\sync-worker-secrets.ps1   # 把 .env 里的 Supabase 变量写入 Worker secrets
npx wrangler deploy
```

Pages 上若还有 `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_URL`，请补进 `.env` 再跑上述脚本，或手动：`npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`。

在 Pages 控制台 **Custom domains** 中移除 `jyangb1y.site`，避免与 Worker 路由冲突。

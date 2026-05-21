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

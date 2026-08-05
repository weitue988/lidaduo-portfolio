# Cloudflare Pages 部署

## 应急直传

1. 运行 `npm install` 和 `npm run package:direct`。
2. 在 Cloudflare 控制台进入 `Workers & Pages`，选择 `Create application`，再选择 `Pages` 和 `Upload assets`。
3. 项目名填写 `lidaduo-portfolio`。
4. 上传 `artifacts/lidaduo-portfolio-direct-upload.zip` 并部署。
5. 部署后确认项目域名为 `https://lidaduo-portfolio.pages.dev`。
6. 确认发布根目录没有 `404.html`，再访问 `/refresh-test`；Cloudflare Pages 应返回同一个作品集首页和 `200 OK`。

Cloudflare Pages 当前会在没有顶层 `404.html` 时自动启用 SPA 回退。不要添加 `/* /index.html 200`：该规则会匹配 `/index.html` 自身，被当前规则引擎判为循环重写并忽略。

此模式不会随 GitHub 自动更新。每次内容改变后都需要重新运行 `npm run package:direct` 并上传新压缩包。

## GitHub 自动构建

Cloudflare Pages 的 Direct Upload 项目和 Git 集成项目不能在同一个项目里直接互相转换。长期方案应新建一个 Git 集成 Pages 项目；若 `lidaduo-portfolio` 名称已被应急项目占用，可先删除应急项目，或暂用 `lidaduo-portfolio-git` 完成验证，再把最终名称切回。

Git 集成参数：

```text
Git provider: GitHub
Repository: weitue988/lidaduo-portfolio
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
Environment variable: NODE_VERSION=22
```

之后的更新流程：

```bash
git add .
git commit -m "update portfolio content"
git push origin main
```

Cloudflare 会为 `main` 自动创建生产部署；其他分支和 Pull Request 会创建独立预览部署。

## 构建失败排查

1. 确认 Build command 是 `npm run build`，输出目录是 `dist`。
2. 确认 Root directory 是 `/`，不是 `src` 或 `dist`。
3. 确认 Cloudflare 的 Node 版本为 22。
4. 查看日志中 `npm install`、Vite 和 `Verified ... files` 三段；校验失败说明源资产没有完整提交。
5. 本地重新执行 `rm -rf node_modules dist && npm install && npm run build`。

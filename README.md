# lidaduo-portfolio

用于招聘投递的 3D 翻书式个人作品集，部署目标为 Cloudflare Pages。

## 工程边界

当前工程是在已经通过视觉、动效和交互 QA 的 `portfolio-replacement` 运行产物外建立的 Vite 可复现包装层。它可以稳定执行本地开发、构建、GitHub 推送和 Cloudflare Pages 自动部署，但不是原始作者模块源码的反编译还原。

为避免已通过效果发生漂移，`src/index.html` 保留验证过的运行时代码，`src/assets/` 保留书本模型、材质、字体和页面视觉。Vite 构建完成后会恢复原始 HTML，并逐文件校验 `dist/` 与源运行时一致。

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址由 Vite 输出，通常为 `http://localhost:5173/`。

## 构建和预览

```bash
npm run build
npm run preview
```

`npm run build` 会生成 `dist/`，随后执行字节级文件校验。任何模型、材质、图片、字体或运行时文件丢失都会使构建失败。

## 生成应急直传包

```bash
npm run package:direct
```

输出：`artifacts/lidaduo-portfolio-direct-upload.zip`。

## 内容迭代入口

- 页面运行时和 DOM 文案：`src/index.html`
- 封面、跨页、封底、缩略图：`src/assets/images/` 和 `src/assets/images_webp/`
- 字体：`src/assets/fonts/`
- 书本模型与材质：`src/assets/*.glb`、`src/assets/*.jpg`
- SPA 回退：由 Cloudflare Pages 自动处理；发布根目录禁止增加 `404.html`

视觉页面仍建议从案例中的槽位构建器生成后同步到本工程，避免 PNG、WebP 和菜单缩略图不一致。

## Cloudflare Pages Git 构建参数

```text
Project name: lidaduo-portfolio
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
Node version: 22
```

环境变量：当前项目没有业务环境变量。Cloudflare 中可增加 `NODE_VERSION=22`，用于固定构建环境。

Cloudflare Pages 当前会在发布根目录没有 `404.html` 时自动启用 SPA 回退，把未知路径交给根页面处理。不要添加 `/* /index.html 200`：当前 Pages 规则引擎会把它判定为循环重写并忽略。

## 发布资产风险

当前版本仍包含研究复刻阶段使用的书本 GLB 和材质。它适合直接发送给招聘方查看；扩大公开传播或长期商业使用前，应替换为拥有明确授权的兼容资产。

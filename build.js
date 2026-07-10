// 10分ブログ工場 ビルドスクリプト
// posts/*.md と pages/*.md を読み込み、docs/ に公開用HTMLを生成する。
// 依存ライブラリなし。実行: node build.js
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, "posts");
const PAGES_DIR = path.join(ROOT, "pages");
const OUT_DIR = path.join(ROOT, "docs");
const ASSETS_DIR = path.join(ROOT, "assets");

const config = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));

// 広告スニペット(任意)。{{ad:キー名}} を記事本文に書くと差し込まれる。
let ads = {};
const ADS_FILE = path.join(ROOT, "ads.json");
if (fs.existsSync(ADS_FILE)) {
  ads = JSON.parse(fs.readFileSync(ADS_FILE, "utf8")).ads || {};
}

// 本文中の {{ad:キー名}} を広告HTMLに置換する。
// markdownパーサが <p>{{ad:...}}</p> で囲むケースも吸収する。
function injectAds(html) {
  return html.replace(
    /(?:<p>)?\{\{ad:([\w-]+)\}\}(?:<\/p>)?/g,
    (match, key) =>
      ads[key]
        ? `<div class="ad-banner">${ads[key]}</div>`
        : `<!-- 広告キー「${key}」が ads.json に見つかりません -->`
  );
}

// ---------- ユーティリティ ----------

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// front matter (--- で囲まれた key: value) を解析
function parseFrontMatter(raw) {
  const meta = {};
  let body = raw;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }
    body = raw.slice(m[0].length);
  }
  return { meta, body };
}

// ---------- 最小Markdownパーサ ----------
// 対応: 見出し / 段落 / 強調 / リンク / インラインコード / コードブロック /
//       箇条書き / 番号リスト / 引用 / 表 / 水平線 / 画像

function inline(text) {
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, url) => {
    const ext = /^https?:\/\//.test(url) ? ' target="_blank" rel="noopener"' : "";
    return `<a href="${url}"${ext}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return s;
}

function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { i++; continue; }

    // コードブロック
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // 閉じ ```
      out.push(`<pre><code>${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // 見出し
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2];
      const id = text.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // 水平線
    if (/^---+\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

    // 引用
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote><p>${buf.map(inline).join("<br>")}</p></blockquote>`);
      continue;
    }

    // 表 (| で始まる行が2行以上連続)
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const headerCells = line.split("|").slice(1, -1).map(c => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map(c => c.trim()));
        i++;
      }
      let t = "<table><thead><tr>";
      t += headerCells.map(c => `<th>${inline(c)}</th>`).join("");
      t += "</tr></thead><tbody>";
      for (const r of rows) {
        t += "<tr>" + r.map(c => `<td>${inline(c)}</td>`).join("") + "</tr>";
      }
      t += "</tbody></table>";
      out.push(`<div class="table-wrap">${t}</div>`);
      continue;
    }

    // 箇条書き / 番号リスト
    const isUl = /^[-*]\s+/.test(line);
    const isOl = /^\d+\.\s+/.test(line);
    if (isUl || isOl) {
      const tag = isUl ? "ul" : "ol";
      const re = isUl ? /^[-*]\s+/ : /^\d+\.\s+/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(re, ""))}</li>`);
        i++;
      }
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    // 段落(連続する通常行をまとめる)
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,4}\s|```|[-*]\s|\d+\.\s|>|\||---)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${buf.map(inline).join("<br>")}</p>`);
  }

  return out.join("\n");
}

// ---------- HTMLテンプレート ----------

function layout({ title, description, contentHtml, urlPath, isPost, meta }) {
  const fullTitle = title === config.siteTitle ? title : `${title} | ${config.siteTitle}`;
  const canonical = `${config.siteUrl}${urlPath}`;
  const prBanner = isPost
    ? `<p class="pr-note">※当サイトはアフィリエイト広告(PR)を利用しています。</p>`
    : "";
  const dateHtml = isPost && meta && meta.date
    ? `<p class="post-meta"><time datetime="${meta.date}">${meta.date}</time>${meta.tags ? " ・ " + escapeHtml(meta.tags) : ""}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${config.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${config.googleSiteVerification ? `<meta name="google-site-verification" content="${config.googleSiteVerification}">\n` : ""}<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description || config.siteDescription)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(description || config.siteDescription)}">
<meta property="og:type" content="${isPost ? "article" : "website"}">
<meta property="og:url" content="${canonical}">
<link rel="stylesheet" href="${urlPath.includes("/posts/") || urlPath.includes("/pages/") ? "../" : "./"}style.css">
</head>
<body>
<header class="site-header">
  <a class="site-title" href="${urlPath.includes("/posts/") || urlPath.includes("/pages/") ? "../" : "./"}index.html">${escapeHtml(config.siteTitle)}</a>
  <p class="site-desc">${escapeHtml(config.siteDescription)}</p>
</header>
<main>
${prBanner}
${isPost ? `<article><h1>${escapeHtml(title)}</h1>${dateHtml}${contentHtml}</article>` : contentHtml}
</main>
<footer class="site-footer">
  <nav>
    <a href="${urlPath.includes("/posts/") || urlPath.includes("/pages/") ? "../" : "./"}index.html">ホーム</a> ・
    <a href="${urlPath.includes("/posts/") || urlPath.includes("/pages/") ? "../" : "./"}pages/about.html">運営者情報</a> ・
    <a href="${urlPath.includes("/posts/") || urlPath.includes("/pages/") ? "../" : "./"}pages/privacy.html">プライバシーポリシー</a>
  </nav>
  <p>© ${new Date().getFullYear()} ${escapeHtml(config.siteTitle)}</p>
</footer>
</body>
</html>`;
}

// ---------- ビルド本体 ----------

function build() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_DIR, "posts"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "pages"), { recursive: true });

  // CSSコピー
  if (fs.existsSync(ASSETS_DIR)) {
    for (const f of fs.readdirSync(ASSETS_DIR)) {
      fs.copyFileSync(path.join(ASSETS_DIR, f), path.join(OUT_DIR, f));
    }
  }

  // 記事
  const posts = [];
  if (fs.existsSync(POSTS_DIR)) {
    for (const file of fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { meta, body } = parseFrontMatter(raw);
      const slug = file.replace(/\.md$/, "");
      const html = injectAds(markdownToHtml(body));
      const urlPath = `/posts/${slug}.html`;
      posts.push({ slug, meta, urlPath });
      fs.writeFileSync(
        path.join(OUT_DIR, "posts", `${slug}.html`),
        layout({
          title: meta.title || slug,
          description: meta.description || "",
          contentHtml: html,
          urlPath,
          isPost: true,
          meta,
        })
      );
    }
  }
  posts.sort((a, b) => (b.meta.date || "").localeCompare(a.meta.date || ""));

  // 固定ページ
  if (fs.existsSync(PAGES_DIR)) {
    for (const file of fs.readdirSync(PAGES_DIR).filter(f => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(PAGES_DIR, file), "utf8");
      const { meta, body } = parseFrontMatter(raw);
      const slug = file.replace(/\.md$/, "");
      const urlPath = `/pages/${slug}.html`;
      fs.writeFileSync(
        path.join(OUT_DIR, "pages", `${slug}.html`),
        layout({
          title: meta.title || slug,
          description: meta.description || "",
          contentHtml: `<article><h1>${escapeHtml(meta.title || slug)}</h1>${markdownToHtml(body)}</article>`,
          urlPath,
          isPost: false,
        })
      );
    }
  }

  // トップページ(記事一覧)
  const listHtml =
    `<section class="post-list"><h1>最新記事</h1><ul>` +
    posts
      .map(
        p =>
          `<li><a href="posts/${p.slug}.html"><span class="post-list-title">${escapeHtml(p.meta.title || p.slug)}</span>` +
          `<span class="post-list-date">${p.meta.date || ""}</span></a>` +
          `<p class="post-list-desc">${escapeHtml(p.meta.description || "")}</p></li>`
      )
      .join("") +
    `</ul></section>`;
  fs.writeFileSync(
    path.join(OUT_DIR, "index.html"),
    layout({
      title: config.siteTitle,
      description: config.siteDescription,
      contentHtml: listHtml,
      urlPath: "/index.html",
      isPost: false,
    })
  );

  // sitemap.xml
  const urls = [
    "/index.html",
    ...posts.map(p => p.urlPath),
    "/pages/about.html",
    "/pages/privacy.html",
  ];
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${config.siteUrl}${u}</loc></url>`).join("\n") +
    `\n</urlset>`;
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), sitemap);

  // GitHub Pages で Jekyll 処理を無効化
  fs.writeFileSync(path.join(OUT_DIR, ".nojekyll"), "");

  // robots.txt(全面クロール許可+サイトマップの場所を明示)
  fs.writeFileSync(
    path.join(OUT_DIR, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml\n`
  );

  console.log(`ビルド完了: 記事 ${posts.length} 本 → docs/`);
}

build();

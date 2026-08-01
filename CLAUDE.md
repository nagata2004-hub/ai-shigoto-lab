# プロジェクト: 10分ブログ工場(AI仕事術ラボ)

副業ブログ「AI仕事術ラボ」を1日10分で運営するシステム。ユーザーはAI初心者〜中級者の日本人。**常に日本語で応対すること。**

## 重要な前提

- ユーザーの可処分時間は1日10分。確認・承認以外の作業をユーザーにやらせない
- サイトの商品は「信頼」。誇張・未検証の断定・ステマ的表現は書かない
- 記事の執筆ルールとネタ帳は `topics.md`、収益戦略は `STRATEGY.md` を参照

## 技術構成

- 静的サイト。`node build.js` で `posts/` `pages/` → `docs/` にHTML生成(依存ライブラリなし)
- 公開は GitHub Pages(main ブランチの /docs フォルダ)を想定
- `docs/` は生成物なので直接編集しない。変更は md / CSS / build.js 側で行う
- `config.json` の siteUrl は公開URL確定後に更新が必要(未更新ならユーザーに知らせる)

## 運用状況メモ(更新していくこと)

- 2026-06-12: システム構築。記事3本。GitHub(nagata2004-hub/ai-shigoto-lab)へpush済み。公開URL: https://nagata2004-hub.github.io/ai-shigoto-lab/ (Pages設定はユーザーが実施)
- 2026-06-13: もしもアフィリエイトに登録済み。`ads.json` に広告コード設置、副業関連記事2本([ai-fukugyou-genjitsu](posts/ai-fukugyou-genjitsu.md)・[kaishain-fukugyou-kakunin](posts/kaishain-fukugyou-kakunin.md))に広告設置済み。実際の成果(クリック数・報酬額)はASP管理画面でのみ確認可能で、Claude側からは見えない。同日、Google Search Console確認タグも `config.json` に設置済み(`googleSiteVerification`)だが、ユーザー側でのSearch Console登録・確認が完了しているかは未確認
- 2026-08-02: 上記の登録状況が古い記事([unei-shuueki-koukai-vol1](posts/unei-shuueki-koukai-vol1.md))に反映されていなかったため修正。今後、収益・ASP状況に言及する記事を書く前は必ず `ads.json` の実際の設置状況を確認すること

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
- 2026-09-19: Search Console(ブラウザペイン経由で読み取り)。インデックス登録は1件(トップのみ)、クリック0・表示2、サイトマップ `sitemap.xml` は「取得できませんでした」・検出0。正しいURLで再送信済み
- 2026-10-10: 記事85本。サイトマップは有効(88URL)、noindex・canonicalの問題なし=技術面の阻害要因は見当たらない。Google検索での登録状況は、自動アクセス確認画面が出て確認できず(回避操作はしない)。Search Consoleの最新数字・ASP成果はユーザー側で未確認。`STRATEGY.md` の「記事50本・半年でPVほぼゼロなら戦略会議」の基準に近いため、記事を増やす前に方針の見直しを提案中
- 2026-10-10: ユーザー判断で **/daily(毎日の記事追加)は一時停止**。方針見直し中。ユーザーの目標は「AI特化にこだわらず、アフィリエイトで継続的に稼げる事業(会社)を作ること」。新方針が決まるまで /daily が呼ばれても記事は書かず、見直しの進捗を確認すること

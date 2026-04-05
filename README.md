# SD Prompt Studio

Stable Diffusion 向けプロンプト生成・管理統合ツール。

AI によるプロンプト生成・最適化と、Forge Wildcards 向けテンプレート管理を一つのアプリケーションに統合。

## 機能

- **AI プロンプト生成** — LLM API を活用したプロンプトの生成・最適化・強化・タグ追加
- **テンプレート管理** — comm / base / char / people の4カテゴリでプロンプト素材を管理
- **Regional Prompter 対応** — Latent Couple / BREAK によるリージョン分割
- **LoRA ウェイト管理** — 固定値・選択式・範囲指定の GUI 管理
- **Forge エクスポート** — Wildcards フォルダへの直接書き出し
- **プリセット管理** — 複数設定の保存・切替

## 技術スタック

- React + Vite
- Tailwind CSS
- Express (API プロキシ)
- OpenRouter API (DeepSeek V3)

## セットアップ

```bash
npm install
```

### 環境変数

`.env` ファイルをプロジェクトルートに作成:

```
API_KEY=your_openrouter_api_key
```

### 開発サーバー起動

```bash
npm run dev
```

## ライセンス

MIT

# Aporia

**ソクラテス的問答エンジン** — あなたの主張・信念を9フェーズの対話で徹底的に検証するAIアプリ。

🔗 **https://aporia.xdcyw.net**

---

## コンセプト

「アポリア（Aporia）」はギリシャ語で「行き詰まり・困惑」を意味する。  
ソクラテスのエレンコス（問答）は、相手の信念を問い詰めることで内部矛盾を露わにし、「自分が知らないことを知っている」状態へ導く。

本アプリはこのエレンコスを **決定論的な対話エンジン** として実装し、ユーザーが自分の主張・信念を構造的に検討できるツールを提供する。

---

## 機能

- **9フェーズの問答エンジン**  
  `CLAIM → DEFINITION → PREMISES → CONSISTENCY → COUNTER → REFINEMENT → APORIA → RESOLUTION`
- **Claudeによる哲学的問いの生成**（Tier 2: Haiku / Tier 3: Sonnet）
- **IndexedDBによる完全オフライン保存**（Dexie.js）
- **セッションログをMarkdownでエクスポート**
- **プライバシーファースト**：対話データは外部サーバーに保存しない
- Ataraxia Works デザインシステムに準拠したUI

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | React 19 + TypeScript |
| ビルド | Vite 8 |
| 状態管理 | Zustand 5 |
| DB | Dexie.js 4 (IndexedDB) |
| LLM | Claude Haiku / Sonnet (Anthropic API) |
| スタイル | Tailwind CSS v4 |
| デプロイ | Cloudflare Pages |

---

## ローカル開発

```bash
npm install
cp .env.example .env  # APIキーを設定（不要な場合は設定タブから入力）
npm run dev
```

---

## フェーズ定義

```
IDLE → CLAIM → DEFINITION → PREMISES → CONSISTENCY → COUNTER → REFINEMENT
                                              ↓                    ↓
                                           APORIA ← ─────────────┘
                                              ↓
                                         RESOLUTION
```

| フェーズ | 内容 |
|----------|------|
| CLAIM | 主張の正規化・キーワード抽出 |
| DEFINITION | キーワードの定義を求める |
| PREMISES | 主張の根拠・前提を引き出す |
| CONSISTENCY | 前提群の整合性を検証 |
| COUNTER | 反例・類似ケースを提示 |
| REFINEMENT | 主張の修正（PREMISES に戻る） |
| APORIA | 矛盾が解消できない状態 |
| RESOLUTION | セッション終了・ログ保存 |

---

## セキュリティ

- CSP メタタグによるスクリプト注入・外部通信の制限
- LLMレスポンスのJSONパース時にプロトタイプ汚染を防止
- ユーザー入力長の制限（主張: 500文字、返答: 1000文字）
- APIキーはlocalStorageに保存（デバイスローカルのみ）

---

## ロードマップ

### Phase 1（現在）
- ✅ エレンコスエンジン（全フェーズ）
- ✅ Claude Tier 2/3 Gateway
- ✅ IndexedDB 永続化
- ✅ セッションログ Markdown エクスポート

### Phase 2
- [ ] Tier 1 — WebLLM（Phi-3-mini、完全オフライン）
- [ ] 前提マップのグラフ可視化
- [ ] 矛盾ハイライト
- [ ] PWA Service Worker

---

Made by [田中芙雪（Sirusu）](https://x.com/Sirusu_Tanaka) / ataraxia works — 2026

# Mandarin Echo - 中国語学習アプリケーション

React + TypeScript + Vite で構築された中国語学習支援アプリケーションです。音声入力機能を使用して発音練習やリスニング学習ができます。

## 主な機能

- 🎤 **音声入力**: マイクを使用した中国語の発音練習
- 🔐 **ユーザー認証**: Firebase認証による匿名ログイン
- 💾 **データ保存**: Firestoreによる学習履歴・単語リストの管理
- 🎨 **直感的なUI**: カスタムデザインされた学習インターフェース
- 📝 **メモ機能**: 学習内容の保存・管理

## 技術スタック

- **フロントエンド**: React 19.2.5 + TypeScript
- **ビルド**: Vite 8.0.10
- **バックエンド**: Firebase (Authentication, Firestore)
- **UI要素**: Lucide React (アイコン)
- **開発ツール**: ESLint, TypeScript

## セットアップ

### 必須条件
- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# ビルド確認
npm run preview

# ESLintチェック
npm run lint
```

## 環境変数設定

`.env.local` ファイルで Firebase の認証情報を設定します（GitHubには含めないこと）：

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## プロジェクト構成

```
src/
├── App.tsx          # メインアプリケーションコンポーネント
├── App.css          # アプリケーションスタイル
├── main.tsx         # エントリーポイント
├── index.css        # グローバルスタイル
└── assets/          # 静的リソース
```

## セキュリティに関する注意

- `.env.local` ファイルには機密情報が含まれるため、GitHubにはアップロードしないでください
- `.gitignore` で自動的に除外されています


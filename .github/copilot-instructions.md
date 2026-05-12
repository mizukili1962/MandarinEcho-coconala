  # 美春meichun - Copilot 開発ガイドライン

## プロジェクト概要
中国語学習専用のWebアプリケーション。単語帳機能を備え、日本語読み上げ→ユーザーの発音音声認識→日本語読み上げ→次の単語という流れで学習を進める。

## 技術スタック
- **言語**: JavaScript / TypeScript
- **フレームワーク**: React（viteベース）
- **バックエンド**: Firebase
- **バージョン管理**: GitHub
- **デプロイ**: PWA化

## 主要機能
1. **単語帳管理**
   - 単語を一つ一つ入力
   - 一括インポート機能：「1行目：中国語、2行目：ピンイン、3行目：日本語」形式のテキストを解析

2. **音声機能**
   - 日本語読み上げ（速めの設定）
   - ユーザー発音の音声認識
   - 発音判定（現在は「ある程度合っていれば通過」の簡易版）

3. **認証機能**
  - Googleアカウントログイン

## 残タスク
- Github Actionsを使用したCI/CDパイプラインの構築
　developにマージされたら自動でFirebaseにデプロイする設定を追加

## 実装済みの Firestore 機能

### ハードコードデータの削除
- コード内にハードコードされていた `CHENGYU_LIST`（32件）、`DISPLAY_CHENGYU_LIST`（13件）、`INITIAL_PHRASES`（15件）をすべて削除
- すべてのデータは Firestore `masterData` コレクションから動的に取得するように実装

### マスターデータの初期化
- **設定方法**: Firebase Console から手動で `masterData/chengyu/list` と `masterData/phrases/list` を登録
- **確認方法**: アプリ起動時にコンソールに `[Firestore] マスターデータ確認済み` が表示されることを確認
- **注意**: アプリ起動時は登録機能を按ず、確認だけを実行

### ユーザー初期化時のデータコピー
- 新規ユーザー登録時にマスターデータから自動取得
- `users/{uid}/chengyu/` と `users/{uid}/phrases/` にコピー
- Firestoreからのデータ取得に完全に移行

### データ構造の関係性
```
masterData（読み取り専用テンプレート）
├── chengyu/list/{id} → 成語基本情報のみ
└── phrases/list/{id} → フレーズ基本情報のみ

users/{uid}（ユーザー個別データ）
├── chengyu/{id} ← masterData からコピー + 学習進捗を追跡
└── phrases/{id} ← masterData からコピー + 学習進捗を追跡
```

### スタート画面の成語表示
- `randomChengyu` を動的にFirestore `masterData/chengyu/list` から読み込み
- ページ遷移時にランダムに成語を選択表示
- UIの装飾用（学習対象ではない）

### 練習セッションの学習対象
- `users/{uid}/phrases/` から読み込んだフレーズが学習対象
- ユーザーが単語帳で追加・削除した単語も直接 `users/{uid}/phrases/` に保存
- 各フレーズの `isLearned`, `attempts`, `lastAttemptAt` が学習進捗を記録

### 注記: vocabularies コレクションについて
- 現在の実装では **vocabularies は未使用**
- 将来的にユーザー独自の単語帳機能を拡張する場合に備えて、スキーマのみ定義済み
- 現在は `users/{uid}/phrases/` ですべての単語（マスターデータ + ユーザー追加）を一元管理

## 認証セキュリティ要件

### Firebase設定
- **環境変数管理**: すべてのFirebase認証情報（API キー、プロジェクトID等）は `.env.local` に配置
  - `.env.local` は `.gitignore` に追加し、Gitリポジトリにコミットしない
  - 本番環境では Firebase Hosting のシークレット管理機能を使用
- **リダイレクトURI検証**: Google Cloud Consoleで認可済みのリダイレクトURIを明示的に登録
  - 開発環境: `http://localhost:5173`, `http://localhost:3000`
  - 本番環境: 実際のデプロイドメインのみ許可

### ユーザー認証
- **ログイン方式**
  - Google OAuth 2.0（推奨）: Firebaseの`signInWithPopup()`を使用
- **セッション管理**: `onAuthStateChanged()`でユーザー状態を監視し、自動ログアウト機構を実装
- **セキュアなトークン**: Firebaseが自動管理するため、ローカルストレージへのトークン保存は不要

### データ保護
- **個人情報**: ユーザー名、メールアドレスはFirebaseのAuth APIで管理
- **学習データ**: Firestoreで一元管理（詳細は「Firestoreデータ管理」セクションを参照）
- **ローカルストレージ**: 学習状態キャッシュ以外の機密情報は保存しない

### 本番環境リリース前チェック
- [ ] `.env.local` が `.gitignore` に含まれているか確認
- [ ] PWA化時はHTTPSを強制する設定を確認
- [ ] Firestoreのセキュリティルールが本番環境用に設定されているか確認
- [ ] Firestoreの読み書きクォータが適切に設定されているか確認
- [ ] Firebase Consoleから `masterData/chengyu/list` と `masterData/phrases/list` が登録済みか確認
- [ ] Google Cloud Consoleで本番ドメインをリダイレクトURIに追加したか確認

## Firestoreデータ管理

### マスターデータ構成（システム共通）
```
masterData/
├── chengyu/（全成語データ - 全ユーザー共通）
│   └── {chengyuId}/
│       ├── chinese: string（中国語）
│       ├── pinyin: string（ピンイン）
│       ├── japanese: string（日本語訳）
│       └── createdAt: timestamp
│
└── phrases/（全フレーズデータ - 全ユーザー共通）
    └── {phraseId}/
        ├── chinese: string（中国語）
        ├── pinyin: string（ピンイン）
        ├── japanese: string（日本語訳）
        └── createdAt: timestamp
```

### ユーザーデータ構成
```
users/
├── {uid}/
│   ├── email: string（ユーザーのメールアドレス）
│   ├── displayName: string（ユーザー表示名）
│   ├── createdAt: timestamp（アカウント作成日時）
│   ├── updatedAt: timestamp（最終更新日時）
│   ├── chengyu/（サブコレクション：ユーザー専用の成語学習データ）
│   │   └── {chengyuId}/
│   │       ├── chinese: string（中国語）
│   │       ├── pinyin: string（ピンイン）
│   │       ├── japanese: string（日本語訳）
│   │       ├── isLearned: boolean（学習完了フラグ）
│   │       ├── attempts: number（試行回数）
│   │       ├── lastAttemptAt: timestamp（最終試行日時）
│   │       └── createdAt: timestamp
│   ├── phrases/（サブコレクション：ユーザー専用のフレーズ学習データ）
│   │   └── {phraseId}/
│   │       ├── chinese: string（中国語）
│   │       ├── pinyin: string（ピンイン）
│   │       ├── japanese: string（日本語訳）
│   │       ├── isLearned: boolean（学習完了フラグ）
│   │       ├── attempts: number（試行回数）
│   │       ├── lastAttemptAt: timestamp（最終試行日時）
│   │       └── createdAt: timestamp


```

### コレクション構成

### セキュリティルール
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // マスターデータ：すべてのユーザーが読み取り可能
    // 開発環境では初期化時に書き込み可能、本番環境では管理者のみ
    match /masterData/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // 開発環境では全ユーザーに許可、本番環境で制限推奨
    }
    
    // ユーザーは自分のデータのみアクセス可能
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      match /chengyu/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
      match /phrases/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
      match /vocabularies/{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
    }
  }
}
```

### データ操作ガイドライン
- **マスターデータの登録**: Firebase Console から手動で登録。以下の構造を観待ってください：
  - **chengyu**: `masterData/chengyu/list/{id}` - 中国語成語データ
  - **phrases**: `masterData/phrases/list/{id}` - 日常会話フレーズ
- **ユーザー初期化時**: 新規ユーザー登録時に、マスターデータから `users/{uid}/chengyu/` と `users/{uid}/phrases/` にコピー（バッチ処理使用）
- **リアルタイム同期**: `onSnapshot()`を使用してリアルタイムでデータ変更を監視（フレーズ取得時など）
- **バッチ処理**: 新規ユーザー登録時にマスターデータを一括コピーする場合は`writeBatch()`を使用
- **キャッシング**: オフライン対応のため`enablePersistence()`の検討
- **クォータ管理**: 本番環境でのコスト最適化
  - マスターデータは読み込みのみ（キャッシュ活用で読み取り回数削減）
  - 単語帳編集時は `saveToCloud()` で一括更新（個別更新を避ける）
  - 不要なリアルタイムリスナーは適切に削除
- **単語帳管理**: 各フレーズの `isLearned`, `attempts`, `lastAttemptAt` で学習状況をユーザーの個別データで管理

### 実装時の注意点
- Firestore呼び出しは非同期処理で、エラーハンドリングを必須とする
- ユーザーの認証状態確認後にのみデータベースアクセスを実行
- 新規ユーザー登録時に `writeBatch()` を用いて、マスターデータを `users/{uid}/chengyu/` と `users/{uid}/phrases/` にコピー
- 単語帳管理：UI上でかけた単語は `users/{uid}/phrases/` に一時一時上上しし、`saveToCloud()` で一括㘃4して保存
- 学習データ同期時は、ローカルキャッシュとの整合性を保つ
- ユーザーが学習済みデータを削除・リセットする場合は、対応するドキュメントを削除
- マスターデータは変更頻度が低いため、一度読み込んだらローカルキャッシュを活用

## 開発方針

### UI/デザイン実装
- **優先方針**: JS注入ではなくCSSファイル配下での実装を優先する
- スタイルはプロジェクト内のCSSファイルで一元管理

### コード品質
- TypeScriptの型安全性を活用
- Firebaseの認証・リアルタイムデータベース設定を適切に管理
- ユーザー入力の検証とエラーハンドリングを実装

### ファイル構成
```
my-app/
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── assets/
├── public/
└── vite.config.ts
```

## 参考情報
- Gemini共有リンク: https://g.co/gemini/share/a18f359f49a9
- Firebase設定情報: プロジェクト内のmemo.txtに記載

## Copilotへの指示
- **実装方針**: ハードコードデータはすべて削除済み。データは必ず Firestore から取得するように実装する
- **動作確認**: コードを編集したら、必ず「npm run build」と「npm run preview」で動作確認を行うこと
- **Firestore 操作**: `onSnapshot()` でリアルタイム同期、バッチ操作には `writeBatch()` を使用
- **単語帳管理**: ユーザーが追加・編集・削除した単語は `users/{uid}/phrases/` に直接保存
- **学習進捗**: 各フレーズの `isLearned`, `attempts`, `lastAttemptAt` で学習状況をユーザーの個別データで管理
- **エラーハンドリング**: Firestore呼び出しは必ずtry-catchで囲む。ネットワークエラー時の動作も定義
- **型安全性**: TypeScript の型定義を厳密に保つ
- **UI/CSS**: JS注入ではなく、CSS ファイルで実装を優先する
- **PR・コミット**: 修正内容と影響範囲を明記する

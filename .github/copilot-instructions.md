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
- FireStoreを使用した学習データのクラウド保存機能の実装
- トップ画面の成熟データの追加、更新、削除機能の実装
- 中国語読み上げから音声認識までの感覚を狭める

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
- [ ] ユーザー新規登録時の初期データセットアップ（`CHENGYU_LIST` と `INITIAL_PHRASES`）が実装されているか確認
- [ ] Google Cloud Consoleで本番ドメインをリダイレクトURIに追加したか確認

## Firestoreデータ管理

### コレクション構成
```
users/
├── {uid}/
│   ├── email: string（ユーザーのメールアドレス）
│   ├── displayName: string（ユーザー表示名）
│   ├── createdAt: timestamp（アカウント作成日時）
│   ├── updatedAt: timestamp（最終更新日時）
│   ├── chengyu/（サブコレクション：成語リスト）
│   │   └── {chengyuId}/
│   │       ├── chinese: string（中国語）
│   │       ├── pinyin: string（ピンイン）
│   │       ├── japanese: string（日本語訳）
│   │       ├── isLearned: boolean（学習完了フラグ）
│   │       ├── attempts: number（試行回数）
│   │       ├── lastAttemptAt: timestamp（最終試行日時）
│   │       └── createdAt: timestamp
│   ├── phrases/（サブコレクション：初期フレーズリスト）
│   │   └── {phraseId}/
│   │       ├── chinese: string（中国語）
│   │       ├── pinyin: string（ピンイン）
│   │       ├── japanese: string（日本語訳）
│   │       ├── isLearned: boolean（学習完了フラグ）
│   │       ├── attempts: number（試行回数）
│   │       ├── lastAttemptAt: timestamp（最終試行日時）
│   │       └── createdAt: timestamp
│   └── vocabularies/（サブコレクション：ユーザー独自の単語帳）
│       └── {vocabularyId}/
│           ├── chinese: string（中国語）
│           ├── pinyin: string（ピンイン）
│           ├── japanese: string（日本語訳）
│           ├── createdAt: timestamp
│           ├── isLearned: boolean（学習完了フラグ）
│           ├── attempts: number（試行回数）
│           └── lastAttemptAt: timestamp（最終試行日時）
│
learningProgress/
├── {uid}/
│   ├── totalWords: number（総単語数）
│   ├── learnedWords: number（習得単語数）
│   ├── todayProgress: number（本日の進捗数）
│   ├── lastSessionAt: timestamp（最後のセッション日時）
│   ├── streak: number（連続学習日数）
│   ├── chengyuLearned: number（成語習得数）
│   ├── phrasesLearned: number（フレーズ習得数）
│   └── updatedAt: timestamp
```

### セキュリティルール
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
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
    match /learningProgress/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

### データ操作ガイドライン
- **初期データセットアップ**: ユーザーのサインアップ時に、`CHENGYU_LIST` と `INITIAL_PHRASES` を自動的に `users/{uid}/chengyu/` および `users/{uid}/phrases/` に登録
- **リアルタイム同期**: `onSnapshot()`を使用してリアルタイムでデータ変更を監視
- **バッチ処理**: 複数の成語やフレーズを一括登録する場合は`writeBatch()`を使用
- **キャッシング**: オフライン対応のため`enablePersistence()`を有効化
- **クォータ管理**: 大量のデータ操作時はクォータを確認し、コストを最小化
  - 成語・フレーズの読み込みは1回のコレクション取得で済ませる工夫
  - 不要なリアルタイムリスナーは適切に削除
- **学習進捗の追跡**: 成語、フレーズ、ユーザー単語の各学習進捗を `learningProgress` で統合管理

### 実装時の注意点
- Firestore呼び出しは非同期処理で、エラーハンドリングを必須とする
- ユーザーの認証状態確認後にのみデータベースアクセスを実行
- 新規ユーザー登録時に `writeBatch()` を用いて、`CHENGYU_LIST` と `INITIAL_PHRASES` を同時に登録
- 学習データ同期時は、ローカルキャッシュとの整合性を保つ
- ユーザーが学習済みデータを削除・リセットする場合は、対応するドキュメントを削除し、`learningProgress` を更新

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
- PRやコミットメッセージを作成する際は、不具合の詳細と修正内容を明記してください
- CSS修正時は可能な限り既存のスタイルを活用し、新規クラスの追加は最小限に
- TypeScript型定義を厳密に保つ
- ユーザー体験を損なわないソリューションを提案してください

# 📅 Discord Scheduler, Reminder & Calendar Bot

SQLite を利用した予定管理と、自動リマインド、そして Puppeteer を使った美しい今月のカレンダー画像生成機能を備えた Discord ボットです。

---

## 🌟 主な機能

*   **スケジュールの登録・確認・変更・削除**: スラッシュコマンドで直感的に予定を管理できます。
*   **重複登録の防止**: 同じ日時に既に予定がある場合、既存の予定を親切に教えてくれます。
*   **全自動デイリーリマインダー**: サーバーごとに指定した時間に、その日の予定を一覧にして自動で通知します（@everyone メンションの有無や、リマインドのオン/オフも切り替え可能）。
*   **美しいカレンダー画像生成**: `/calendar` コマンドで、Discord のダークモードに最適化された今月のカレンダーを画像（PNG）として生成・投稿します。年・月の指定も選択肢から可能です。

---

## 🛠️ コマンド一覧

| コマンド | 説明 | 備考 |
| :--- | :--- | :--- |
| `/schedule` | 新しいスケジュールを登録します。 | 重複チェックあり |
| `/check` | 指定した日付のスケジュールを確認します。 ||
| `/change` | 指定した日時のスケジュールを変更します。 | |
| `/delete` | 指定した日時のスケジュールを削除します。 | |
| `/calendar` | 指定した月の予定付きカレンダー画像を生成します。 | 年・月を選択可能（デフォルトは今月） |
| `/remind-set` | 毎日の自動リマインドを有効化・設定します。 | 管理者権限が必要 |
| `/remind-off` | 自動リマインドを停止（無効化）します。 | 管理者権限が必要 |

---

## 🚀 はじめに（開発者向け・自前ホスティング手順）

このボットをご自身のサーバー（または古いPCなど）で動かすための手順です。

### 1. 前提条件
*   Node.js (v18以上推奨)
*   npm

### 2. インストール
リポジトリをクローンし、依存ライブラリを一括インストールします。

```bash
git clone [https://github.com/あなたのユーザー名/リポジトリ名.git](https://github.com/あなたのユーザー名/リポジトリ名.git)
cd リポジトリ名
npm install

### 3.設定ファイルの作成
プロジェクトのルートディレクトリに config.json を作成し、Discord Developer Portal から取得した情報を記入してください。

{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "clientId": "YOUR_CLIENT_ID"
}

⚠️ 注意: config.json や database.sqlite は機密情報やデータを含むため、Git の追記対象から除外されています（.gitignore 設定済み）。

### 4. コマンドの登録と起動
Discord サーバーにスラッシュコマンドを登録（グローバルデプロイ）し、ボットを起動します。

Bash
# コマンドの登録（初回やコマンド変更時のみでOK）
node deploy-commands.js

# ボットの起動
node index.js
📝 技術スタック
- Runtime: Node.js
- Library: Discord.js (v14)
- Database: SQLite3
- Image Generation: Puppeteer (HTML/CSS to PNG)
- Cron Job: node-cron

📄 ライセンス
MIT License

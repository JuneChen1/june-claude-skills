# 部署到 Railway

## 事前準備

確認以下項目已完成：

- [ ] Discord Bot Token 已取得（[Discord Developer Portal](https://discord.com/developers/applications)）
- [ ] Anthropic API Key 已取得
- [ ] 專案已推送到 GitHub

---

## 步驟一：確認本地設定

確認 `package.json` 有 `start` script：

```json
"scripts": {
  "start": "node discord-bot/src/index.js"
}
```

確認 `.gitignore` 已排除敏感檔案（`.env`、`node_modules/`、`discord-bot/data/`）。

---

## 步驟二：建立 Railway 專案

1. 前往 [railway.app](https://railway.app) 並登入（可用 GitHub 帳號）
2. 點選 **New Project**
3. 選擇 **Deploy from GitHub repo**
4. 授權 Railway 存取你的 GitHub，選取此 repo

Railway 會自動偵測 Node.js 並使用 `npm start` 啟動。

---

## 步驟三：設定環境變數

在 Railway 專案頁面，點選你的 service → **Variables** → **Add Variable**，依序新增以下四個：

| 變數名稱 | 說明 |
|---|---|
| `DISCORD_TOKEN` | Discord Bot Token |
| `CLIENT_ID` | Discord Application ID |
| `GUILD_ID` | 你的 Discord Server ID |
| `ANTHROPIC_API_KEY` | Anthropic API Key |

新增完畢後 Railway 會自動重新部署。

---

## 步驟四：確認部署成功

在 Railway → **Deployments** 分頁，點進最新一筆部署，確認 logs 顯示：

```
Bot ready: 你的 Bot 名稱#1234
```

---

## 步驟五：測試 Bot

回到 Discord，輸入 `/help`，Bot 應該回覆可用指令清單。

---

## 在既有 Railway Project 新增第二個 Bot

如果你已經有其他 Bot 部署在 Railway，可以加進同一個 Project，共用帳單與 Dashboard。

### 前提

兩個 Bot 必須是不同的 Discord Application（不同的 `DISCORD_TOKEN` 與 `CLIENT_ID`），但可以在同一個 Discord Server 裡運作。

### 步驟

1. 進入已有的 Railway Project
2. 點選左上角 **+ New** → **GitHub Repo**
3. 選取 `june-claude-skills` repo 並授權
4. Railway 會自動偵測 `package.json` 並使用 `npm start` 啟動
5. 點進新建立的 service → **Variables**，新增以下四個環境變數：

| 變數名稱 | 說明 |
|---|---|
| `DISCORD_TOKEN` | 此 Bot 專屬的 Token（與另一個 Bot 不同） |
| `CLIENT_ID` | 此 Bot 的 Application ID |
| `GUILD_ID` | Discord Server ID（可與另一個 Bot 相同） |
| `ANTHROPIC_API_KEY` | 可與另一個 Bot 共用同一組 Key |

6. 部署完成後，確認 logs 出現 `Bot ready: Bot名稱#xxxx`

### 結果

- 同一個 Railway Project，兩個獨立 Service
- 帳單合一，Dashboard 統一管理
- 兩個 Bot 完全獨立運作，不互相影響

---

## 注意事項

### 資料持久性問題

`sessions.json` 儲存在容器本地，**每次重啟或重新部署都會清空**，導致使用者偏好消失。

如果需要持久化，有兩個選項：

**選項 A：Railway Volume（推薦）**

1. 在 Railway canvas 空白處**按右鍵** → 選 **Volume**
2. Volume 建立後，點進 Volume → **Settings**
3. 設定 **Mount Path** 為 `/app/discord-bot/data`
4. 選擇要掛載的 service（選 `june-claude-skills`）
5. 之後重啟或重新部署，資料不會消失

**選項 B：改用外部資料庫**
- 把 `sessions.js` 改成讀寫 Railway 內建的 PostgreSQL 或 Redis

### 免費方案限制

Railway 免費方案每月有 500 小時執行時間，Discord Bot 需要 24/7 運行，建議升級到 Hobby Plan（$5/月）。

---

## 常見錯誤

| 錯誤訊息 | 原因 | 解法 |
|---|---|---|
| `Used disallowed intents` | Bot 沒開 Message Content Intent | Discord Developer Portal → Bot → 開啟 MESSAGE CONTENT INTENT |
| `Invalid token` | DISCORD_TOKEN 設定錯誤 | 重新確認 Railway 環境變數 |
| Bot 上線但指令沒反應 | slash command 還沒註冊 | 等 Bot 啟動時自動重新註冊，或確認 CLIENT_ID 正確 |

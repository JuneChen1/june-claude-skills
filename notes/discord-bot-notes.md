# Discord Bot 建立注意事項

## 指令註冊

- **Guild commands**（`applicationGuildCommands`）即時生效，但只限單一伺服器；**Global commands**（`applicationCommands`）可跨伺服器，第一次部署最長等 1 小時
- 把註冊邏輯放在 `clientReady` 裡，bot 啟動時自動部署，不需要另外跑 deploy script
- `client.user.id` 只有在 `clientReady` 之後才能取得，不能在外面使用

```js
client.once('clientReady', async () => {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commandDefs });
});
```

---

## Session 管理（多輪對話）

- 用 `userId` 當 key 存 session，但多個 skill 並存時需要額外記錄 `skill` 欄位，否則訊息路由會錯亂
- 設定訊息上限（例如 20 則）避免 context 無限增長
- Session 存 JSON 檔在本地開發不會隨 bot 重啟消失，但部署到 Railway 等容器環境時，**重啟或重新部署會清空**，需要掛 Volume 才能持久化

```js
// session 需包含 skill 欄位
store[userId] = { messages: [], skill: 'nutrition' };

// 依 skill 路由訊息
const skillHandlers = { nutrition: handleNutritionMessage, ... };
const handler = skillHandlers[getSkill(message.author.id)];
```

---

## 訊息格式

- Discord 單則訊息上限 **2000 字**，超過要切分再依序送出
- 中英文混排不要用空格或全形空格對齊，跨裝置字型寬度不一致，改用 `EmbedBuilder` 的 fields 最穩定
- 用 `message.channel.sendTyping()` 讓使用者知道 bot 在處理中

```js
// 長訊息切分
function splitMessage(text, maxLength = 2000) {
  if (text.length <= maxLength) return [text];
  // ... 依換行切分
}

// 對齊用 EmbedBuilder fields，不要用空格
new EmbedBuilder().addFields(
  { name: '/nutrition', value: '飲食紀錄分析...' },
  { name: '/retro',     value: '覆盤一次任務...' },
);
```

---

## Intent 設定

- 要讀取訊息內容（`message.content`）必須同時開啟 `GuildMessages` + `MessageContent` 兩個 intent
- `MessageContent` 在 **Discord Developer Portal** 也要手動開啟（Privileged Gateway Intents），只在程式碼設定不夠
- **換新的 Bot Application（新 token）時，新 Application 的 Privileged Gateway Intents 是預設關閉的**，需要重新到 Portal 開啟，否則啟動會出現 `Error: Used disallowed intents`

**開啟步驟：** Discord Developer Portal → 選 Application → Bot → Privileged Gateway Intents → 開啟 MESSAGE CONTENT INTENT → Save Changes

```js
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // 需在 Portal 同步開啟
  ],
});
```

---

## 錯誤處理

- 回覆前先檢查 `interaction.replied || interaction.deferred`，否則二次 reply 會噴錯
- 錯誤訊息加 `MessageFlags.Ephemeral` 讓只有當事人看到
- `messageCreate` handler 裡的 API 呼叫要加 try-catch，否則失敗時 bot 靜默卡住，使用者不會收到任何回應

```js
const msg = { content: '發生錯誤，請稍後再試。', flags: MessageFlags.Ephemeral };
interaction.replied || interaction.deferred
  ? await interaction.followUp(msg)
  : await interaction.reply(msg);
```

---

## 環境變數

| 變數 | 用途 | 必要條件 |
|---|---|---|
| `DISCORD_TOKEN` | bot 登入 | 必填 |
| `ANTHROPIC_API_KEY` | Claude API | 有用 AI 功能時必填 |
| `CLIENT_ID` | deploy script 用 | 用 guild commands 時需要 |
| `GUILD_ID` | deploy script 用 | 用 guild commands 時需要 |

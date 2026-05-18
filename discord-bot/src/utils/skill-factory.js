import { SlashCommandBuilder } from 'discord.js';
import { createSession, getSession, addMessages } from './sessions.js';
import { getClient, splitMessage } from './anthropic.js';

export function createSkillCommand({
  skillName,
  commandName,
  description,
  systemPrompt,
  initialMessage,
  welcomeBack,
  prefsLabel = '已知偏好',
  systemSuffix = '',
}) {
  const execute = async (interaction) => {
    const userId = interaction.user.id;
    createSession(userId, skillName);
    const { currentPrefs } = getSession(userId);
    const openingMsg = currentPrefs ? welcomeBack(currentPrefs) : initialMessage;
    addMessages(userId, [{ role: 'assistant', content: openingMsg }]);
    const chunks = splitMessage(openingMsg);
    await interaction.reply(chunks[0]);
    for (const chunk of chunks.slice(1)) {
      await interaction.followUp(chunk);
    }
  };

  const handleMessage = async (message) => {
    const userId = message.author.id;
    const session = getSession(userId);
    const suffix = systemSuffix ? `\n\n${systemSuffix}` : '';
    const system = session.currentPrefs
      ? `${systemPrompt}\n\n## 使用者${prefsLabel}（從上次對話儲存）\n${session.currentPrefs}${suffix}`
      : systemPrompt;

    const imageAttachments = [...message.attachments.values()].filter(
      att => att.contentType?.startsWith('image/')
    );

    const IMAGE_SIZE_LIMIT = 4 * 1024 * 1024;
    let userMessageContent;
    if (imageAttachments.length > 0) {
      const contentParts = [];
      for (const att of imageAttachments) {
        if (att.size > IMAGE_SIZE_LIMIT) {
          await message.channel.send('圖片太大，請上傳 4MB 以內的圖片。');
          continue;
        }
        try {
          const res = await fetch(att.url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          const mediaType = att.contentType.split(';')[0];
          contentParts.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: Buffer.from(buf).toString('base64') },
          });
        } catch (err) {
          console.error(`[${skillName}] 圖片下載失敗：${att.url}`, err);
        }
      }
      if (message.content.trim()) {
        contentParts.push({ type: 'text', text: message.content });
      }
      userMessageContent = contentParts;
    } else {
      userMessageContent = message.content;
    }

    if (!userMessageContent || (Array.isArray(userMessageContent) && userMessageContent.length === 0)) return;

    const userMessage = { role: 'user', content: userMessageContent };
    const imageLabel = imageAttachments.length > 0 ? `[圖片 x${imageAttachments.length}] ` : '';
    const historyContent = `${imageLabel}${message.content}`.trim();
    if (!historyContent) return;
    const userMessageForHistory = { role: 'user', content: historyContent };

    await message.channel.sendTyping();
    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system,
        messages: [...session.messages, userMessage],
      });
      const reply = response.content?.[0]?.text;
      if (!reply) throw new Error('API 回傳空內容');
      addMessages(userId, [userMessageForHistory, { role: 'assistant', content: reply }]);
      for (const chunk of splitMessage(reply)) {
        await message.channel.send(chunk);
      }
    } catch (err) {
      console.error(`[${skillName}] handleMessage error:`, err);
      await message.channel.send('發生錯誤，請稍後再試。');
    }
  };

  return {
    command: {
      data: new SlashCommandBuilder().setName(commandName).setDescription(description),
      execute,
    },
    handleMessage,
  };
}

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
    const userMessage = { role: 'user', content: message.content };
    await message.channel.sendTyping();
    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system,
        messages: [...session.messages, userMessage],
      });
      const reply = response.content[0].text;
      addMessages(userId, [userMessage, { role: 'assistant', content: reply }]);
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

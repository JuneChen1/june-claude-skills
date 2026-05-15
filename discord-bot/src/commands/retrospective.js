import { SlashCommandBuilder } from 'discord.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/retrospective.js';
import { createSession, getSession, addMessages } from '../utils/sessions.js';
import { getClient, splitMessage } from '../utils/anthropic.js';

export const retrospectiveCommand = {
  data: new SlashCommandBuilder()
    .setName('retro')
    .setDescription('開始覆盤一次任務或行動'),

  async execute(interaction) {
    const userId = interaction.user.id;
    createSession(userId, 'retrospective');
    const { currentPrefs } = getSession(userId);

    const openingMsg = currentPrefs
      ? `歡迎回來！已載入你的覆盤偏好：\n\n${currentPrefs}\n\n這次要覆盤什麼？`
      : INITIAL_MESSAGE;

    addMessages(userId, [{ role: 'assistant', content: openingMsg }]);
    await interaction.reply(openingMsg);
  },
};

export async function handleRetrospectiveMessage(message) {
  const userId = message.author.id;
  const session = getSession(userId);
  const system = session.currentPrefs
    ? `${SYSTEM_PROMPT}\n\n## 使用者已知偏好（從上次對話儲存）\n${session.currentPrefs}\n\n請根據上述偏好進行覆盤，不需要再詢問偏好。`
    : SYSTEM_PROMPT;

  const userMessage = { role: 'user', content: message.content };
  await message.channel.sendTyping();

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
}

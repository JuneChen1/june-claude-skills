import { SlashCommandBuilder } from 'discord.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/work-partner.js';
import { createSession, getSession, addMessages } from '../utils/sessions.js';
import { getClient, splitMessage } from '../utils/anthropic.js';

export const workPartnerCommand = {
  data: new SlashCommandBuilder()
    .setName('partner')
    .setDescription('找溫柔陪跑者幫你解卡'),

  async execute(interaction) {
    const userId = interaction.user.id;
    createSession(userId, 'work-partner');
    const { currentPrefs } = getSession(userId);

    const openingMsg = currentPrefs
      ? `歡迎回來！\n\n${currentPrefs}\n\n遇到什麼困難了？說說看。`
      : INITIAL_MESSAGE;

    addMessages(userId, [{ role: 'assistant', content: openingMsg }]);
    await interaction.reply(openingMsg);
  },
};

export async function handleWorkPartnerMessage(message) {
  const userId = message.author.id;
  const session = getSession(userId);
  const system = session.currentPrefs
    ? `${SYSTEM_PROMPT}\n\n## 使用者已知風格（從上次對話儲存）\n${session.currentPrefs}`
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

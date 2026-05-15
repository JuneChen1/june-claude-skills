import { SlashCommandBuilder } from 'discord.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/route-planner.js';
import { createSession, getSession, addMessages } from '../utils/sessions.js';
import { getClient, splitMessage } from '../utils/anthropic.js';

export const routePlannerCommand = {
  data: new SlashCommandBuilder()
    .setName('route')
    .setDescription('規劃路線與出發時間'),

  async execute(interaction) {
    const userId = interaction.user.id;
    createSession(userId, 'route-planner');
    const { currentPrefs } = getSession(userId);

    const openingMsg = currentPrefs
      ? `歡迎回來！已載入你的交通偏好：\n\n${currentPrefs}\n\n要去哪裡？告訴我目的地和活動時間。`
      : INITIAL_MESSAGE;

    addMessages(userId, [{ role: 'assistant', content: openingMsg }]);
    await interaction.reply(openingMsg);
  },
};

export async function handleRoutePlannerMessage(message) {
  const userId = message.author.id;
  const session = getSession(userId);
  const system = session.currentPrefs
    ? `${SYSTEM_PROMPT}\n\n## 使用者已知偏好（從上次對話儲存）\n${session.currentPrefs}\n\n請根據上述偏好直接規劃路線，不需要再詢問交通偏好。`
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

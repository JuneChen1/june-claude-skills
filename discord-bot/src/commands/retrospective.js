import { SlashCommandBuilder } from 'discord.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/retrospective.js';
import { createSession, getSession, addMessages } from '../utils/sessions.js';
import { getClient, splitMessage } from '../utils/anthropic.js';

export const retrospectiveCommand = {
  data: new SlashCommandBuilder()
    .setName('retro')
    .setDescription('開始覆盤一次任務或行動'),

  async execute(interaction) {
    createSession(interaction.user.id, 'retrospective');
    addMessages(interaction.user.id, [{ role: 'assistant', content: INITIAL_MESSAGE }]);
    await interaction.reply(INITIAL_MESSAGE);
  },
};

export async function handleRetrospectiveMessage(message) {
  const session = getSession(message.author.id);
  const userMessage = { role: 'user', content: message.content };

  await message.channel.sendTyping();

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [...session.messages, userMessage],
  });

  const reply = response.content[0].text;
  addMessages(message.author.id, [userMessage, { role: 'assistant', content: reply }]);

  for (const chunk of splitMessage(reply)) {
    await message.channel.send(chunk);
  }
}

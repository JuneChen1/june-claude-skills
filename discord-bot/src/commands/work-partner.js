import { SlashCommandBuilder } from 'discord.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/work-partner.js';
import { createSession, getSession, addMessages } from '../utils/sessions.js';
import { getClient, splitMessage } from '../utils/anthropic.js';

export const workPartnerCommand = {
  data: new SlashCommandBuilder()
    .setName('partner')
    .setDescription('找溫柔陪跑者幫你解卡'),

  async execute(interaction) {
    createSession(interaction.user.id, 'work-partner');
    addMessages(interaction.user.id, [{ role: 'assistant', content: INITIAL_MESSAGE }]);
    await interaction.reply(INITIAL_MESSAGE);
  },
};

export async function handleWorkPartnerMessage(message) {
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

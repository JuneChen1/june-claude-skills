import { SlashCommandBuilder } from 'discord.js';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/nutrition.js';
import { createSession, hasSession, getSession, addMessages } from '../utils/sessions.js';

let anthropic;
function getClient() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

function splitMessage(text, maxLength = 2000) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (current.length + line.length + 1 > maxLength) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export const nutritionCommand = {
  data: new SlashCommandBuilder()
    .setName('nutrition')
    .setDescription('開始飲食紀錄分析'),

  async execute(interaction) {
    createSession(interaction.user.id);
    await interaction.reply(INITIAL_MESSAGE);
  },
};

export async function handleNutritionMessage(message) {
  if (!hasSession(message.author.id)) return;

  const session = getSession(message.author.id);
  const userMessage = { role: 'user', content: message.content };

  await message.channel.sendTyping();

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [...session.messages, userMessage],
  });

  const reply = response.content[0].text;
  addMessages(message.author.id, [userMessage, { role: 'assistant', content: reply }]);

  for (const chunk of splitMessage(reply)) {
    await message.channel.send(chunk);
  }
}

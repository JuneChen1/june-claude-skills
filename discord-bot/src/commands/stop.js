import { SlashCommandBuilder } from 'discord.js';
import { hasSession, deleteSession } from '../utils/sessions.js';

export const stopCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('結束目前的對話'),

  async execute(interaction) {
    if (!hasSession(interaction.user.id)) {
      await interaction.reply({ content: '目前沒有進行中的對話。', ephemeral: true });
      return;
    }
    deleteSession(interaction.user.id);
    await interaction.reply({ content: '對話已結束。需要的時候再呼叫我。', ephemeral: true });
  },
};

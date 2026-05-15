import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getSession, getSkill, clearSession, saveSkillPreferences } from '../utils/sessions.js';
import { extractPreferences } from '../utils/anthropic.js';

export const stopCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('結束目前的對話並儲存偏好'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const skill = getSkill(userId);

    if (!skill) {
      await interaction.reply({ content: '目前沒有進行中的對話。', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const session = getSession(userId);

    if (session.messages.length >= 2) {
      const prefs = await extractPreferences(skill, session.messages);
      if (prefs) saveSkillPreferences(userId, skill, prefs);
    }

    clearSession(userId);
    await interaction.editReply('對話已結束，偏好已儲存。下次啟動時不需要重新設定。');
  },
};

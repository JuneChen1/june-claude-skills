import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('列出所有可用指令'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('可用指令')
      .setColor(0x5865f2)
      .addFields(
        { name: '/nutrition', value: '飲食紀錄分析，幫你回顧吃了什麼、哪裡可以調整' },
        { name: '/retro', value: '覆盤一次任務或行動，整理做得好的地方與改進點' },
        { name: '/route', value: '路線規劃，算好幾點出門、怎麼去最順' },
        { name: '/partner', value: '找溫柔陪跑者，卡住時直接給你選項幫你解卡' },
        { name: '/stop', value: '結束目前的對話' },
        { name: '/help', value: '顯示這個清單' },
      )
      .setFooter({ text: '輸入指令後，照著提示回答即可' });

    await interaction.reply({ embeds: [embed] });
  },
};

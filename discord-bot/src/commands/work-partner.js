import { createSkillCommand } from '../utils/skill-factory.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/work-partner.js';

const { command, handleMessage } = createSkillCommand({
  skillName: 'work-partner',
  commandName: 'partner',
  description: '找溫柔陪跑者幫你解卡',
  systemPrompt: SYSTEM_PROMPT,
  initialMessage: INITIAL_MESSAGE,
  welcomeBack: (prefs) => `歡迎回來！\n\n${prefs}\n\n遇到什麼困難了？說說看。`,
  prefsLabel: '已知風格',
});

export const workPartnerCommand = command;
export const handleWorkPartnerMessage = handleMessage;

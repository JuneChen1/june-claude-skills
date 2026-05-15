import { createSkillCommand } from '../utils/skill-factory.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/nutrition.js';

const { command, handleMessage } = createSkillCommand({
  skillName: 'nutrition',
  commandName: 'nutrition',
  description: '開始飲食紀錄分析',
  systemPrompt: SYSTEM_PROMPT,
  initialMessage: INITIAL_MESSAGE,
  welcomeBack: (prefs) => `歡迎回來！已載入你的設定：\n\n${prefs}\n\n直接貼飲食紀錄就可以了，需要修改設定告訴我。`,
  systemSuffix: '請根據上述偏好直接進入分析，不需要再詢問偏好設定。',
});

export const nutritionCommand = command;
export const handleNutritionMessage = handleMessage;

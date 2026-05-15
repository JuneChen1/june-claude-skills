import { createSkillCommand } from '../utils/skill-factory.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/retrospective.js';

const { command, handleMessage } = createSkillCommand({
  skillName: 'retrospective',
  commandName: 'retro',
  description: '開始覆盤一次任務或行動',
  systemPrompt: SYSTEM_PROMPT,
  initialMessage: INITIAL_MESSAGE,
  welcomeBack: (prefs) => `歡迎回來！已載入你的覆盤偏好：\n\n${prefs}\n\n這次要覆盤什麼？`,
  systemSuffix: '請根據上述偏好進行覆盤，不需要再詢問偏好。',
});

export const retrospectiveCommand = command;
export const handleRetrospectiveMessage = handleMessage;

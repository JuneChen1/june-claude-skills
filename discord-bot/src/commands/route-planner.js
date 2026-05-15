import { createSkillCommand } from '../utils/skill-factory.js';
import { SYSTEM_PROMPT, INITIAL_MESSAGE } from '../skills/route-planner.js';

const { command, handleMessage } = createSkillCommand({
  skillName: 'route-planner',
  commandName: 'route',
  description: '規劃路線與出發時間',
  systemPrompt: SYSTEM_PROMPT,
  initialMessage: INITIAL_MESSAGE,
  welcomeBack: (prefs) => `歡迎回來！已載入你的交通偏好：\n\n${prefs}\n\n要去哪裡？告訴我目的地和活動時間。`,
  systemSuffix: '請根據上述偏好直接規劃路線，不需要再詢問交通偏好。',
});

export const routePlannerCommand = command;
export const handleRoutePlannerMessage = handleMessage;

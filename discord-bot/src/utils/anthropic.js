import Anthropic from '@anthropic-ai/sdk';

let anthropic;
export function getClient() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

export function splitMessage(text, maxLength = 2000) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (line.length > maxLength) {
      if (current) { chunks.push(current); current = ''; }
      for (let i = 0; i < line.length; i += maxLength) {
        chunks.push(line.slice(i, i + maxLength));
      }
      continue;
    }
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

const PREFERENCE_PROMPTS = {
  nutrition: '請從以上對話中，用繁體中文條列整理出使用者的飲食分析偏好（目標、建議風格、飲食限制、分析重點）。最多 5 行，每行一個重點，不要多餘說明。',
  'route-planner': '請從以上對話中，用繁體中文條列整理出使用者的交通偏好（重視什麼、可接受步行時間、希望提早到達多久）。最多 3 行，每行一個重點，不要多餘說明。',
  retrospective: '請從以上對話中，用繁體中文條列整理出使用者的覆盤偏好（習慣看哪些角度、重視哪類改進）。最多 3 行，每行一個重點，不要多餘說明。',
  'work-partner': '請從以上對話中，用繁體中文條列整理出使用者偏好的決策風格或處理問題的模式。最多 3 行，每行一個重點，不要多餘說明。',
};

export async function extractPreferences(skill, messages) {
  const prompt = PREFERENCE_PROMPTS[skill];
  if (!prompt || messages.length < 2) return null;
  try {
    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [...messages, { role: 'user', content: prompt }],
    });
    return response.content[0].text.trim();
  } catch (err) {
    console.error(`[extractPreferences:${skill}]`, err);
    return null;
  }
}

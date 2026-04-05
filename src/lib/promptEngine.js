// AI プロンプト生成のロジック（prompt-api-update-tool から移植）

export function getQualityTags(modelType) {
  const tags = {
    pony: "score_9, score_8_up, score_7_up, masterpiece, best quality",
    sd15: "masterpiece, best quality",
    sdxl: "masterpiece, best quality, cinematic lighting, depth of field",
    real: "highly detailed, realistic, 8k, sharp focus"
  };
  return tags[modelType] || tags.sd15;
}

export function getModePrompt(mode) {
  const prompts = {
    generate: "Generate a high-quality Stable Diffusion prompt.",
    optimize: "Optimize the prompt.",
    enhance: "Enhance with lighting and details.",
    add: "Add missing tags."
  };
  return prompts[mode] || prompts.generate;
}

export function getStructurePrompt(structure) {
  const prompts = {
    common: `[ROLE: COMMON (Global Settings applied to ALL regions)]
TARGET: Quality tags, rendering style, global lighting/effects.
FILTER ACTION: You MUST completely DELETE any specific character traits (girls, hair, eyes, clothing, expressions), poses, and background objects/scenery from the user's input.`,
    base: `[ROLE: BASE (Background & Environment)]
TARGET: Scenery, location, time of day, weather, atmosphere, background objects.
FILTER ACTION: You MUST completely DELETE any character traits, clothing, poses, camera angles, and framing from the user's input.`,
    character: `[ROLE: CHARACTER (Subject Detail)]
TARGET: Subject count (e.g., 1girl), physical traits, clothing, poses, expressions.
FILTER ACTION: You MUST completely DELETE any background scenery, global lighting, camera angles, and framing from the user's input.`
  };
  return prompts[structure] || prompts.common;
}

export function getModelPrompt(modelType) {
  const prompts = {
    pony: "Use detailed Danbooru tags.",
    sd15: "Use concise tags.",
    sdxl: "Mix tags and natural language.",
    real: "Use natural photo language."
  };
  return prompts[modelType] || prompts.sd15;
}

export function getNegativePrompt(modelType) {
  const prompts = {
    pony: "bad anatomy, bad hands, missing fingers, extra digits",
    sd15: "bad anatomy, bad hands, low quality, blurry, watermark",
    sdxl: "low quality, blurry, artifacts, distorted",
    real: "blurry, low resolution, noise, oversaturated, unnatural lighting"
  };
  return prompts[modelType] || prompts.sd15;
}

export function buildSystemPrompt(mode, structure, modelType) {
  return `You are a Stable Diffusion prompt expert.
Task: ${getModePrompt(mode)}
Style: ${getModelPrompt(modelType)}

${getStructurePrompt(structure)}

OUTPUT RULES:
1. Output ONLY comma-separated tags.
2. NO conversational text, NO markdown formatting (\`\`\`).
3. Keep it concise (maximum 20 tags).
4. Strictly follow the ALLOWED and FORBIDDEN rules above.`;
}

// LoRA タグの退避・復元
const LORA_REGEX = /<lora:[^>]+>/gi;

export function extractLoras(input) {
  const loras = input.match(LORA_REGEX) || [];
  const cleaned = input.replace(LORA_REGEX, '').replace(/,\s*,/g, ',').trim();
  return { cleaned, loras };
}

export function restoreLoras(text, loras) {
  if (loras.length === 0) return text;
  return text + ", " + loras.join(', ');
}

export function cleanResult(text, structure, modelType) {
  // マークダウン除去
  let result = text.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();

  // common モードの場合、品質タグを先頭に付加
  if (structure === "common") {
    const qualityTags = getQualityTags(modelType);
    const existing = result;
    const clean = qualityTags.split(', ').filter(tag => !existing.includes(tag)).join(', ');
    if (clean) result = clean + ", " + result;
  }

  return result;
}

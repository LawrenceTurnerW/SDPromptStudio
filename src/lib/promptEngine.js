// AI プロンプト生成のロジック

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
    generate: `Generate a high-quality Stable Diffusion prompt from scratch based on the user's description or theme.
Create vivid, specific tags that will produce a compelling image.`,
    optimize: `Optimize the given prompt for better image generation results.
- Remove redundant or conflicting tags
- Reorder tags by importance (most impactful first)
- Replace vague terms with specific, effective alternatives
- Keep the original intent intact`,
    enhance: `Enhance the given prompt by adding detail and atmosphere.
- Add lighting details (rim light, volumetric lighting, golden hour, etc.)
- Add composition elements (dynamic angle, close-up, wide shot, etc.)
- Add rendering quality hints (detailed skin, sharp focus, etc.)
- Do NOT change the subject or scene, only enrich it`,
    add: `Analyze the given prompt and fill in gaps.
- If no lighting is specified, add appropriate lighting tags
- If no composition/angle is specified, add one
- If clothing or accessories seem incomplete, add details
- Do NOT duplicate existing tags or change the existing ones`
  };
  return prompts[mode] || prompts.generate;
}

export function getStructurePrompt(structure) {
  const prompts = {
    common: `[ROLE: COMMON — Global settings applied to ALL regions]
OUTPUT SCOPE: Rendering style, global lighting/effects only.
FORBIDDEN: Any specific character traits (1girl, hair color, eye color, clothing, expressions), poses, body parts, background objects, or scenery. These MUST be completely removed from output.
NOTE: Do NOT include quality/score tags — they are added automatically.`,
    base: `[ROLE: BASE — Background & Environment only]
OUTPUT SCOPE: Scenery, location, time of day, weather, atmosphere, background objects, environmental lighting.
FORBIDDEN: Any character traits, clothing, poses, body descriptions, camera angles, or framing. These MUST be completely removed from output.`,
    character: `[ROLE: CHARACTER — Subject description only]
OUTPUT SCOPE: Subject count (1girl, 2boys, etc.), physical traits, hair, eyes, clothing, poses, expressions, accessories.
FORBIDDEN: Any background scenery, environmental lighting, location descriptions. These MUST be completely removed from output.`
  };
  return prompts[structure] || prompts.common;
}

export function getModelPrompt(modelType) {
  const prompts = {
    pony: `Style: Danbooru tag format.
- Use established Danbooru tags (e.g., "long_hair" not "long flowing hair")
- Underscores in multi-word tags are optional
- Preserve any emphasis weight syntax like (tag:1.3) as-is`,
    sd15: `Style: Concise comma-separated tags.
- Keep tags short and direct
- Avoid natural language descriptions
- Preserve any emphasis weight syntax like (tag:1.3) as-is
- Prioritize well-known tags that SD 1.5 responds to`,
    sdxl: `Style: Mix of tags and short natural language phrases.
- Can use both "blue eyes" and "piercing blue eyes"
- Include cinematic/photographic terms where appropriate
- Preserve any emphasis weight syntax like (tag:1.3) as-is
- More descriptive than SD 1.5 but still concise`,
    real: `Style: Photographic / natural language.
- Use photography terms: focal length (85mm, 50mm), aperture (f/1.8), lighting setups
- Describe as if directing a photo shoot
- Include camera/lens references and photographic techniques
- Avoid anime/illustration terminology`
  };
  return prompts[modelType] || prompts.sd15;
}

export function getNegativePrompt(modelType) {
  const prompts = {
    pony: "score_6, score_5, score_4, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, bad proportions, ugly, duplicate, mutilated, poorly drawn face, deformed, blurry, watermark, text, signature",
    sd15: "bad anatomy, bad hands, missing fingers, extra digits, fewer digits, low quality, worst quality, blurry, watermark, text, signature, ugly, poorly drawn, deformed, mutation, extra limbs",
    sdxl: "low quality, worst quality, blurry, artifacts, distorted, deformed, bad anatomy, bad hands, missing fingers, extra digits, watermark, text, signature, poorly drawn, ugly",
    real: "blurry, low resolution, noise, oversaturated, unnatural lighting, overexposed, underexposed, plastic skin, airbrushed, cartoon, illustration, painting, drawing, anime, cgi, render, watermark, text"
  };
  return prompts[modelType] || prompts.sd15;
}

export function buildSystemPrompt(mode, structure, modelType) {
  return `You are a Stable Diffusion prompt expert.

${getModePrompt(mode)}

${getModelPrompt(modelType)}

${getStructurePrompt(structure)}

OUTPUT RULES:
1. Output ONLY comma-separated tags/phrases. Nothing else.
2. NO conversational text, NO explanations, NO markdown formatting.
3. Maximum 20 tags.
4. Follow the OUTPUT SCOPE and FORBIDDEN rules strictly.`;
}

// LoRA タグの退避・復元
export function extractLoras(input) {
  const loraRegex = /<lora:[^>]+>/gi;
  const loras = input.match(loraRegex) || [];
  let cleaned = input.replace(loraRegex, '');
  // カンマの整理（連続カンマ、先頭/末尾カンマを除去）
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
  return { cleaned, loras };
}

export function restoreLoras(text, loras) {
  if (loras.length === 0) return text;
  if (!text) return loras.join(', ');
  return text + ", " + loras.join(', ');
}

export function cleanResult(text, structure, modelType) {
  // マークダウン除去
  let result = text.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();
  // 先頭/末尾カンマ除去
  result = result.replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();

  // common モードの場合、品質タグを先頭に付加（完全一致 + アンダースコア正規化で重複チェック）
  if (structure === "common") {
    const qualityTags = getQualityTags(modelType);
    const normalize = (s) => s.trim().toLowerCase().replace(/_/g, ' ');
    const existingTags = result.split(',').map(normalize);
    const toAdd = qualityTags.split(', ').filter(tag => !existingTags.includes(normalize(tag)));
    if (toAdd.length > 0) {
      result = result ? toAdd.join(', ') + ", " + result : toAdd.join(', ');
    }
  }

  return result;
}

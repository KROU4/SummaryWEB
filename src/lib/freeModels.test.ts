import { describe, expect, it } from 'vitest';
import { FREE_MODEL_CATALOG, FREE_MODEL_IDS, getCuratedFreeModels } from './freeModels';

describe('free model catalog', () => {
  it('includes the supplied OpenRouter free router and Google free entries', () => {
    expect(FREE_MODEL_IDS.has('openrouter/free')).toBe(true);
    expect(FREE_MODEL_IDS.has('google/gemma-4-26b-a4b-it:free')).toBe(true);
    expect(FREE_MODEL_IDS.has('google/gemma-4-31b-it:free')).toBe(true);
    expect(FREE_MODEL_IDS.has('nvidia/nemotron-3-ultra-550b-a55b:free')).toBe(true);
  });

  it('removes missing or non-summary utility models', () => {
    expect(FREE_MODEL_IDS.has('google/gemini-2.0-flash-exp:free')).toBe(false);
    expect(FREE_MODEL_IDS.has('google/gemini-2.5-flash-image-preview:free')).toBe(false);
    expect(FREE_MODEL_IDS.has('nvidia/nemotron-3.5-content-safety:free')).toBe(false);
    expect(FREE_MODEL_IDS.has('nvidia/llama-nemotron-rerank-vl-1b-v2:free')).toBe(false);
  });

  it('marks all curated models as summary compatible', () => {
    const models = getCuratedFreeModels();
    expect(models.every((model) => model.supportsSummary)).toBe(true);
  });

  it('does not advertise free models as YouTube video compatible', () => {
    const models = getCuratedFreeModels();
    expect(models.every((model) => !model.supportsVideo)).toBe(true);
  });

  it('keeps catalog ids unique', () => {
    expect(new Set(FREE_MODEL_CATALOG.map((model) => model.id)).size).toBe(FREE_MODEL_CATALOG.length);
  });
});

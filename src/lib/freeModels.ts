import type { OpenRouterModel } from '../types/summary';

export type FreeModelCatalogItem = {
  id: string;
  name: string;
  description: string;
  tags: string[];
};

export const FREE_MODEL_CATALOG: FreeModelCatalogItem[] = [
  {
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    name: 'Venice: Uncensored',
    description: 'Бесплатная текстовая модель широкого профиля на базе Mistral.',
    tags: ['general', 'creative'],
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B A4B',
    description: 'Free-модель Google с text output и multimodal input, подходит для текстовых саммари и больших материалов.',
    tags: ['google', 'multimodal'],
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google: Gemma 4 31B',
    description: 'Актуальная free-модель Google с text output и multimodal input.',
    tags: ['google', 'multimodal'],
  },
  {
    id: 'liquid/lfm-2.5-1.2b-instruct:free',
    name: 'LiquidAI: LFM2.5 1.2B Instruct',
    description: 'Легкая instruct-модель для быстрых простых выжимок и общих текстовых задач.',
    tags: ['small', 'fast'],
  },
  {
    id: 'liquid/lfm-2.5-1.2b-thinking:free',
    name: 'LiquidAI: LFM2.5 1.2B Thinking',
    description: 'Легкая thinking-модель для текстовых задач, где нужен более аккуратный разбор.',
    tags: ['small', 'reasoning'],
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Meta: Llama 3.2 3B Instruct',
    description: 'Компактная free-модель Meta для простых и быстрых текстовых задач.',
    tags: ['meta', 'small'],
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta: Llama 3.3 70B Instruct',
    description: 'Стабильная instruct-модель Llama для широкого круга текстовых задач.',
    tags: ['meta', 'general'],
  },
  {
    id: 'nex-agi/nex-n2-pro:free',
    name: 'Nex AGI: Nex N2 Pro',
    description: 'Free-модель с text output и text/image input для агентных и аналитических задач.',
    tags: ['agentic', 'vision'],
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Nous: Hermes 3 405B Instruct',
    description: 'Крупная free-модель Nous для общих текстовых задач и креативного письма.',
    tags: ['general', 'creative'],
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'NVIDIA: Nemotron 3 Nano 30B A3B',
    description: 'Эффективная free-модель NVIDIA для специализированных текстовых агентов.',
    tags: ['nvidia', 'agentic'],
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA: Nemotron 3 Nano Omni',
    description: 'Reasoning free-модель NVIDIA с text output и multimodal input.',
    tags: ['nvidia', 'reasoning'],
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'NVIDIA: Nemotron 3 Super',
    description: 'Free-модель NVIDIA для планирования, аналитики и сложных текстовых задач.',
    tags: ['nvidia', 'planning'],
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA: Nemotron 3 Ultra',
    description: 'Актуальный ID крупной free-модели NVIDIA Ultra для сложного анализа.',
    tags: ['nvidia', 'research'],
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'NVIDIA: Nemotron Nano 12B 2 VL',
    description: 'Компактная free-модель с vision input и text output.',
    tags: ['nvidia', 'vision'],
  },
  {
    id: 'nvidia/nemotron-nano-9b-v2:free',
    name: 'NVIDIA: Nemotron Nano 9B V2',
    description: 'Быстрая компактная free-модель NVIDIA для текстовых задач.',
    tags: ['nvidia', 'fast'],
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'OpenAI: GPT OSS 120B',
    description: 'Крупная open-weight free-модель OpenAI для рассуждений и сложных задач.',
    tags: ['openai', 'reasoning'],
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'OpenAI: GPT OSS 20B',
    description: 'Более легкая free-модель OpenAI для быстрых текстовых задач.',
    tags: ['openai', 'fast'],
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter: Free Models Router',
    description: 'Роутер OpenRouter, который подбирает доступную free-модель под запрос.',
    tags: ['router', 'free'],
  },
  {
    id: 'poolside/laguna-m.1:free',
    name: 'Poolside: Laguna M.1',
    description: 'Free-модель Poolside, ориентированная на задачи программирования.',
    tags: ['poolside', 'code'],
  },
  {
    id: 'poolside/laguna-xs.2:free',
    name: 'Poolside: Laguna XS.2',
    description: 'Компактная free-модель Poolside для быстрых coding-задач.',
    tags: ['poolside', 'code', 'fast'],
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen: Qwen3 Coder 480B A35B',
    description: 'Free-модель Qwen, сильная в коде и технических задачах.',
    tags: ['qwen', 'code'],
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct:free',
    name: 'Qwen: Qwen3 Next 80B A3B Instruct',
    description: 'Многоязычная free-модель Qwen для instruct-задач и саммаризации.',
    tags: ['qwen', 'multilingual'],
  },
];

export const FREE_MODEL_IDS = new Set(FREE_MODEL_CATALOG.map((model) => model.id));

export function getCuratedFreeModels(): OpenRouterModel[] {
  return FREE_MODEL_CATALOG.map((model) => ({
    id: model.id,
    name: model.name,
    description: model.description,
    inputModalities: model.tags.includes('video') ? ['text', 'image', 'video'] : ['text'],
    outputModalities: ['text'],
    supportedFeatures: [],
    isFree: true,
    isReady: true,
    supportsVideo: model.tags.includes('video'),
    supportsFile: model.tags.includes('vision') || model.tags.includes('multimodal'),
    supportsSummary: true,
  }));
}

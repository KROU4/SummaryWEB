export type SourceType = 'pdf' | 'youtube';

export type SummaryLength = 'short' | 'medium' | 'detailed';
export type SummaryLanguage = 'ru' | 'en';
export type PdfEngine = 'cloudflare-ai' | 'pdf-text' | 'native';

export type SummarySection = {
  heading: string;
  summary: string;
  points: string[];
};

export type Summary = {
  title: string;
  sourceType: SourceType;
  tldr: string;
  readingTimeSaved?: string;
  keyPoints: string[];
  sections: SummarySection[];
  keyTakeaways: string[];
  notableQuotes?: { text: string; context?: string }[];
  glossary?: { term: string; definition: string }[];
  openQuestions?: string[];
};

export type SummaryRecord = {
  id: string;
  createdAt: string;
  title: string;
  sourceType: SourceType;
  sourceRef: string;
  model: string;
  summary: Summary;
};

export type SummarySettings = {
  language: SummaryLanguage;
  length: SummaryLength;
  model: string;
  pdfEngine: PdfEngine;
  freeOnly: boolean;
};

export type OpenRouterModel = {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  inputModalities: string[];
  outputModalities: string[];
  supportedFeatures: string[];
  isFree?: boolean;
  isReady?: boolean;
  supportsVideo: boolean;
  supportsFile: boolean;
  supportsSummary: boolean;
};

export type InputTab = SourceType;

export type ProcessingStep = 'idle' | 'preparing' | 'transcribing' | 'sending' | 'generating' | 'saving' | 'done';

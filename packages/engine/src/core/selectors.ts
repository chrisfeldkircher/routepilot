import type { StepSelectorConfig } from '../types';

const toArray = <T,>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

type ParsedSelector = {
  raw: string;
  css: string;
  highlight: boolean;
};

const parseSelector = (value: string): ParsedSelector => {
  const raw = value.trim();
  const highlight = raw.startsWith('highlight:');
  const css = highlight ? raw.slice('highlight:'.length).trim() : raw;
  return { raw, css, highlight };
};

const toParsedSelectors = (selector: string | string[]): ParsedSelector[] =>
  toArray(selector).map(parseSelector);

export const toStepSelectorConfig = (selector: string | string[] | undefined): StepSelectorConfig[] => {
  if (!selector) return [];
  return toParsedSelectors(selector).map(({ css, highlight }) => ({
    target: css,
    ...(highlight ? { highlight: true } : {}),
  }));
};
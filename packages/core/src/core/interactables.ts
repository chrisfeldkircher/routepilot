import type { StepInteractableRef, StepInteractablesConfig } from '../types';

export function toInteractableIds(
  value?: StepInteractableRef | StepInteractableRef[]
): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => v.id);
  return [value.id];
}

export function setLockAttr(
  kind: 'open' | 'close',
  ids: string[],
  action: 'add' | 'remove'
): void {
  if (typeof document === 'undefined') return;

  const attr = kind === 'open' ? 'data-tour-lock-open' : 'data-tour-lock-close';
  const el = document.documentElement;

  const current = new Set(
    (el.getAttribute(attr) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  for (const id of ids) {
    if (action === 'add') current.add(id);
    else current.delete(id);
  }

  if (current.size === 0) {
    el.removeAttribute(attr);
  } else {
    el.setAttribute(attr, Array.from(current).join(','));
  }
}

export function emitInteractableEvent(type: 'open' | 'close', id: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(`guided-tour:interactable-${type}`, {
      detail: { id },
    })
  );
}

export function handleInteractablesEnter(
  cfg: StepInteractablesConfig | StepInteractablesConfig[]
): void {
  const configs = Array.isArray(cfg) ? cfg : [cfg];

  for (const config of configs) { 
    toInteractableIds(config.open).forEach((id) =>
      emitInteractableEvent('open', id)
    );
    toInteractableIds(config.close).forEach((id) =>
      emitInteractableEvent('close', id)
    );

    setLockAttr('open', toInteractableIds(config.lockOpen), 'add');
    setLockAttr('close', toInteractableIds(config.lockClose), 'add');
  }
}

export function handleInteractablesExit(
  cfg: StepInteractablesConfig | StepInteractablesConfig[]
): void {
  const configs = Array.isArray(cfg) ? cfg : [cfg];

  for (const config of configs) {
    const releaseOpenIds = toInteractableIds(config.releaseOpen ?? config.lockOpen);
    const releaseCloseIds = toInteractableIds(config.releaseClose ?? config.lockClose);

    setLockAttr('open', releaseOpenIds, 'remove');
    setLockAttr('close', releaseCloseIds, 'remove');
  }
}

export type MuTriggerEvent = CustomEvent<{ type: 'open' | 'close' | 'toggle' }>;

export function dispatchMuTriggerEvent(element: Node | null | undefined, type: MuTriggerEvent['detail']['type']) {
  if (!element) return;

  const event: MuTriggerEvent = new CustomEvent('muTrigger', { detail: { type } });
  element.dispatchEvent(event);
}

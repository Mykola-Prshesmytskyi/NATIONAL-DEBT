export function queryRequired<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

export function setProgress(element: HTMLElement, spent: number, total: number): void {
  const percent = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  element.style.width = `${Math.max(percent, 0)}%`;
  element.classList.toggle("is-over", spent > total);
}

export function restoreSelectValue(
  select: HTMLSelectElement,
  preferredValue?: string,
  fallbackValue?: string,
): void {
  const values = [...select.options].map((option) => option.value);
  if (preferredValue && values.includes(preferredValue)) {
    select.value = preferredValue;
    return;
  }
  if (fallbackValue && values.includes(fallbackValue)) {
    select.value = fallbackValue;
  }
}


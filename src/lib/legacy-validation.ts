export interface NumericRule { required: boolean; positive: boolean; min?: number; max?: number; integer: boolean; }
export function numericError(raw: string, rule: NumericRule): string | null {
  if (!raw.trim()) return rule.required ? 'Enter a value.' : null;
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.trim())) return 'Enter a decimal number.';
  const n = Number(raw);
  if (!Number.isFinite(n)) return 'Enter a finite number.';
  if (rule.positive && n <= 0) return 'Enter a number greater than zero.';
  if (n < (rule.min ?? 0)) return `Enter a number at least ${rule.min ?? 0}.`;
  if (n > Math.min(rule.max ?? 1e9, 1e9)) return `Enter a number no greater than ${Math.min(rule.max ?? 1e9, 1e9)}.`;
  if (rule.integer && !Number.isInteger(n)) return 'Enter a whole number.';
  return null;
}
export const legacyForms: Record<string, string> = {
  'gravel-form':'g-results','c-form':'c-results','rp-form':'rp-results',
  'pv-form':'pv-results','m-form':'m-results','pea-form':'p-results',
  'd-form':'d-results','dk-form':'dk-results','rsq-form':'rsq-results','f-form':'f-results',
};
const positive = new Set(['g-length','g-width','g-depth','g-custom-density','c-len','c-wid','c-thick','rp-run','pv-len','pv-wid','pv-plen','pv-pwid','m-len','m-wid','m-depth','p-length','p-width','p-depth','d-len','d-wid','d-depth','dk-len','dk-wid','dk-bw','dk-bl','rsq-len','rsq-wid','f-len','f-height','f-spacing','f-hole','f-fill','f-postw','f-yield']);
export function initLegacyValidation() {
  for (const [id, resultId] of Object.entries(legacyForms)) {
    const form = document.getElementById(id) as HTMLFormElement | null;
    const results = document.getElementById(resultId);
    if (!form || !results || form.dataset.validationReady) continue;
    form.dataset.validationReady = 'true';
    const notice = document.createElement('p');
    notice.id = `${id}-validation`;
    notice.className = 'hidden mt-3 text-sm text-error';
    notice.setAttribute('role','alert');
    form.append(notice);
    const clear = () => {
      results.classList.add('hidden');
      notice.classList.add('hidden');
      notice.textContent = '';
      form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    };
    form.addEventListener('input',clear);
    form.addEventListener('change',clear);
    form.addEventListener('reset',clear);
    form.addEventListener('submit',event=>{
      clear();
      for (const input of form.querySelectorAll<HTMLInputElement>('input[type="number"]')) {
        if (input.id === 'g-custom-density' && (document.getElementById('g-material') as HTMLSelectElement | null)?.value !== 'custom') continue;
        const message = numericError(input.value, {
          required: !input.id.endsWith('-price'), positive: positive.has(input.id),
          min: input.min === '' ? undefined : Number(input.min),
          max: input.max === '' ? undefined : Number(input.max),
          integer: input.step !== 'any' && !input.id.endsWith('-price') && !input.id.includes('density') && !input.id.endsWith('-waste'),
        });
        if (message) {
          event.preventDefault(); event.stopImmediatePropagation();
          input.setAttribute('aria-invalid','true');
          const label = input.closest('label')?.querySelector('span')?.textContent?.trim() ?? 'Input';
          notice.textContent = `${label}: ${message}`;
          notice.classList.remove('hidden'); input.focus(); return;
        }
      }
    },true);
  }
}

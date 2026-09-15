import type { Model } from './calculator-types.ts';
import { fmt, readInputs, unitLabels } from './calculator-math.ts';

// Examples describe the executable form. They are not independent formula tests.
// Missing design/product inputs stay blank in the form; example-only values are
// explicitly identified as hypothetical and never silently become defaults.
const exampleOnly: Record<string, number> = { allowable: 1000, coverage: 100, price: 10 };
export function getCalculatorContent(title: string, model: Model) {
  const raw: Record<string, number> = {};
  const units: Record<string, string> = {};
  const supplied: string[] = [];
  for (const field of model.fields) {
    if (field.optional) continue;
    const value = field.value ?? exampleOnly[field.id];
    if (value === undefined) throw new Error(`Missing explicit worked-example input: ${title}/${field.id}`);
    raw[field.id] = value;
    units[field.id] = field.unit ?? '';
    if (field.value === undefined) supplied.push(field.label);
  }
  const calculation = model.calculate(readInputs(model.fields, raw, units), units);
  const outputs = calculation.rows.map(r => r.label);
  const description = `${title}: estimate ${outputs.slice(0, 2).join(' and ').toLowerCase()} from your inputs. See the formula, worked example and assumptions.`;
  const fields = model.fields.filter(f => !f.optional);
  return {
    description,
    outputs,
    fields,
    inputs: fields.map(f => `${f.label}: ${fmt(raw[f.id])}${f.unit ? ` ${unitLabels[f.unit] ?? f.unit}` : ''}`),
    example: calculation,
    exampleNote: supplied.length ? `Illustrative inputs only: ${supplied.join(', ')}. Replace these with your product quote or project specification; they are not recommended values.` : 'This example uses the initial form values. Change the inputs above for your own project.',
    instructions: [
      'Enter the measurements and quantities listed below. Select the unit beside each measurement.',
      ...model.fields.filter(f => f.help && f.id !== 'price').map(f => `${f.label}: ${f.help}`),
      ...(model.fields.some(f => f.id === 'price') ? ['Enter the quoted price in the displayed unit when you want a cost estimate. Read the cost assumptions to see what is included.'] : []),
      'Calculate updates the result; Reset restores initial values and units. Copy Result copies the current valid results.',
    ],
    faq: [
      { q: `What does the ${title} calculate?`, a: outputs.join('; ') + '. The results are estimates under the assumptions shown on this page.' },
      { q: 'Which measurements and units should I use?', a: fields.map(f => f.label + (f.unit ? ` (${unitLabels[f.unit] ?? f.unit})` : '')).join('; ') + '. Select the matching unit in the form before entering a measurement.' },
      { q: 'What does Reset do?', a: 'Reset restores the initial values and units. Required product or design inputs that started blank must be entered again.' },
      { q: 'What are the limitations of this estimate?', a: model.assumptions.join(' ') },
    ],
  };
}

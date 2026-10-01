import type { Model } from './calculator-types.ts';
import { fmt, readInputs, unitLabels } from './calculator-math.ts';

// Examples describe the executable form. They are not independent formula tests.
// Missing design/product inputs stay blank in the form; example-only values are
// explicitly identified as hypothetical and never silently become defaults.
const exampleOnly: Record<string, number> = { allowable: 1000, coverage: 100, price: 10 };
const projectFaq: Record<string, { q: string; a: string }[]> = {
  'Excavation Calculator': [
    {
      q: 'Should I enter the bottom or top excavation dimensions?',
      a: 'Enter the length and width at the bottom of the excavation. With side slope s horizontal per 1 vertical and depth h, the top length and width each increase by 2 × s × h. Use the slope specified for the project; this calculator does not select a safe slope or shoring system.',
    },
    {
      q: 'How is excavation volume calculated when the sides slope?',
      a: 'For bottom length L, bottom width W, depth h and the same outward side slope s on all four sides, bank volume is L × W × h + s × (L + W) × h² + (4/3) × s² × h³. Use consistent length units. Cubic feet divided by 27 gives cubic yards; multiply by the number of identical excavations before applying swell.',
    },
    {
      q: 'Does the optional excavation price use bank or loose cubic yards?',
      a: 'The optional per-cubic-yard price multiplies the in-place bank volume. Swell changes the loose haul volume, not that price basis. Use the Excavation Cost Calculator when you need separate bank excavation and loose haul or disposal rates, truck trips and entered project costs.',
    },
  ],
};
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
  const uniqueOutputs = [...new Set(outputs.map(o => o.toLowerCase()))].map(l => outputs.find(o => o.toLowerCase() === l)!);
  const hasWaste = model.fields.some(f => f.id === 'waste');
  const hasPrice = model.fields.some(f => f.id === 'price');
  const primaryOutputs = uniqueOutputs.slice(0, 3).map(output => output.toLowerCase());
  const primary = primaryOutputs.length > 1
    ? `${primaryOutputs.slice(0, -1).join(', ')} and ${primaryOutputs.at(-1)}`
    : (primaryOutputs[0] ?? 'project quantities');
  const outputScope = uniqueOutputs.length > 3 ? `${primary} and related estimates` : primary;
  // Rich, specific, model-accurate — no invented prices or unsupported features.
  // Avoid internal template phrasing such as "plus 10 more" in search snippets.
  const baseDesc = `${title} — calculate ${outputScope} from your measurements${hasWaste ? ' with waste allowance' : ''}. US customary & metric units supported${hasPrice ? ' with optional cost estimate' : ''}.`;
  const tail = ' Formula, worked example & assumptions included.';
  let description = baseDesc + tail;
  // Ensure 130-160 chars: pad with field context if too short, truncate cleanly if too long
  if (description.length < 130) {
    const fieldHint = ` Enter ${model.fields.filter(f => !f.optional).slice(0, 3).map(f => f.label.toLowerCase()).join(', ')} to get instant results.`;
    description = baseDesc + fieldHint + tail;
  }
  if (description.length > 160) {
    // Truncate to 157 and end at word boundary
    let cut = description.slice(0, 157);
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 120) cut = cut.slice(0, lastSpace);
    description = cut + '...';
  }
  const exampleFieldVisible = (field: Model['fields'][number]) => {
    const rule = field.visibleWhen;
    if (!rule) return true;
    const controllingValue = raw[rule.field];
    if (rule.equals !== undefined) return controllingValue === rule.equals;
    return (rule.in ?? []).includes(controllingValue);
  };
  const fields = model.fields.filter(f => !f.optional && exampleFieldVisible(f)).map(field =>
    field.options?.length && !field.help
      ? { ...field, help: `Choose the option matching your project: ${field.options.map(option => option.label).join('; ')}.` }
      : field,
  );
  return {
    description,
    outputs: uniqueOutputs,
    fields,
    inputs: fields.map((f) => {
      const option = f.options?.find((item) => item.value === raw[f.id]);
      const displayValue = option?.label ?? fmt(raw[f.id]);
      const displayUnit = option ? '' : (f.unit ? ` ${unitLabels[f.unit] ?? f.unit}` : '');
      return `${f.label}: ${displayValue}${displayUnit}`;
    }),
    example: calculation,
    exampleNote: supplied.length ? `Illustrative inputs only: ${supplied.join(', ')}. Replace these with your product quote or project specification; they are not recommended values.` : 'This example uses the initial form values. Change the inputs above for your own project.',
    instructions: [
      'Enter the measurements and quantities listed below. Select the unit beside each measurement.',
      ...model.fields.filter(f => f.help && f.id !== 'price').map(f => `${f.label}: ${f.help}`),
      ...(model.fields.some(f => f.id === 'price') ? ['Enter the quoted price in the displayed unit when you want a cost estimate. Read the cost assumptions to see what is included.'] : []),
      'Calculate updates the result; Reset restores initial values and units. Copy Result copies the current valid results, Share creates a restorable link with the current inputs, and Print opens a result-focused print view.',
    ],
    faq: [
      { q: `What does the ${title} calculate?`, a: uniqueOutputs.join('; ') + '. The results are estimates under the assumptions shown on this page.' },
      { q: 'Which measurements and units should I use?', a: fields.map(f => f.label + (f.unit ? ` (${unitLabels[f.unit] ?? f.unit})` : '')).join('; ') + '. Select the matching unit in the form before entering a measurement.' },
      { q: 'What does Reset do?', a: 'Reset restores the initial values and units. Required product or design inputs that started blank must be entered again.' },
      { q: 'What are the limitations of this estimate?', a: model.assumptions.join(' ') },
      ...(projectFaq[title] ?? []),
    ],
  };
}

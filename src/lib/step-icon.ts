/**
 * The picture for a step of the work, so a master who cannot read well knows it by sight: scissors for cutting, a thread and
 * needle for stitching, a sewing machine for embroidery... The office types the step names, so the picture is found from words in the
 * name (in English); a name with no known word gets no picture and the screen shows its number or tick as before.
 */
const RULES: [RegExp, string][] = [
  [/cut/i, "scissors"],
  [/stitch|sew|silai|tailor/i, "thread"],
  [/embroid|zari|zardozi|hand ?work|bead|sequin|karigar/i, "machine"],
  [/quality|inspect|\bqc\b|final|check/i, "qc"],
  [/trial|fitting|\bfit\b/i, "hanger"],
  [/pack/i, "box"],
  [/ship|deliver|courier|dispatch/i, "shipments"],
  [/receiv|new order/i, "clipboard"],
  [/press|iron|steam/i, "iron"],
  [/button/i, "button"],
  [/measure|size/i, "tape"],
  [/lining|fabric|cloth|material/i, "cloth"],
  [/dye|colou?r|wash|dry/i, "drop"],
];

/** The icon name for a step name, or null when no word in it is known. */
export function stepIconName(label: string): string | null {
  for (const [re, icon] of RULES) if (re.test(label)) return icon;
  return null;
}

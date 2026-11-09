export function makeRng(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export function gaussian(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function addNoise(value, resolution, rng, k = 1) {
  return value + gaussian(rng) * resolution * k;
}
export function roundToResolution(value, resolution) {
  if (resolution <= 0) return value;
  return Math.round(value / resolution) * resolution;
}
export function formatSigFigs(value, sig = 3) {
  if (!isFinite(value)) return String(value);
  if (value === 0) return "0";
  const mag = Math.floor(Math.log10(Math.abs(value)));
  const dec = Math.max(0, sig - 1 - mag);
  return value.toFixed(dec);
}
export function relativeUncertainty(u, value) {
  if (value === 0) return Infinity;
  return Math.abs(u / value);
}
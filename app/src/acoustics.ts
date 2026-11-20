// 25 ms speech frames, a 20 ms hop, and cepstral features from 24 mel bands.
// Only reference features are shipped. A child's features live for one comparison.
const rate = 16000,
  fftSize = 512,
  frameSize = 400,
  hop = 320;
const bands = 24,
  dimensions = 12;
const windowWeights = Array.from(
  { length: frameSize },
  (_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (frameSize - 1)),
);
const cos = Array.from({ length: fftSize }, (_, i) =>
  Math.cos((-2 * Math.PI * i) / fftSize),
);
const sin = Array.from({ length: fftSize }, (_, i) =>
  Math.sin((-2 * Math.PI * i) / fftSize),
);
const edges = Array.from({ length: bands + 2 }, (_, i) => {
  const hz = 700 * (Math.pow(1 + 7600 / 700, i / (bands + 1)) - 1);
  return Math.floor((fftSize * hz) / rate);
});
const dct = Array.from({ length: dimensions }, (_, k) =>
  Array.from({ length: bands }, (_, b) =>
    Math.cos((Math.PI * (k + 1) * (b + 0.5)) / bands),
  ),
);

function spectrum(real: Float64Array) {
  const imag = new Float64Array(fftSize);
  for (let i = 1, j = 0; i < fftSize; i++) {
    let bit = fftSize >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [real[i], real[j]] = [real[j], real[i]];
  }
  for (let size = 2; size <= fftSize; size *= 2) {
    const half = size / 2;
    for (let start = 0; start < fftSize; start += size) {
      for (let k = 0; k < half; k++) {
        const a = start + k,
          b = a + half,
          twiddle = (k * fftSize) / size;
        const r = real[b] * cos[twiddle] - imag[b] * sin[twiddle];
        const im = real[b] * sin[twiddle] + imag[b] * cos[twiddle];
        real[b] = real[a] - r;
        imag[b] = imag[a] - im;
        real[a] += r;
        imag[a] += im;
      }
    }
  }
  for (let i = 0; i <= fftSize / 2; i++) real[i] = real[i] ** 2 + imag[i] ** 2;
  return real;
}
export function speechFeatures(
  samples: Float32Array,
  sampleRate: number,
): Int8Array {
  const length = Math.floor((samples.length * rate) / sampleRate);
  const pcm = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const at = (i * sampleRate) / rate,
      left = Math.floor(at),
      mix = at - left;
    pcm[i] =
      samples[left] * (1 - mix) +
      (samples[Math.min(left + 1, samples.length - 1)] ?? 0) * mix;
  }
  const levels: number[] = [];
  for (let i = 0; i + frameSize <= length; i += hop) {
    let energy = 0;
    for (let j = i; j < i + frameSize; j++) energy += pcm[j] * pcm[j];
    levels.push(Math.sqrt(energy / frameSize));
  }
  const peak = Math.max(0, ...levels),
    floor = Math.max(0.002, peak * 0.045);
  const first = levels.findIndex((x) => x > floor);
  let last = levels.length - 1;
  while (last >= 0 && levels[last] <= floor) last--;
  if (peak < 0.006 || last - first < 5 || first < 0 || last - first > 240)
    return new Int8Array();
  const output: number[] = [];
  for (let t = first; t <= last; t++) {
    const raw = new Float64Array(fftSize),
      offset = t * hop;
    for (let i = 0; i < frameSize; i++)
      raw[i] =
        (pcm[offset + i] - 0.96 * (pcm[offset + i - 1] ?? 0)) *
        windowWeights[i];
    const power = spectrum(raw);
    const mel = edges.slice(1, -1).map((mid, b) => {
      let sum = 0;
      for (let i = edges[b]; i < mid; i++)
        sum += (power[i] * (i - edges[b])) / (mid - edges[b]);
      for (let i = mid; i < edges[b + 2]; i++)
        sum += (power[i] * (edges[b + 2] - i)) / (edges[b + 2] - mid);
      return Math.log(Math.max(1e-10, sum));
    });
    const coeff = dct.map(
      (row, k) => row.reduce((v, c, i) => v + c * mel[i], 0) * (1 + 0.15 * k),
    );
    const magnitude = Math.hypot(...coeff) || 1;
    output.push(...coeff.map((x) => Math.round((100 * x) / magnitude)));
  }
  return Int8Array.from(output);
}

// Align faster and slower attempts while penalizing stretched or missing sounds.
export function speechDistance(a: Int8Array, b: Int8Array) {
  const m = a.length / dimensions,
    n = b.length / dimensions;
  if (!m || !n || Math.max(m, n) / Math.min(m, n) > 2.35) return Infinity;
  let prev = new Float64Array(n + 1).fill(Infinity),
    curr = new Float64Array(n + 1);
  prev[0] = 0;
  for (let i = 1; i <= m; i++) {
    curr.fill(Infinity);
    const center = (i * n) / m,
      band = Math.ceil(n * 0.3) + 2;
    for (
      let j = Math.max(1, Math.floor(center - band));
      j <= Math.min(n, Math.ceil(center + band));
      j++
    ) {
      let sum = 0;
      for (let k = 0; k < dimensions; k++)
        sum += (a[(i - 1) * dimensions + k] - b[(j - 1) * dimensions + k]) ** 2;
      const d = sum / 20000;
      curr[j] = Math.min(
        prev[j - 1] + 2 * d,
        prev[j] + d + 0.07,
        curr[j - 1] + d + 0.07,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] / (m + n) + 0.045 * Math.abs(Math.log(m / n));
}
export type VoiceExamples = Record<string, Int8Array[]>;
export function assessSpeech(
  sample: Int8Array,
  target: string,
  examples: VoiceExamples,
) {
  if (!sample.length || !examples[target]?.length) return false;
  const score = Math.min(
    ...examples[target].map((ref) => speechDistance(sample, ref)),
  );
  if (!Number.isFinite(score) || score > 0.275) return false;
  for (const [key, refs] of Object.entries(examples)) {
    if (key === target) continue;
    if (refs.some((ref) => speechDistance(sample, ref) < score + 0.025))
      return false;
  }
  return true;
}

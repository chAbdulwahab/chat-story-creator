export type DecodedAudio = { duration: number; peaks: number[] };

export async function extractPeaks(file: File, buckets = 1400): Promise<DecodedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  const AC: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  const channel = buffer.getChannelData(0);
  const size = Math.floor(channel.length / buckets) || 1;
  const peaks: number[] = [];
  let max = 0.0001;
  for (let i = 0; i < buckets; i++) {
    let peak = 0;
    const start = i * size;
    for (let j = 0; j < size; j += 4) {
      const v = Math.abs(channel[start + j] ?? 0);
      if (v > peak) peak = v;
    }
    if (peak > max) max = peak;
    peaks.push(peak);
  }
  await ctx.close();
  return { duration: buffer.duration, peaks: peaks.map((p) => p / max) };
}

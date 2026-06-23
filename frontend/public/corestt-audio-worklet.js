class CoreSttAudioWorklet extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const requestedChunkFrames = options.processorOptions?.chunkFrames;
    this.chunkFrames = Number.isFinite(requestedChunkFrames) && requestedChunkFrames > 0
      ? Math.floor(requestedChunkFrames)
      : Math.max(1, Math.round(sampleRate * 0.04));
    this.buffer = new Float32Array(this.chunkFrames);
    this.offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0] || input[0].length === 0) return true;

    const frameCount = input[0].length;
    const channelCount = input.length;

    for (let frame = 0; frame < frameCount; frame += 1) {
      let sample = 0;
      for (let channel = 0; channel < channelCount; channel += 1) {
        sample += input[channel][frame] ?? 0;
      }
      this.buffer[this.offset] = sample / channelCount;
      this.offset += 1;

      if (this.offset === this.chunkFrames) {
        this.port.postMessage({ type: "samples", samples: this.buffer }, [this.buffer.buffer]);
        this.buffer = new Float32Array(this.chunkFrames);
        this.offset = 0;
      }
    }

    return true;
  }
}

registerProcessor("corestt-audio-worklet", CoreSttAudioWorklet);

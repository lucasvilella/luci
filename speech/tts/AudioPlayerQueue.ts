/**
 * AudioPlayerQueue.ts
 *
 * Buffer & Player Queue supporting seamless audio playback and <50ms Barge-in Interruption.
 */

export class AudioPlayerQueue {
  private audioContext: AudioContext | null = null;
  private queue: ArrayBuffer[] = [];
  private isPlaying: boolean = false;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private onStateChange?: (speaking: boolean) => void;

  constructor(onStateChange?: (speaking: boolean) => void) {
    this.onStateChange = onStateChange;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Enqueues an audio buffer chunk for playback.
   */
  public enqueue(buffer: ArrayBuffer): void {
    this.queue.push(buffer);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Immediately stops speech, clears queue, and cancels audio playback (<50ms Barge-in).
   */
  public stopAndClear(): void {
    this.queue = [];
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {
        // Ignore if already stopped
      }
      this.currentSourceNode = null;
    }
    this.isPlaying = false;
    if (this.onStateChange) this.onStateChange(false);
    console.log('[AudioPlayerQueue] 🛑 Speech interrupted & buffer cleared (Barge-in).');
  }

  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
      return;
    }

    this.isPlaying = true;
    if (this.onStateChange) this.onStateChange(true);

    const arrayBuffer = this.queue.shift()!;
    const ctx = this.initAudioContext();

    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      this.currentSourceNode = source;

      source.onended = () => {
        this.currentSourceNode = null;
        this.playNext();
      };

      source.start(0);
    } catch (err) {
      console.warn('[AudioPlayerQueue] Decode error, skipping chunk:', err);
      this.playNext();
    }
  }
}

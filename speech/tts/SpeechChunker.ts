/**
 * SpeechChunker.ts
 *
 * Segments incoming streaming LLM response tokens into natural, semantically
 * complete sentences before sending them to the TTS engine.
 */

export class SpeechChunker {
  private buffer: string = '';
  private spokenSet: Set<string> = new Set();

  /**
   * Pushes new LLM text tokens into the buffer.
   * Returns complete semantic sentences ready for TTS synthesis.
   */
  public push(token: string): string[] {
    this.buffer += token;

    const chunks: string[] = [];
    
    // Natural sentence boundary regex (end of sentence punctuation followed by space or end)
    const sentenceRegex = /([^.!?\n]+[.!?\n]+)/g;
    let match;
    let lastIndex = 0;

    while ((match = sentenceRegex.exec(this.buffer)) !== null) {
      const sentence = match[1].trim();
      if (this.isValidChunk(sentence)) {
        chunks.push(sentence);
        this.spokenSet.add(sentence.toLowerCase());
      }
      lastIndex = sentenceRegex.lastIndex;
    }

    if (lastIndex > 0) {
      this.buffer = this.buffer.substring(lastIndex);
    }

    return chunks;
  }

  /**
   * Flushes any remaining text left in the buffer at the end of the LLM stream.
   */
  public flush(): string[] {
    const remaining = this.buffer.trim();
    this.buffer = '';

    if (this.isValidChunk(remaining)) {
      this.spokenSet.add(remaining.toLowerCase());
      return [remaining];
    }

    return [];
  }

  /**
   * Resets internal buffer and spoken sentence history.
   */
  public reset(): void {
    this.buffer = '';
    this.spokenSet.clear();
  }

  private isValidChunk(chunk: string): boolean {
    if (!chunk || chunk.length < 2) return false;
    // Don't repeat identical sentences already spoken in the current turn
    if (this.spokenSet.has(chunk.toLowerCase())) return false;
    return true;
  }
}

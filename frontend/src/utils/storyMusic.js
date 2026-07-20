const NOTE_FREQUENCIES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
};

const MOOD_PATTERNS = {
  upbeat: {
    waveform: 'triangle',
    noteDuration: 0.22,
    gap: 0.03,
    volume: 0.05,
    notes: ['C4', 'E4', 'G4', 'C5', 'G4', 'E4'],
  },
  calm: {
    waveform: 'sine',
    noteDuration: 0.9,
    gap: 0.1,
    volume: 0.04,
    notes: ['C4', 'G4', 'E4', 'A4'],
  },
  nostalgic: {
    waveform: 'sine',
    noteDuration: 0.55,
    gap: 0.08,
    volume: 0.045,
    notes: ['A4', 'C5', 'B4', 'G4', 'E4', 'F4'],
  },
  energetic: {
    waveform: 'square',
    noteDuration: 0.14,
    gap: 0.02,
    volume: 0.035,
    notes: ['E4', 'G4', 'B4', 'C5', 'B4', 'G4', 'E4', 'D4'],
  },
};

/**
 * Starts a small self-contained, synthesized background loop for the given
 * mood (no external audio files — everything is generated with the Web
 * Audio API). Returns { stop() } to fade out and tear down the audio graph.
 */
export function createMoodPlayer(moodId) {
  const pattern = MOOD_PATTERNS[moodId];
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!pattern || !AudioContextClass) return null;

  const ctx = new AudioContextClass();
  const masterGain = ctx.createGain();
  masterGain.gain.value = pattern.volume;
  masterGain.connect(ctx.destination);

  let stopped = false;
  let timeoutId = null;

  const playNoteAt = (freq, startTime, duration) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = pattern.waveform;
    osc.frequency.value = freq;
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(1, startTime + 0.02);
    noteGain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  };

  const scheduleLoop = () => {
    if (stopped) return;
    const startTime = ctx.currentTime + 0.05;
    let t = startTime;
    pattern.notes.forEach((noteName) => {
      playNoteAt(NOTE_FREQUENCIES[noteName], t, pattern.noteDuration);
      t += pattern.noteDuration + pattern.gap;
    });
    const loopDurationMs = (t - startTime) * 1000;
    timeoutId = setTimeout(scheduleLoop, loopDurationMs);
  };

  scheduleLoop();

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      if (timeoutId) clearTimeout(timeoutId);
      masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      setTimeout(() => ctx.close().catch(() => {}), 300);
    },
  };
}

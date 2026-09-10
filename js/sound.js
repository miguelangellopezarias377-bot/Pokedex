/**
 * sound.js - Gestor de Sonidos de la Pokédex
 * Maneja los rugidos (cries) oficiales de los Pokémon y sintetiza
 * efectos de sonido retro (8-bit / SFX) para la interfaz física.
 */

class PokedexAudio {
  constructor() {
    this.audioContext = null;
    this.cryAudio = new Audio();
    this.isMuted = false;
    this.isPlayingCry = false;
    this.volume = 0.85;
    this.cryAudio.volume = this.volume;

    // Callbacks para animaciones en pantalla
    this.onCryStart = null;
    this.onCryEnd = null;

    this.cryAudio.addEventListener('ended', () => {
      this.isPlayingCry = false;
      if (typeof this.onCryEnd === 'function') this.onCryEnd();
    });

    this.cryAudio.addEventListener('error', () => {
      this.isPlayingCry = false;
      if (typeof this.onCryEnd === 'function') this.onCryEnd();
    });
  }

  /**
   * Inicializa el AudioContext en la primera interacción
   */
  initContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Reproduce el rugido (cry) oficial de un Pokémon
   * @param {number|string} id - Número de la Pokédex
   * @param {string} [customUrl] - URL directa de audio si está disponible
   */
  async playCry(id, customUrl = null) {
    if (this.isMuted) return;
    this.initContext();

    const numericId = parseInt(id, 10);
    const audioUrl = customUrl || `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${numericId}.ogg`;

    try {
      this.cryAudio.pause();
      this.cryAudio.currentTime = 0;
      this.cryAudio.src = audioUrl;
      this.isPlayingCry = true;

      if (typeof this.onCryStart === 'function') {
        this.onCryStart();
      }

      await this.cryAudio.play();
    } catch (err) {
      console.warn('Fallo al reproducir archivo oficial de sonido, usando sintetizador:', err);
      this.playSyntheticCry(numericId);
      if (typeof this.onCryEnd === 'function') {
        setTimeout(() => this.onCryEnd(), 500);
      }
    }
  }

  /**
   * Sintetizador retro estilo Game Boy por si falla la conexión
   */
  playSyntheticCry(id) {
    if (this.isMuted || !this.audioContext) return;
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 220 + ((id * 41) % 650);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, ctx.currentTime + 0.12);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, ctx.currentTime + 0.38);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  }

  /**
   * Efectos de sonido de la interfaz de la Pokédex (botones, bips, luces)
   */
  playSfx(type) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'select': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1400, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'beep': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(980, now);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'shiny': {
        const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.06);

          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.22);
        });
        break;
      }

      case 'error': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(100, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case 'startup': {
        const freqs = [440, 554.37, 659.25, 880];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.07);

          gain.gain.setValueAtTime(0.14, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.16);
        });
        break;
      }

      case 'hit': {
        // Impacto de ataque
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'superEffective': {
        // Golpe súper eficaz con brillo agudo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.22);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'faint': {
        // Sonido de Pokémon debilitado (caída de tono)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.6);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case 'victory': {
        // Fanfarria de victoria retro de 8-bits
        const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
        const times = [0, 0.12, 0.24, 0.36, 0.55, 0.7];
        const durations = [0.1, 0.1, 0.1, 0.16, 0.12, 0.45];

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + times[idx]);

          gain.gain.setValueAtTime(0.2, now + times[idx]);
          gain.gain.exponentialRampToValueAtTime(0.001, now + times[idx] + durations[idx]);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + times[idx]);
          osc.stop(now + times[idx] + durations[idx]);
        });
        break;
      }

      case 'switch': {
        // Lanzamiento / relevo de Pokéball
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.cryAudio.muted = this.isMuted;
    return this.isMuted;
  }
}

window.pokedexAudio = new PokedexAudio();

// 6. Audio Synthesizer (Binaural, Rain, Brown Noise via Web Audio)
// ==========================================================================
let audioCtx = null;
let activeSoundNodes = {};
let masterGain = null;

function initAudio() {
  if (audioCtx) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  
  // Connect master volume to destination
  const slider = document.getElementById("ambient-volume");
  masterGain.gain.setValueAtTime(slider.value, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);
}

function startRainNode() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  
  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  
  // Rain filter
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(750, audioCtx.currentTime);
  
  // Rain amplitude envelope modulation
  const modGain = audioCtx.createGain();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  
  lfo.frequency.setValueAtTime(0.15, audioCtx.currentTime); // slow wave gust
  lfoGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  
  lfo.connect(lfoGain);
  lfoGain.connect(modGain.gain);
  
  whiteNoise.connect(filter);
  filter.connect(modGain);
  modGain.connect(masterGain);
  
  whiteNoise.start();
  lfo.start();
  
  activeSoundNodes.rain = {
    source: whiteNoise,
    lfo: lfo,
    gainNode: modGain
  };
}

function stopRainNode() {
  if (activeSoundNodes.rain) {
    try {
      activeSoundNodes.rain.source.stop();
      activeSoundNodes.rain.lfo.stop();
    } catch(e) {}
    delete activeSoundNodes.rain;
  }
}

function startBinauralNode() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const oscL = audioCtx.createOscillator();
  const oscR = audioCtx.createOscillator();
  const merger = audioCtx.createChannelMerger(2);
  const toneGain = audioCtx.createGain();
  
  // 140Hz Carrier (left) vs 150Hz Carrier (right) -> 10Hz Alpha differential
  oscL.type = 'sine';
  oscR.type = 'sine';
  oscL.frequency.setValueAtTime(140, audioCtx.currentTime);
  oscR.frequency.setValueAtTime(150, audioCtx.currentTime);
  
  toneGain.gain.setValueAtTime(0.12, audioCtx.currentTime); // Soft background wave
  
  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(toneGain);
  toneGain.connect(masterGain);
  
  oscL.start();
  oscR.start();
  
  activeSoundNodes.binaural = {
    oscL: oscL,
    oscR: oscR,
    gainNode: toneGain
  };
}

function stopBinauralNode() {
  if (activeSoundNodes.binaural) {
    try {
      activeSoundNodes.binaural.oscL.stop();
      activeSoundNodes.binaural.oscR.stop();
    } catch(e) {}
    delete activeSoundNodes.binaural;
  }
}

function startBrownNode() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Brownian integration formula
    output[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // Gain compensation
  }
  
  const brownNoise = audioCtx.createBufferSource();
  brownNoise.buffer = noiseBuffer;
  brownNoise.loop = true;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, audioCtx.currentTime); // smooth out high end
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
  
  brownNoise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  
  brownNoise.start();
  
  activeSoundNodes.brown = {
    source: brownNoise,
    gainNode: gain
  };
}

function stopBrownNode() {
  if (activeSoundNodes.brown) {
    try {
      activeSoundNodes.brown.source.stop();
    } catch(e) {}
    delete activeSoundNodes.brown;
  }
}

function startMelodyNode() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  
  // Ambient deep twilight chord (tuned close to root and slightly detuned fifth)
  osc1.type = 'sawtooth';
  osc2.type = 'triangle';
  osc1.frequency.setValueAtTime(65.41, audioCtx.currentTime); // C2
  osc2.frequency.setValueAtTime(98.3, audioCtx.currentTime);  // G2 slightly detuned
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, audioCtx.currentTime); // filter out buzzing high end, leaving a warm rumble
  
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  
  osc1.start();
  osc2.start();
  
  activeSoundNodes.melody = {
    osc1: osc1,
    osc2: osc2,
    gainNode: gain
  };
}

function stopMelodyNode() {
  if (activeSoundNodes.melody) {
    try {
      activeSoundNodes.melody.osc1.stop();
      activeSoundNodes.melody.osc2.stop();
    } catch(e) {}
    delete activeSoundNodes.melody;
  }
}

// Volume controller
function updateVolume(val) {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(val, audioCtx.currentTime);
  }
}

// Play a single calming bell note when logging/clearing steps
function playCalmBell() {
  try {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // slight upward slide
    osc.frequency.exponentialRampToValueAtTime(523.25, audioCtx.currentTime + 0.5); // slide to C5
    
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2); // decay
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1.3);
  } catch(e) {}
}

// ==========================================================================
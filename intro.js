const canvas = document.getElementById("introCanvas");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playButton");
const recordButton = document.getElementById("recordButton");

const W = canvas.width;
const H = canvas.height;
const DURATION = 7;
const LOGO = "PIXEL PARADOXX";
const TAGLINE = "ENTER THE PARADOX";
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOutCubic = (x) => (clamp(x) < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

let startTime = performance.now();
let audioContext;
let masterGain;
let recording = false;
let mediaRecorder;
let recordedChunks = [];
let animationFrameId;

const stars = Array.from({ length: 240 }, () => ({
  x: rand(-W, W * 2),
  y: rand(-H, H * 1.3),
  z: rand(0.18, 1),
  size: rand(1, 5),
  hue: Math.random() > 0.55 ? 314 : 270,
}));

const sparks = Array.from({ length: 120 }, () => ({
  angle: rand(0, Math.PI * 2),
  speed: rand(260, 960),
  life: rand(0.35, 1.3),
  start: rand(1.1, 5.9),
  length: rand(28, 110),
}));

const blocks = Array.from({ length: 380 }, () => ({
  x: rand(-760, 760),
  y: rand(-210, 210),
  z: rand(0.2, 2.3),
  size: rand(7, 22),
  delay: rand(0, 0.55),
  spin: rand(-1.6, 1.6),
}));

function reset() {
  startTime = performance.now();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(draw);
}

async function setupAudio(extraDestination) {
  if (audioContext) await audioContext.close();
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.72;
  masterGain.connect(audioContext.destination);
  if (extraDestination) masterGain.connect(extraDestination);

  noiseBurst(0.05, 0.55, 1200, 0.05);
  riser(0.4, 4.8);
  impact(2.05, 75, 0.48);
  glitchTicks(0.8, 2.7, 18);
  impact(4.65, 52, 0.38);
  glitchTicks(4.1, 5.1, 12);
  impact(5.85, 42, 0.7);
  synthChord(5.85, 1.25);
}

function noiseBurst(offset, duration, filterFreq, volume) {
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(audioContext.currentTime + offset);
}

function impact(offset, freq, volume) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, audioContext.currentTime + offset);
  osc.frequency.exponentialRampToValueAtTime(25, audioContext.currentTime + offset + 0.6);
  gain.gain.setValueAtTime(volume, audioContext.currentTime + offset);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + offset + 0.82);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(audioContext.currentTime + offset);
  osc.stop(audioContext.currentTime + offset + 0.9);
  noiseBurst(offset, 0.22, 260, volume * 0.22);
}

function riser(offset, duration) {
  const osc = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(95, audioContext.currentTime + offset);
  osc.frequency.exponentialRampToValueAtTime(1240, audioContext.currentTime + offset + duration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(180, audioContext.currentTime + offset);
  filter.frequency.exponentialRampToValueAtTime(5200, audioContext.currentTime + offset + duration);
  gain.gain.setValueAtTime(0.001, audioContext.currentTime + offset);
  gain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + offset + duration);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + offset + duration + 0.25);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start(audioContext.currentTime + offset);
  osc.stop(audioContext.currentTime + offset + duration + 0.3);
}

function glitchTicks(from, to, count) {
  for (let i = 0; i < count; i++) {
    noiseBurst(rand(from, to), rand(0.025, 0.08), rand(1600, 7400), rand(0.035, 0.12));
  }
}

function synthChord(offset, duration) {
  [146.83, 220, 293.66, 440].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = i % 2 ? "triangle" : "sawtooth";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime + offset);
    gain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + offset + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + offset + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(audioContext.currentTime + offset);
    osc.stop(audioContext.currentTime + offset + duration + 0.1);
  });
}

function background(t) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.48, 40, W * 0.5, H * 0.52, W * 0.8);
  g.addColorStop(0, "#23002f");
  g.addColorStop(0.42, "#08000e");
  g.addColorStop(1, "#020004");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const arena = smooth(3.0, 5.15, t);
  ctx.save();
  ctx.globalAlpha = arena * 0.78;
  for (let i = 0; i < 15; i++) {
    const x = W * 0.5 + (i - 7) * 108 * (1 + arena * 0.3);
    ctx.strokeStyle = i % 2 ? "rgba(255,43,214,.38)" : "rgba(141,45,255,.34)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, H * 0.22);
    ctx.lineTo(W * 0.5 + (x - W * 0.5) * 2.3, H * 0.76);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(255,43,214,${0.12 + i * 0.04})`;
    ctx.lineWidth = 10 - i;
    ctx.strokeRect(230 + i * 84, 190 + i * 36, 1460 - i * 168, 610 - i * 52);
  }
  ctx.restore();
}

function particles(t) {
  const speed = 180 + smooth(0.4, 2.1, t) * 720 + smooth(3.3, 4.7, t) * 1180;
  ctx.save();
  stars.forEach((p) => {
    const z = p.z + ((t * speed * 0.00045) % 1.8);
    const scale = 1 / (z % 1.8 + 0.16);
    const x = W * 0.5 + (p.x - W * 0.5) * scale;
    const y = H * 0.52 + (p.y - H * 0.5) * scale;
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
    ctx.globalAlpha = clamp(scale * 0.36);
    ctx.fillStyle = `hsl(${p.hue}, 100%, ${62 + scale * 14}%)`;
    ctx.fillRect(x, y, p.size * scale, p.size * scale);
  });
  ctx.restore();
}

function grid(t) {
  const appear = smooth(0.45, 1.15, t);
  const rush = smooth(3.15, 4.4, t);
  const horizon = H * (0.58 - rush * 0.08);
  ctx.save();
  ctx.globalAlpha = appear * (1 - smooth(5.55, 6.8, t) * 0.22);
  ctx.lineWidth = 3;
  for (let i = 0; i < 28; i++) {
    const y = horizon + Math.pow(i / 27, 2.05) * H * 0.55;
    ctx.strokeStyle = i % 2 ? "rgba(255,43,214,.44)" : "rgba(141,45,255,.5)";
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(t * 10 + i) * 3);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let i = -18; i <= 18; i++) {
    const x = W * 0.5 + i * 78 * (1 + rush * 1.1);
    ctx.strokeStyle = Math.abs(i) % 2 ? "rgba(255,43,214,.5)" : "rgba(198,108,255,.48)";
    ctx.beginPath();
    ctx.moveTo(W * 0.5 + i * 8, horizon);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.restore();
}

function energy(t) {
  ctx.save();
  sparks.forEach((s) => {
    const age = t - s.start;
    if (age < 0 || age > s.life) return;
    const life = 1 - age / s.life;
    const dist = age * s.speed;
    const cx = W * 0.5;
    const cy = H * (0.5 + smooth(3.4, 4.7, t) * 0.04);
    const x = cx + Math.cos(s.angle) * dist;
    const y = cy + Math.sin(s.angle) * dist * 0.44;
    ctx.globalAlpha = life * 0.82;
    ctx.strokeStyle = Math.random() > 0.5 ? "#ff2bd6" : "#c66cff";
    ctx.lineWidth = rand(1, 4);
    ctx.shadowBlur = 22;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(s.angle) * s.length * life, y - Math.sin(s.angle) * s.length * life * 0.44);
    ctx.stroke();
  });
  ctx.restore();
}

function pixelBlocks(t) {
  const form = easeOutCubic(smooth(0.95, 2.1, t));
  const burst = smooth(2.85, 3.55, t) - smooth(4.35, 4.95, t);
  const reform = smooth(4.25, 5.45, t);
  ctx.save();
  ctx.translate(W / 2, H / 2 - 35);
  blocks.forEach((b, i) => {
    const targetX = b.x * 0.68;
    const targetY = b.y * 0.42;
    const sourceX = b.x * (2.2 + b.z * 1.3);
    const sourceY = b.y * (1.5 + b.z * 1.2) - 480 * b.z;
    const assemble = easeOutCubic(clamp((form - b.delay * 0.55) / 0.75));
    const breakOut = Math.sin((i * 19.7) % 6.28);
    let x = sourceX + (targetX - sourceX) * assemble;
    let y = sourceY + (targetY - sourceY) * assemble;
    x += Math.cos(b.spin + i) * burst * 720 * (0.35 + b.z);
    y += Math.sin(b.spin - i) * burst * 300 * (0.3 + b.z);
    x += (targetX - x) * reform * 0.64;
    y += (targetY - y) * reform * 0.64;
    ctx.globalAlpha = clamp(assemble + reform) * (1 - smooth(5.3, 5.85, t));
    ctx.fillStyle = breakOut > 0 ? "#ff2bd6" : "#8d2dff";
    ctx.shadowBlur = 18;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(x, y, b.size, b.size);
  });
  ctx.restore();
}

function logoText(t) {
  const assemble = smooth(1.6, 2.5, t);
  const passThrough = smooth(3.15, 3.9, t) - smooth(4.08, 4.65, t);
  const finalReveal = smooth(5.05, 6.05, t);
  const opacity = clamp(assemble - smooth(3.0, 3.45, t) + smooth(4.55, 5.55, t));
  const scale = 0.74 + assemble * 0.24 + passThrough * 1.45 - finalReveal * 0.08;
  const shake = (smooth(1.2, 2.55, t) - smooth(5.6, 6.25, t)) * 11;
  const glitch = glitchAmount(t);
  const x = W / 2 + rand(-shake, shake) * glitch;
  const y = H / 2 - 12 + rand(-shake, shake) * glitch;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 132px 'Courier New', Consolas, monospace";
  ctx.lineWidth = 8;
  ctx.globalAlpha = opacity;

  const layers = [
    ["#ff2bd6", -10 - glitch * 18, 0, 0.52],
    ["#8d2dff", 10 + glitch * 14, 0, 0.52],
    ["#ffffff", 0, 0, 0.98],
  ];

  layers.forEach(([color, ox, oy, alpha]) => {
    ctx.globalAlpha = opacity * alpha;
    ctx.shadowBlur = 40 + finalReveal * 28;
    ctx.shadowColor = color;
    ctx.strokeStyle = "rgba(255,43,214,.72)";
    ctx.fillStyle = color;
    ctx.strokeText(LOGO, ox, oy);
    ctx.fillText(LOGO, ox, oy);
  });

  ctx.globalAlpha = opacity * (0.62 + finalReveal * 0.3);
  ctx.fillStyle = "#050008";
  ctx.font = "900 132px 'Courier New', Consolas, monospace";
  for (let i = 0; i < LOGO.length; i += 2) {
    const sx = -552 + i * 86;
    ctx.fillRect(sx, -78, 22, 16);
    ctx.fillRect(sx + 40, 66, 34, 13);
  }

  ctx.restore();

  const tag = smooth(5.8, 6.55, t);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 38px 'Segoe UI', Arial, sans-serif";
  ctx.globalAlpha = tag;
  ctx.shadowBlur = 28;
  ctx.shadowColor = "#ff2bd6";
  ctx.fillStyle = "#ffd7fb";
  ctx.fillText(TAGLINE, W / 2, H / 2 + 150);
  ctx.restore();
}

function glitchAmount(t) {
  const windows = [
    smooth(0.92, 1.06, t) - smooth(1.18, 1.32, t),
    smooth(1.85, 2.08, t) - smooth(2.25, 2.45, t),
    smooth(3.08, 3.25, t) - smooth(3.58, 3.8, t),
    smooth(4.3, 4.55, t) - smooth(4.82, 5.02, t),
  ];
  return clamp(windows.reduce((sum, value) => sum + value, 0));
}

function postEffects(t) {
  const g = glitchAmount(t);
  if (g > 0.02) {
    for (let i = 0; i < 18; i++) {
      const y = rand(0, H);
      const h = rand(4, 36) * g;
      const dx = rand(-80, 80) * g;
      ctx.globalAlpha = rand(0.08, 0.22) * g;
      ctx.drawImage(canvas, 0, y, W, h, dx, y + rand(-10, 10), W, h);
    }
  }

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#000";
  for (let y = 0; y < H; y += 5) ctx.fillRect(0, y, W, 2);
  ctx.restore();

  ctx.save();
  const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.74)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function lightRays(t) {
  const reveal = smooth(5.15, 6.2, t);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = reveal * 0.24;
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + Math.sin(t + i) * 0.08;
    const grad = ctx.createLinearGradient(W / 2, H / 2, W / 2 + Math.cos(angle) * 840, H / 2 + Math.sin(angle) * 520);
    grad.addColorStop(0, "rgba(255,43,214,.65)");
    grad.addColorStop(1, "rgba(141,45,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(W / 2, H / 2);
    ctx.lineTo(W / 2 + Math.cos(angle) * 920, H / 2 + Math.sin(angle) * 590);
    ctx.stroke();
  }
  ctx.restore();
}

function draw(now) {
  const t = ((now - startTime) / 1000) % DURATION;
  background(t);
  particles(t);
  grid(t);
  lightRays(t);
  pixelBlocks(t);
  energy(t);
  logoText(t);
  postEffects(t);
  requestAnimationFrame(draw);
}

playButton.addEventListener("click", async () => {
  await setupAudio();
  reset();
});

recordButton.addEventListener("click", async () => {
  if (recording) return;
  recordedChunks = [];
  const stream = canvas.captureStream(60);
  if (audioContext) await audioContext.close();
  const recordAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  const recordAudioDestination = recordAudioContext.createMediaStreamDestination();
  audioContext = recordAudioContext;
  masterGain = recordAudioContext.createGain();
  masterGain.gain.value = 0.72;
  masterGain.connect(recordAudioContext.destination);
  masterGain.connect(recordAudioDestination);
  recordAudioDestination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pixel-paradoxx-intro-1080p.webm";
    link.click();
    URL.revokeObjectURL(url);
    recording = false;
    recordButton.textContent = "Record WebM";
  };
  recording = true;
  recordButton.textContent = "Recording...";
  mediaRecorder.start();
  noiseBurst(0.05, 0.55, 1200, 0.05);
  riser(0.4, 4.8);
  impact(2.05, 75, 0.48);
  glitchTicks(0.8, 2.7, 18);
  impact(4.65, 52, 0.38);
  glitchTicks(4.1, 5.1, 12);
  impact(5.85, 42, 0.7);
  synthChord(5.85, 1.25);
  reset();
  setTimeout(() => mediaRecorder.stop(), DURATION * 1000);
});

reset();

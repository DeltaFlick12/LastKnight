<template>
  <div class="background-container">
    <!-- Névoa -->
    <div class="fog-layer"></div>

    <!-- Partículas -->
    <div class="particle" v-for="n in 10" :key="n" :style="randomParticleStyle()"></div>

    <!-- HUD -->
    <div class="hud">
      <div class="hud-box left">
        <div class="hud-label">Status</div>
        <p>❤️ Vida: <span>{{ health }}/100</span></p>
        <p>⚡ Stamina: <span>{{ stamina }}/100</span></p>
      </div>

      <div class="hud-box center">
        <div class="hud-label">Recursos</div>
        <p>🪙 Ouro: <span>{{ gold }}</span></p>
        <p>🧪 Poções: <span>{{ potions }}</span></p>
      </div>

      <div class="hud-box right">
        <div class="hud-label">Local</div>
        <p>📍 <span>{{ area }}</span></p>
      </div>

      <p class="fps">{{ fps }} FPS</p>
    </div>

    <!-- Conteúdo -->
    <div class="rio-content">
      <p>Você chega à margem do Rio das Almas Perdidas. As águas escuras parecem puxar sua energia vital.</p>
      <p class="placeholder">(Placeholder: Cenário do Rio das Almas Perdidas) ~~~~~~~ Rio ~~~~~~~</p>
      <button @click="atravessar">Tentar Atravessar</button>
      <button @click="voltar">Voltar para Floresta</button>
    </div>
  </div>
</template>

<script setup>
<<<<<<< Updated upstream
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameState, actions } from '@/store/gfame.js'; // Ajuste o caminho
import { playAudio } from '@/utils/audioManager.js';
=======
import { ref, onMounted } from 'vue'
>>>>>>> Stashed changes

defineProps({
  health: Number,
  stamina: Number,
  gold: Number,
  potions: Number,
  area: String,
})

const fps = ref(0)
let frameCount = 0
let lastTime = performance.now()

onMounted(() => {
  updateFPS()
  playAmbientSound()
})

// FPS Tracker
function updateFPS() {
  const now = performance.now()
  frameCount++
  if (now - lastTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastTime = now
  }
  requestAnimationFrame(updateFPS)
}

// Áudio ambiente com fade-in
function playAmbientSound() {
  const audio = new Audio('/assets/audio/rio-ambiente.mp3')
  audio.volume = 0
  audio.loop = true
  audio.play()

  let vol = 0
  const fadeIn = setInterval(() => {
    if (vol < 1) {
      vol += 0.02
      audio.volume = Math.min(vol, 1)
    } else {
      clearInterval(fadeIn)
    }
  }, 200)
}

// Estilo de partículas
function randomParticleStyle() {
  const top = Math.random() * 100
  const left = Math.random() * 100
  const duration = 8 + Math.random() * 4
  const delay = Math.random() * 5
  const size = 12 + Math.random() * 12

  return {
    top: `${top}%`,
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }
}

function atravessar() {
  console.log("Tentando atravessar o rio...")
}

function voltar() {
  console.log("Voltando para a floresta...")
}
</script>

<style scoped>
.background-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: url('@/assets/backviews/rio-bg.gif') no-repeat center center;
  background-size: cover;
  overflow: hidden;
}

/* Névoa */
.fog-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(200,200,200,0.15), rgba(0,0,0,0.1));
  pointer-events: none;
  z-index: 2;
}

/* Partículas */
.particle {
  position: absolute;
  background-image: url('@/assets/particles/particle.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.4;
  z-index: 3;
  animation: floatUp linear infinite;
}

@keyframes floatUp {
  from {
    transform: translateY(0px) scale(1);
    opacity: 0.4;
  }
  to {
    transform: translateY(-120px) scale(1.1);
    opacity: 0;
  }
}

/* HUD */
.hud {
  position: absolute;
  top: 0;
  width: 100%;
  padding: 10px 30px;
  display: flex;
  justify-content: space-between;
  z-index: 4;
  font-family: 'Press Start 2P', cursive;
  image-rendering: pixelated;
}

.hud-box {
  background: url('/img/ui/pergaminho.png') repeat;
  border: 3px solid #af8a58;
  padding: 14px 20px;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0,0,0,0.6);
  min-width: 180px;
  color: #f8e3b7;
  text-shadow: 1px 1px 1px #000;
}

.hud-box.left { border-left: 6px solid #b53a3a; }
.hud-box.center { text-align: center; border-left: 6px solid #d4a127; }
.hud-box.right { text-align: right; border-left: 6px solid #3e9356; }

.hud-label {
  font-size: 13px;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #ffe9b5;
  border-bottom: 1px solid #e0c48f;
  padding-bottom: 4px;
}

.hud p {
  margin: 4px 0;
  font-size: 12px;
}

.hud p span {
  font-weight: bold;
  color: #fffbe0;
}

.fps {
  position: absolute;
  bottom: 12px;
  left: 12px;
  font-size: 12px;
  color: #b6ffba;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #76c976;
  z-index: 5;
}

/* Conteúdo */
.rio-content {
  position: absolute;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
  z-index: 4;
}

.placeholder {
  font-style: italic;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

button {
  margin: 5px;
  background-color: #234e7d;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}
</style>

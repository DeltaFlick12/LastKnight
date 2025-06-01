<template>
  <div class="background-container" :style="{ backgroundImage: `url(${bgImage})` }">
    <!-- Névoa -->
    <div class="fog-layer"></div>

    <!-- Partículas -->
    <div class="particle" v-for="n in 10" :key="n" :style="randomParticleStyle()"></div>

    <!-- HUD -->
    <Hud
      :health="health"
      :stamina="stamina"
      :gold="gold"
      :potions="potions"
      :area="area"
      :fps="fps"
    />

    <!-- Caixa de diálogo -->
    <div class="dialog-box" v-if="showDialog">
      <p>{{ displayedText }}</p>
      <div class="dialog-actions" v-if="!typing">
        <button @click="atravessar">Tentar Atravessar</button>
        <button @click="voltar">Voltar para o mapa</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import bgImage from '@/assets/backviews/rio-bg.gif'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Hud from '@/components/Hud.vue'

defineProps({
  health: Number,
  stamina: Number,
  gold: Number,
  potions: Number,
  area: String,
})

const router = useRouter()
const fps = ref(0)
let frameCount = 0
let lastTime = performance.now()

const showDialog = ref(true)
const displayedText = ref('')
const typing = ref(false)

const line =
  'Ao chegar à margem do Rio das Almas Perdidas, uma névoa gélida envolve teus pés. As águas negras, imóveis, parecem observar-te... famintas.'

// Variável para controlar se tem benção (pode ser um prop ou estado externo)
const hasBlessing = ref(false)

// Suponha que saúde inicial venha via prop
const health = ref(100)

function typeText() {
  typing.value = true
  displayedText.value = ''
  let i = 0
  const interval = setInterval(() => {
    if (i < line.length) {
      displayedText.value += line[i]
      i++
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 35)
}

function atravessar() {
  if (!hasBlessing.value) {
    // Tomar dano se não tiver benção
    health.value -= 30
    if (health.value < 0) health.value = 0
    alert('Você tentou atravessar sem a bênção e tomou dano! Saúde atual: ' + health.value)
  } else {
    alert('Você atravessou o rio com a bênção! Sem danos.')
  }
}

function voltar() {
  router.push('/map')
}

onMounted(() => {
  updateFPS()
  typeText()
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
    animationDelay: `${delay}s`,
  }
}
</script>

<style scoped>
.background-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  /* fallback para caso o import falhe */
  background-image: url('/assets/backviews/rio-bg.gif');
  overflow: hidden;
}

/* Névoa */
.fog-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(200, 200, 200, 0.15), rgba(0, 0, 0, 0.1));
  pointer-events: none;
  z-index: 2;
}

/* Partículas */
.particle {
  position: absolute;
  background-image: url('/assets/particles/particle.png');
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

.dialog-box {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #d69c2f;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  position: absolute;
  top: 58%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  font-size: 26px;
  color: #fffde0;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.6);
}

.dialog-actions button {
  margin: 0 10px;
  padding: 10px 20px;
  background: linear-gradient(to bottom, #7b4a27, #3b1e0c);
  color: #f5e1a4;
  font-family: 'Uncial Antiqua', serif;
  font-size: 16px;
  border: 2px solid #caa65b;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dialog-actions button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 12px #d4af37;
}
</style>

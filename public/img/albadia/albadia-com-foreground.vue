
<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>
    <HUD />
    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> para entrar em {{ structureName }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameState } from '@/stores/gameState'
import HUD from '@/components/HUD.vue'

const router = useRouter()
const gameState = useGameState()

const maxStamina = gameState.player.maxStamina
const staminaRecoveryRate = 10
const staminaConsumptionRate = 25
const staminaRounded = computed(() => Math.floor(gameState.player.stamina))

const potions = ref(3)
const currentArea = ref('Reino de Albadia')
const showEnterPrompt = ref(false)
const structureName = ref('')
const bagOpen = ref(false)
const toggleBag = () => (bagOpen.value = !bagOpen.value)
const equippedWeapon = ref('Espada de Treinamento')
const equipWeapon = (name) => (equippedWeapon.value = name)

const obstacles = [
  { x: 910, y: 790, width: 580, height: 270, name: 'Ferreiro', route: '/interior/ferreiro' },
  { x: 2645, y: 990, width: 390, height: 250, name: 'Loja de Poções', route: '/interior/bruxa' },
  { x: 1720, y: 660, width: 660, height: 240, name: 'Igreja', route: '/interior/igreja' },
  { x: 1800, y: 1350, width: 500, height: 280 },
  { x: 980, y: 1900, width: 495, height: 300 },
  { x: 2550, y: 1950, width: 550, height: 250 }
]

const lightSources = [
  { x: 2560, y: 1085, radius: 200, intensity: 0.2, color: 'rgba(0, 255, 0, 0.4)' },
  { x: 3090, y: 1200, radius: 200, intensity: 0.1, color: 'rgba(0, 255, 0, 0.4)' },
  { x: 1190, y: 990, radius: 700, intensity: 1.8, color: 'rgba(255, 100, 0, 0.6)' },
  { x: 2433, y: 2000, radius: 850, intensity: 0, color: 'rgba(255, 255, 255, 0.3)' }
]

function drawLights(ctx, cam) {
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  for (const light of lightSources) {
    const screenX = light.x - cam.x
    const screenY = light.y - cam.y
    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, light.radius)
    gradient.addColorStop(0, light.color)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, light.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  ctx.globalCompositeOperation = 'source-over'
}

const usePotion = () => {
  if (potions.value > 0) {
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30)
    potions.value--
  }
}

const canvas = ref(null)
let ctx
const player = {
  x: 2050,
  y: 2000,
  size: 300,
  speed: 6,
  runSpeed: 9,
  direction: 'idle'
}
const keys = { w: false, a: false, s: false, d: false, shift: false }
const world = { width: 4096, height: 2732 }

const backgrounds = [new Image(), new Image(), new Image(), new Image()]
backgrounds[0].src = '/img/albadia/albadia-bg-manha.png'
backgrounds[1].src = '/img/albadia/albadia-bg.png'
backgrounds[2].src = '/img/albadia/albadia-bg-tarde.png'
backgrounds[3].src = '/img/albadia/albadia-bg-noite.png'
for (const bg of backgrounds) {
  bg.onload = imageLoadedCallback
  bg.onerror = () => console.error('Erro ao carregar uma imagem de background')
}

const foregrounds = [new Image(), new Image(), new Image(), new Image()]
foregrounds[0].src = '/img/albadia/albadiaDetalhes-manha.png'
foregrounds[1].src = '/img/albadia/albadiaDetalhes.png'
foregrounds[2].src = '/img/albadia/albadiaDetalhes-tarde.png'
foregrounds[3].src = '/img/albadia/albadiaDetalhes-noite.png'
for (const fg of foregrounds) {
  fg.onload = imageLoadedCallback
  fg.onerror = () => console.error('Erro ao carregar uma imagem de foreground')
}

const playerSpriteSheet = new Image()
const frameWidth = 96
const frameHeight = 96

const animations = {
  idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_down: { row: 6, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_up: { row: 4, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_left: { row: 20.1, frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], frameInterval: 70 },
  walk_right: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 }
}

let currentFrameIndex = 0
let frameTimer = 0
let allImagesLoaded = false
let imagesLoadedCount = 0
const totalImagesToLoad = 10

function imageLoadedCallback() {
  imagesLoadedCount++
  if (imagesLoadedCount >= totalImagesToLoad) {
    allImagesLoaded = true
    requestAnimationFrame(gameLoop)
  }
}

function loadImage(img, src) {
  img.onload = imageLoadedCallback
  img.onerror = () => console.error(`Erro ao carregar imagem: ${src}`)
  img.src = src
}

let backgroundIndex = parseInt(localStorage.getItem('albadia_last_bg') || '0')
backgroundIndex = (backgroundIndex + 1) % backgrounds.length
localStorage.setItem('albadia_last_bg', backgroundIndex.toString())
let nextBackgroundIndex = (backgroundIndex + 1) % backgrounds.length
let transitionAlpha = 0
let transitionStartTime = 0

function startBackgroundTransition() {
  backgroundIndex = nextBackgroundIndex
  nextBackgroundIndex = (backgroundIndex + 1) % backgrounds.length
  transitionAlpha = 0
  transitionStartTime = performance.now()
  localStorage.setItem('albadia_last_bg', backgroundIndex.toString())
}

let lastBgSwitchTime = 0
onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
  loadImage(playerSpriteSheet, '/img/sprites/player/player_sprite.png')
  lastBgSwitchTime = performance.now()
})

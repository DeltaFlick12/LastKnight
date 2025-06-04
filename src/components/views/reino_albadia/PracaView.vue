<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <HUD />

    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> para entrar em {{ structureName }}
    </div>

    <button class="map-button" @click="handleMapClick">
      <img src="/icons/map-icon.png" alt="Mapa" class="button-icon" />
    </button>

    <button class="bag-button" @click="toggleBag">
      <img src="/icons/bag-icon.png" alt="Mochila" class="button-icon" />
    </button>

    <Inventory 
      v-if="bagOpen"
      :potions="potions"
      :equipped-weapon="equippedWeapon"
      @use-potion="usePotion"
      @equip-weapon="equipWeapon"
      @close="toggleBag"
    />

    <div class="gold-display">
      <img src="/icons/gold-icon.png" alt="Ouro" class="gold-icon" />
      <span>{{ gold }}</span>
    </div>

    <div class="stamina-bar">
      <span>Stamina: {{ staminaRounded }}</span>
      <progress max="100" :value="staminaRounded"></progress>
    </div>
  </div>
</template>

<script setup>
import { useGameState } from '@/stores/gameState'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Inventory from '@/components/Inventory.vue'
import HUD from '@/components/HUD.vue'

const gameState = useGameState()

const maxStamina = gameState.player.maxStamina
const staminaRecoveryRate = 10 // por segundo
const staminaConsumptionRate = 25 // por segundo

const staminaRounded = computed(() => Math.floor(gameState.player.stamina))

const gold = ref(150)
const potions = ref(3)
const currentArea = ref('Reino de Albadia')
const showEnterPrompt = ref(false)
const structureName = ref('')

const bagOpen = ref(false)
const toggleBag = () => (bagOpen.value = !bagOpen.value)

const equippedWeapon = ref('Espada de Treinamento')
const equipWeapon = (name) => (equippedWeapon.value = name)

const usePotion = () => {
  if (potions.value > 0) {
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30)
    potions.value--
  }
}

const handleMapClick = () => {
  const tutorialDone = localStorage.getItem('tutorialCompleted')
  if (!tutorialDone) {
    localStorage.setItem('tutorialCompleted', 'true')
    router.push('/tutorial')
  } else {
    router.push('/map')
  }
}

// Canvas + mapa
const canvas = ref(null)
let ctx
const player = {
  x: 830 + 128 / 2,
  y: 1600 + 128 / 2,
  size: 128,
  speed: 6,
  runSpeed: 12,
  direction: 'idle'
}
const keys = { w: false, a: false, s: false, d: false, shift: false }
const world = { width: 3000, height: 2000 }
const background = new Image()
const foreground = new Image()

const playerSprites = {
  idle: new Image(),
  walk_down: [new Image(), new Image()], // array com dois frames
  walk_up: new Image(),
  walk_left: new Image(),
  walk_right: new Image()
}
let allImagesLoaded = false
let imagesLoadedCount = 0
const totalImagesToLoad = 2 + Object.keys(playerSprites).length + 1 // contando os dois frames extra

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

const obstacles = [
  { x: 480, y: 380, width: 480, height: 180, name: 'Ferreiro', route: '/interior/ferreiro' },
  { x: 1310, y: 820, width: 350, height: 150, name: 'Loja de Poções', route: '/interior/bruxa' },
  { x: 2080, y: 590, width: 330, height: 140, name: 'Igreja', route: '/interior/igreja' },
  { x: 1165, y: 1300, width: 290, height: 20, name: 'Fonte' },
  { x: 1155, y: 1320, width: 315, height: 25 },
  { x: 1145, y: 1345, width: 335, height: 120 },
  { x: 1165, y: 1465, width: 290, height: 20 },
  { x: 400, y: 1545, width: 310, height: 20 },
  { x: 380, y: 1545, width: 20, height: 320 },
  { x: 400, y: 1810, width: 310, height: 55 },
]

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  loadImage(background, '/public/img/albadia/albadia-bg.png')
  loadImage(foreground, '/public/img/albadia/albadiaDetalhes.png')

  loadImage(playerSprites.idle, '/img/sprites/player/player_idle.png')
  loadImage(playerSprites.walk_down[0], '/img/sprites/player/player_walk_down.png')
  loadImage(playerSprites.walk_down[1], '/img/sprites/player/player_walk_down2.png')
  loadImage(playerSprites.walk_up, '/img/sprites/player/player_walk_up.png')
  loadImage(playerSprites.walk_left, '/img/sprites/player/player_walk_left.png')
  loadImage(playerSprites.walk_right, '/img/sprites/player/player_walk_right.png')
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

function resizeCanvas() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

function onKeyDown(e) {
  const k = e.key.toLowerCase()
  if (keys.hasOwnProperty(k)) keys[k] = true
  if (k === 'e') {
    const current = getPlayerNearbyStructure()
    if (current?.route) router.push(current.route)
  }
}

function onKeyUp(e) {
  const k = e.key.toLowerCase()
  if (keys.hasOwnProperty(k)) keys[k] = false
}

let animationFrameId = null
let lastUpdateTime = 0

// Variáveis de controle da animação walk_down
let walkDownFrameIndex = 0
let walkDownFrameTimer = 0
const walkDownFrameInterval = 300 // ms entre frames

function gameLoop(timestamp) {
  if (!allImagesLoaded) {
    animationFrameId = requestAnimationFrame(gameLoop)
    return
  }

  if (!lastUpdateTime) lastUpdateTime = timestamp

  const delta = timestamp - lastUpdateTime

  if (delta >= 15) { // 15 ms para ~30 FPS
    update(delta / 1000) // delta em segundos
    lastUpdateTime = timestamp
  }

  draw()
  animationFrameId = requestAnimationFrame(gameLoop)
}

function update(deltaSeconds) {
  const { w, a, s, d, shift } = keys
  let moved = false
  let dx = 0
  let dy = 0

  if (w) { dy -= 1; moved = true }
  if (s) { dy += 1; moved = true }
  if (a) { dx -= 1; moved = true }
  if (d) { dx += 1; moved = true }

  if (dx !== 0 && dy !== 0) {
    const invSqrt2 = 1 / Math.sqrt(2)
    dx *= invSqrt2
    dy *= invSqrt2
  }

  if (moved) {
    let speed = player.speed

    if (shift && gameState.player.stamina > 0) {
      speed = player.runSpeed

      // Gasta stamina proporcional ao tempo
      gameState.player.stamina -= staminaConsumptionRate * deltaSeconds
      if (gameState.player.stamina < 0) gameState.player.stamina = 0
    } else {
      // Recupera stamina se não estiver correndo
      gameState.player.stamina += staminaRecoveryRate * deltaSeconds
      if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
    }

    if (dy < 0) player.direction = 'walk_up'
    else if (dy > 0) player.direction = 'walk_down'
    else if (dx < 0) player.direction = 'walk_left'
    else if (dx > 0) player.direction = 'walk_right'

    move(dx * speed, dy * speed)
  } else {
    player.direction = 'idle'
    // Recupera stamina quando parado
    gameState.player.stamina += staminaRecoveryRate * deltaSeconds
    if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
  }

  // Atualiza a animação do walk_down
  if (player.direction === 'walk_down') {
    walkDownFrameTimer += deltaSeconds * 1000
    if (walkDownFrameTimer >= walkDownFrameInterval) {
      walkDownFrameTimer = 0
      walkDownFrameIndex = (walkDownFrameIndex + 1) % playerSprites.walk_down.length
    }
  } else {
    walkDownFrameIndex = 0
    walkDownFrameTimer = 0
  }

  const nearStructure = getPlayerNearbyStructure()
  showEnterPrompt.value = !!nearStructure?.route
  structureName.value = nearStructure?.name || ''
}

function move(dx, dy) {
  // colisão eixo X
  let nextX = player.x + dx
  let playerBoxX = {
    x: nextX - player.size / 2,
    y: player.y - player.size / 2,
    width: player.size,
    height: player.size
  }
  let collidedX = obstacles.some(block => (
    playerBoxX.x < block.x + block.width &&
    playerBoxX.x + playerBoxX.width > block.x &&
    playerBoxX.y < block.y + block.height &&
    playerBoxX.y + playerBoxX.height > block.y
  ))

  if (!collidedX) {
    player.x = Math.max(player.size / 2, Math.min(world.width - player.size / 2, nextX))
  }

  // colisão eixo Y
  let nextY = player.y + dy
  let playerBoxY = {
    x: player.x - player.size / 2,
    y: nextY - player.size / 2,
    width: player.size,
    height: player.size
  }
  let collidedY = obstacles.some(block => (
    playerBoxY.x < block.x + block.width &&
    playerBoxY.x + playerBoxY.width > block.x &&
    playerBoxY.y < block.y + block.height &&
    playerBoxY.y + playerBoxY.height > block.y
  ))

  if (!collidedY) {
    player.y = Math.max(player.size / 2, Math.min(world.height - player.size / 2, nextY))
  }
}

function draw() {
  if (!ctx || !allImagesLoaded) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  // Centraliza a câmera no jogador
  const cam = {
    x: player.x - canvas.value.width / 2,
    y: player.y - canvas.value.height / 2
  }

  // Limita a câmera dentro do mundo
  cam.x = Math.max(0, Math.min(cam.x, world.width - canvas.value.width))
  cam.y = Math.max(0, Math.min(cam.y, world.height - canvas.value.height))

  // Desenha fundo
  ctx.drawImage(background, -cam.x, -cam.y, world.width, world.height)

  // Desenha obstáculos (debug)
  /*
  ctx.fillStyle = 'rgba(255,0,0,0.3)'
  for (const block of obstacles) {
    ctx.fillRect(block.x - cam.x, block.y - cam.y, block.width, block.height)
  }
  */

  // Seleciona o sprite atual para desenhar
  let currentSprite

  if (player.direction === 'walk_down') {
    currentSprite = playerSprites.walk_down[walkDownFrameIndex]
  } else {
    currentSprite = playerSprites[player.direction] || playerSprites.idle
  }

  if (currentSprite && currentSprite.complete) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 10

    ctx.drawImage(
      currentSprite,
      player.x - cam.x - player.size / 2,
      player.y - cam.y - player.size / 2,
      player.size,
      player.size
    )

    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  // Desenha o foreground
  ctx.drawImage(foreground, -cam.x, -cam.y, world.width, world.height)
}

function getPlayerNearbyStructure() {
  for (const block of obstacles) {
    if (
      player.x > block.x &&
      player.x < block.x + block.width &&
      player.y > block.y &&
      player.y < block.y + block.height
    ) {
      return block
    }
  }
  return null
}
</script>

<style scoped>
.game-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.enter-prompt {
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 10px 20px;
  font-size: 1.1rem;
  border-radius: 5px;
}

.key {
  font-weight: bold;
  background: #ddd;
  color: #333;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>

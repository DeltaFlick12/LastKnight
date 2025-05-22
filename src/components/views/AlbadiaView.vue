<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <!-- HUD -->
    <HUD :health="health" :stamina="stamina" :gold="gold" :potions="potions" :area="currentArea" />

    <!-- Prompt de entrada -->
    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> para entrar em {{ structureName }}
    </div>

    <!-- Botões -->
    <button class="map-button" @click="router.push('/map')">🗺️ Mapa</button>
    <button class="bag-button" @click="toggleBag">🎒 Mochila</button>

    <!-- Mochila -->
    <Inventory 
      v-if="bagOpen"
      :potions="potions"
      :equipped-weapon="equippedWeapon"
      @use-potion="usePotion"
      @equip-weapon="equipWeapon"
      @close="toggleBag"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Inventory from '@/components/Inventory.vue'
import HUD from '@/components/HUD.vue'

const router = useRouter()

// Estados principais
const health = ref(100)
const stamina = ref(100)
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
    health.value = Math.min(100, health.value + 30)
    potions.value--
  }
}

// Canvas + mapa
const canvas = ref(null)
let ctx
const player = {
  x: 2500, y: 1700, size: 30, color: 'red', speed: 5
}
const keys = { w: false, a: false, s: false, d: false }
const world = { width: 3000, height: 2000 }
const background = new Image()
const foreground = new Image()
const obstacles = [
  { x: 480, y: 380, width: 480, height: 180, name: 'Ferreiro', route: '/interior/ferreiro' },
  { x: 1310, y: 820, width: 350, height: 150, name: 'Loja de Poções', route: '/interior/pocoes' },
  { x: 2080, y: 590, width: 330, height: 140, name: 'Igreja', route: '/interior/igreja' },
  { x: 1165, y: 1300, width: 290, height: 20, name: 'Fonte' },
  { x: 1155, y: 1320, width: 315, height: 25 },
  { x: 1145, y: 1345, width: 335, height: 120 },
  { x: 1165, y: 1465, width: 290, height: 20 },
  { x: 400, y: 1545, width: 310, height: 20 },
  { x: 380, y: 1545, width: 20, height: 320 },
  { x: 400, y: 1810, width: 310, height: 55 },
]

let imagesLoaded = 0
onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  background.src = 'public/img/albadia/albadia-bg.png'
  foreground.src = 'public/img/albadia/albadiaDetalhes.png'
  background.onload = foreground.onload = () => {
    imagesLoaded++
    if (imagesLoaded >= 2) {
      gameLoop()
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
})

function resizeCanvas() {
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

function gameLoop() {
  update()
  draw()
  requestAnimationFrame(gameLoop)
}

function update() {
  const { w, a, s, d } = keys
  if (w) move(0, -player.speed)
  if (s) move(0, player.speed)
  if (a) move(-player.speed, 0)
  if (d) move(player.speed, 0)

  const nearStructure = getPlayerNearbyStructure()
  showEnterPrompt.value = !!nearStructure?.route
  structureName.value = nearStructure?.name || ''
}

function move(dx, dy) {
  const next = { ...player, x: player.x + dx, y: player.y + dy }
  for (const block of obstacles) {
    if (isColliding(next, block)) {
      if (block.name) currentArea.value = block.name
      return
    }
  }
  player.x = Math.max(0, Math.min(world.width - player.size, next.x))
  player.y = Math.max(0, Math.min(world.height - player.size, next.y))
  currentArea.value = 'Reino de Albadia'
}

function getPlayerNearbyStructure() {
  return obstacles.find(b => {
    if (!b.route) return false
    const buffer = 20
    const playerCenter = {
      x: player.x + player.size / 2,
      y: player.y + player.size / 2,
    }
    const blockCenter = {
      x: b.x + b.width / 2,
      y: b.y + b.height / 2,
    }
    const dx = playerCenter.x - blockCenter.x
    const dy = playerCenter.y - blockCenter.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < Math.max(b.width, b.height) / 2 + buffer
  })
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.size > b.x && a.y < b.y + b.height && a.y + a.size > b.y
}

function getCamera() {
  const cw = canvas.value.width
  const ch = canvas.value.height
  return {
    x: Math.max(0, Math.min(player.x - cw / 2, world.width - cw)),
    y: Math.max(0, Math.min(player.y - ch / 2, world.height - ch))
  }
}

function draw() {
  const cam = getCamera()
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.drawImage(background, cam.x, cam.y, canvas.value.width, canvas.value.height, 0, 0, canvas.value.width, canvas.value.height)
  ctx.fillStyle = player.color
  ctx.fillRect(player.x - cam.x, player.y - cam.y, player.size, player.size)
  ctx.drawImage(foreground, cam.x, cam.y, canvas.value.width, canvas.value.height, 0, 0, canvas.value.width, canvas.value.height)
}
</script>

<style scoped>
.game-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Press Start 2P', cursive;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: black;
}

.enter-prompt {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 10, 10, 0.7);
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 12px 20px;
  color: #fffbe6;
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  z-index: 999;
  text-align: center;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}

.enter-prompt .key {
  background: #ffd700;
  color: black;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 0 5px;
}

.map-button,
.bag-button {
  position: absolute;
  left: 20px;
  padding: 10px 20px;
  font-size: 14px;
  background: #8b5e3c;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  z-index: 20;
}

.map-button {
  top: 50%;
  transform: translateY(-60px);
}
.bag-button {
  top: 60%;
  transform: translateY(-60px);
}
</style>

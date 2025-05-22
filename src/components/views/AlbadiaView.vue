<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <!-- HUD -->
    <div class="hud">
      <div class="stat-group">
        <div class="stat">❤️ Vida: {{ health }}/100</div>
        <div class="stat">⚡ Stamina: {{ stamina }}/100</div>
      </div>
      <div class="resources">
        <div>🪙 Ouro: {{ gold }}</div>
        <div>🧪 Poções: {{ potions }}</div>
      </div>
      <div class="area">📍 {{ currentArea }}</div>
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

const router = useRouter()

// Estados principais
const health = ref(100)
const stamina = ref(100)
const gold = ref(150)
const potions = ref(3)
const currentArea = ref('Reino de Albadia')

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
  { x: 480, y: 380, width: 480, height: 180 }, // Ferreiro
  { x: 1310, y: 820, width: 350, height: 150 }, // Poção
  { x: 2080, y: 590, width: 330, height: 140 }, // Igreja
  { x: 1165, y: 1300, width: 290, height: 20 }, // Fonte
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

  background.src = 'public/img/albadia-bg.png'
  foreground.src = 'public/img/albadiaDetalhes.png'
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
}

function move(dx, dy) {
  const next = { ...player, x: player.x + dx, y: player.y + dy }
  for (const block of obstacles) {
    if (isColliding(next, block)) return
  }
  player.x = Math.max(0, Math.min(world.width - player.size, next.x))
  player.y = Math.max(0, Math.min(world.height - player.size, next.y))
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

  // DEBUG obstáculos (opcional)
  // ctx.fillStyle = "rgba(255, 0, 0, 0.3)"
  // obstacles.forEach(b => ctx.fillRect(b.x - cam.x, b.y - cam.y, b.width, b.height))

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

.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 14px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  z-index: 10;
}

.stat-group,
.resources {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.area {
  align-self: flex-end;
  font-weight: bold;
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

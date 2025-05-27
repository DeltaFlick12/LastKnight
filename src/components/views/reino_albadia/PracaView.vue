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
    <button class="map-button" @click="handleMapClick">🗺️ Mapa</button>
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
// Assumindo que estes componentes existem e os paths estão corretos no seu projeto
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
  x: 830, y: 1600, size: 128, speed: 6, direction: 'idle'
}
const keys = { w: false, a: false, s: false, d: false }
const world = { width: 3000, height: 2000 }
const background = new Image()
const foreground = new Image()

// *** INÍCIO: Adição para Sprites do Jogador ***
const playerSprites = {
  idle: new Image(),
  walk_down: new Image(),
  walk_up: new Image(),
  walk_left: new Image(),
  walk_right: new Image()
}
let allImagesLoaded = false; // Flag para verificar se todas as imagens carregaram
let imagesLoadedCount = 0;
// Contar background, foreground e todos os sprites do jogador
const totalImagesToLoad = 2 + Object.keys(playerSprites).length; 

function imageLoadedCallback() {
    imagesLoadedCount++;
    console.log(`Imagem carregada (${imagesLoadedCount}/${totalImagesToLoad})`);
    if (imagesLoadedCount >= totalImagesToLoad) {
        console.log("Todas as imagens carregadas!");
        allImagesLoaded = true;
        gameLoop(); // Inicia o jogo APENAS quando tudo estiver carregado
    }
}

function loadImage(img, src) {
    img.onload = imageLoadedCallback;
    img.onerror = () => console.error(`Erro ao carregar imagem: ${src}`);
    img.src = src;
}
// *** FIM: Adição para Sprites do Jogador ***

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
  if (!canvas.value) {
      console.error("Elemento Canvas não encontrado!");
      return;
  }
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  console.log("Iniciando carregamento das imagens...");
  // Carrega background e foreground (ajuste os paths se necessário)
  loadImage(background, '/public/img/albadia/albadia-bg.png') // Path original do seu código
  loadImage(foreground, '/public/img/albadia/albadiaDetalhes.png') // Path original do seu código
  // *** INÍCIO: Carregamento dos Sprites do Jogador ***
  loadImage(playerSprites.idle, '/img/sprites/player/player_idle.png'); 
  loadImage(playerSprites.walk_down, '/img/sprites/player/player_walk_down.png');
  loadImage(playerSprites.walk_up, '/img/sprites/player/player_walk_up.png');
  loadImage(playerSprites.walk_left, '/img/sprites/player/player_walk_left.png');
  loadImage(playerSprites.walk_right, '/img/sprites/player/player_walk_right.png');
  // *** FIM: Carregamento dos Sprites do Jogador ***

  // Não chama gameLoop() aqui, ele será chamado pelo imageLoadedCallback
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
  // Poderia cancelar o animation frame aqui se necessário
})

function resizeCanvas() {
  if (!canvas.value) return;
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

let animationFrameId = null;

function gameLoop() {
  // Só executa se TUDO estiver carregado
  if (!allImagesLoaded) {
      console.log("Aguardando carregamento...");
      animationFrameId = requestAnimationFrame(gameLoop); // Tenta no próximo frame
      return;
  }
  update()
  draw()
  animationFrameId = requestAnimationFrame(gameLoop)
}

function update() {
  const { w, a, s, d } = keys
  let moved = false;
  let dx = 0;
  let dy = 0;

  // *** INÍCIO: Atualização da Direção do Jogador ***
  if (w) { dy -= player.speed; player.direction = 'walk_up'; moved = true; }
  if (s) { dy += player.speed; player.direction = 'walk_down'; moved = true; }
  if (a) { dx -= player.speed; player.direction = 'walk_left'; moved = true; }
  if (d) { dx += player.speed; player.direction = 'walk_right'; moved = true; }

  if (moved) {
      move(dx, dy);
  } else {
      player.direction = 'idle'; // Volta para idle se não estiver movendo
  }
  // *** FIM: Atualização da Direção do Jogador ***

  const nearStructure = getPlayerNearbyStructure()
  showEnterPrompt.value = !!nearStructure?.route
  structureName.value = nearStructure?.name || ''
}

function move(dx, dy) 
{
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  const next = { ...player, x: nextX, y: nextY }
  let collided = false;

  for (const block of obstacles) {
    if (isColliding(next, block)) {
      if (block.name) currentArea.value = block.name
      collided = true;
      // Lógica simples de parada em colisão
      break; 
    }
  }
  
  if (!collided) {
      player.x = Math.max(0, Math.min(world.width - player.size, nextX))
      player.y = Math.max(0, Math.min(world.height - player.size, nextY))
      currentArea.value = 'Reino de Albadia'
  }
}

function getPlayerNearbyStructure() {
  return obstacles.find(b => {
    if (!b.route) return false
    const buffer = 20
    const playerHitbox = { x: player.x, y: player.y, width: player.size, height: player.size };
    const structureHitbox = { x: b.x - buffer, y: b.y - buffer, width: b.width + 2 * buffer, height: b.height + 2 * buffer };
    
    return playerHitbox.x < structureHitbox.x + structureHitbox.width &&
           playerHitbox.x + playerHitbox.width > structureHitbox.x &&
           playerHitbox.y < structureHitbox.y + structureHitbox.height &&
           playerHitbox.y + playerHitbox.height > structureHitbox.y;
  })
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.size > b.x && a.y < b.y + b.height && a.y + a.size > b.y
}

function getCamera() {
  if (!canvas.value) return { x: 0, y: 0 };
  const cw = canvas.value.width
  const ch = canvas.value.height
  return {
    x: Math.max(0, Math.min(player.x - cw / 2, world.width - cw)),
    y: Math.max(0, Math.min(player.y - ch / 2, world.height - ch))
  }
}

function draw() {
  if (!ctx || !canvas.value || !allImagesLoaded) return; // Segurança extra

  const cam = getCamera()
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  // Desenha o background
  if (background.complete) {
      ctx.drawImage(background, cam.x, cam.y, canvas.value.width, canvas.value.height, 0, 0, canvas.value.width, canvas.value.height)
  } else {
      console.warn("Background não pronto para desenhar.");
  }
  
  // *** INÍCIO: Desenho do Sprite do Jogador ***
  // Seleciona o sprite correto baseado na direção atual
  let currentSprite = playerSprites[player.direction] || playerSprites.idle; 

  // Desenha o sprite se ele estiver carregado e completo
  if (currentSprite && currentSprite.complete) { 
      ctx.drawImage(currentSprite, player.x - cam.x, player.y - cam.y, player.size, player.size)
  } else {
      // Fallback: Desenha o sprite 'idle' se o atual não estiver pronto (raro)
      if (playerSprites.idle && playerSprites.idle.complete) {
          ctx.drawImage(playerSprites.idle, player.x - cam.x, player.y - cam.y, player.size, player.size);
      } else {
          // Fallback final: Desenha um quadrado se nem o idle carregou
          console.warn(`Sprite ${player.direction} ou idle não pronto.`);
          ctx.fillStyle = 'magenta'; // Cor chamativa para indicar erro
          ctx.fillRect(player.x - cam.x, player.y - cam.y, player.size, player.size);
      }
  }
  // *** FIM: Desenho do Sprite do Jogador ***

  // Desenha o foreground
  if (foreground.complete) {
      ctx.drawImage(foreground, cam.x, cam.y, canvas.value.width, canvas.value.height, 0, 0, canvas.value.width, canvas.value.height)
  } else {
      console.warn("Foreground não pronto para desenhar.");
  }
}
</script>

<style scoped>
/* Estilos permanecem os mesmos do código original */
.game-view {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  display: block; 
  background-color: #333; 
}

.enter-prompt {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1.2em;
  z-index: 10;
}

.key {
  background-color: #eee;
  color: #333;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #ccc;
  font-weight: bold;
}

.map-button, .bag-button {
  position: absolute;
  top: 20px;
  padding: 10px 15px;
  font-size: 1.5em;
  cursor: pointer;
  background-color: rgba(200, 200, 100, 0.8);
  border: 2px solid #663300;
  border-radius: 5px;
  z-index: 10;
}

.map-button {
  right: 80px;
}

.bag-button {
  right: 20px;
}
</style>

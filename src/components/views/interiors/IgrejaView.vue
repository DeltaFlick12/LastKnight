<template>
  <div class="igreja-screen"
       :style="{ backgroundImage: `url(${bgImage})`, backgroundSize: 'auto 120%', transform: `scale(${zoomLevel})` }"
       @keydown="startMoving" 
       @keyup="stopMoving"
       tabindex="0">

    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <!-- Personagem -->
    <div 
      :style="{ 
        left: `${characterPosition.x}px`, 
        top: `${characterPosition.y}px`, 
        backgroundImage: `url(${currentSprite})`, 
        backgroundSize: 'cover', 
        width: '80px', 
        height: '80px' 
      }" 
      class="character">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import bgImage from '@/assets/interior/igreja-bg.png'

// Sprites do personagem
const sprites = {
  idle: '/img/sprites/player/player_idle.png',
  walk_up: '/img/sprites/player/player_walk_up.png',
  walk_down: '/img/sprites/player/player_walk_down.png',
  walk_left: '/img/sprites/player/player_walk_left.png',
  walk_right: '/img/sprites/player/player_walk_right.png'
}

// Referência para o sprite atual
const currentSprite = ref(sprites.idle)

// Controle do personagem
const characterPosition = ref({ x: 655, y: 365 }) // Posição inicial do personagem
const zoomLevel = ref(0.95) // Zoom ajustado da tela (mais afastado)
const moving = ref({ up: false, down: false, left: false, right: false }) // Estado de movimentação

// Controle do diálogo
const showDialog = ref(true)
const dialogIndex = ref(0)
const dialogLines = [
  'Filho, bem-vindo à casa sagrada de Albadia.',
  'Aqui oferecemos bênçãos para proteger-te nas tuas batalhas.',
  'Cada bênção carrega consigo um poder divino e um preço justo.',
  'Escolha com fé...'
]
const displayedText = ref('')
const typing = ref(false)

// Flag para bloquear movimento
const canMove = ref(false)

// Tamanho do mapa
const mapWidth = 1024;  // Ajuste conforme o tamanho real da imagem de fundo
const mapHeight = 1024;

// Função para digitar a linha de texto
const typeLine = async () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0

  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index]
      index++
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 40)
}

// Função para avançar o diálogo
const nextDialog = () => {
  if (typing.value) return
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    canMove.value = true // Permite o movimento quando o diálogo terminar
  }
}

// Função para começar a movimentação ao pressionar as teclas WASD
const startMoving = (event) => {
  if (!canMove.value) return // Impede o movimento enquanto o diálogo estiver ativo

  switch (event.key.toLowerCase()) {
    case 'w':
      moving.value.up = true;
      currentSprite.value = sprites.walk_up; // Atualiza para sprite de subir
      break;
    case 's':
      moving.value.down = true;
      currentSprite.value = sprites.walk_down; // Atualiza para sprite de descer
      break;
    case 'a':
      moving.value.left = true;
      currentSprite.value = sprites.walk_left; // Atualiza para sprite de andar à esquerda
      break;
    case 'd':
      moving.value.right = true;
      currentSprite.value = sprites.walk_right; // Atualiza para sprite de andar à direita
      break;
  }
}

// Função para parar a movimentação ao soltar as teclas WASD
const stopMoving = (event) => {
  if (!canMove.value) return // Impede o movimento enquanto o diálogo estiver ativo

  switch (event.key.toLowerCase()) {
    case 'w':
      moving.value.up = false;
      break;
    case 's':
      moving.value.down = false;
      break;
    case 'a':
      moving.value.left = false;
      break;
    case 'd':
      moving.value.right = false;
      break;
  }
  // Se nenhuma tecla de movimento estiver pressionada, mantém o sprite de idle
  if (!moving.value.up && !moving.value.down && !moving.value.left && !moving.value.right) {
    currentSprite.value = sprites.idle;
  }
}

// Função para atualizar a posição do personagem com base nas teclas pressionadas
const updateMovement = () => {
  const step = 5; // Quantos pixels por vez

  if (moving.value.up) characterPosition.value.y = Math.max(characterPosition.value.y - step, 0);
  if (moving.value.down) characterPosition.value.y = Math.min(characterPosition.value.y + step, mapHeight - 50); // 50px é o tamanho do personagem
  if (moving.value.left) characterPosition.value.x = Math.max(characterPosition.value.x - step, 0);
  if (moving.value.right) characterPosition.value.x = Math.min(characterPosition.value.x + step, mapWidth - 50); // 50px é o tamanho do personagem
}

// Atualiza a posição do personagem a cada frame
onMounted(() => {
  typeLine()
  document.querySelector('.igreja-screen').focus()

  // Atualiza a posição do personagem constantemente enquanto ele estiver se movendo
  setInterval(updateMovement, 16); // Aproximadamente 60fps
})
</script>

<style scoped>
.igreja-screen {
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  height: 100vh;
  width: 100vw;
  color: white;
  font-family: 'Press Start 2P', cursive;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  overflow: hidden;
  outline: none;
}

.dialog-box {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #ffffff;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  z-index: 1;
  margin-top: 400px;
}

button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #ffffff;
  color: black;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.character {
  position: absolute;
  transition: left 0.1s, top 0.1s;
}
</style>

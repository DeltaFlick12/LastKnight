<template>
  <div
    class="igreja-screen"
    @keydown="handleKeyDown" 
    @keyup="handleKeyUp"
    tabindex="0"
    ref="screenRef" 
  >
    <!-- Camada com imagem e zoom centralizado -->
    <div
      class="zoom-layer"
      :style="{
        backgroundImage: `url(${bgImage})`,
        transform: `translate(-50%, -50%) scale(${zoomLevel})`
      }"
    >
      <!-- NPC Padre -->
      <div
        class="npc padre"
        :style="{
          transform: `translate(${padrePosition.x}px, ${padrePosition.y}px)`,
          backgroundImage: `url(${padreSprite})`
        }"
      ></div>

      <!-- Personagem do jogador -->
      <div
        class="character"
        :style="{
          transform: `translate(${characterPosition.x}px, ${characterPosition.y}px)` ,
          backgroundImage: `url(${currentSprite})`,
          backgroundSize: 'cover',
          width: '80px',
          height: '80px'
        }"
      ></div>

      <!-- Visualização das colisões (Manter comentado para produção) -->
      <!-- <div
        v-for="(area, i) in collisionAreas"
        :key="i"
        class="collision-box"
        :style="{
          transform: `translate(${area.x}px, ${area.y}px)`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      /> -->

      <!-- Visualização das áreas interativas (Manter comentado para produção) -->
      <!-- <div
        v-for="(area, i) in interactionAreas"
        :key="'interact-' + i"
        class="interaction-box"
        :style="{
          transform: `translate(${area.x}px, ${area.y}px)`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      /> -->
    </div>

    <!-- Caixa de diálogo do diálogo inicial -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <!-- Indicador de interação para sair da igreja -->
    <div v-if="showExitIndicator && !showDialog && !showBlessingMenu" class="interaction-indicator">
      <p>{{ exitDialogText }}</p>
    </div>

    <!-- Indicador de interação com Padre -->
    <div v-if="showPadreIndicator && !showDialog && !showBlessingMenu" class="interaction-indicator">
      <p>Pressione 'E' para falar com o Padre José.</p>
    </div>

    <!-- **** MENU DE BÊNÇÃOS (LOJA DO PADRE) **** -->
    <div v-if="showBlessingMenu" class="blessing-menu dialog-box">
      <h4>Bênçãos Disponíveis</h4>
      <p>Padre José: Que a luz o guie. (Ouro: {{ gameState.player.gold }})</p>
      <ul>
        <!-- Bênçãos (Exemplos - Ajustar conforme seu jogo) -->
        <li>
          <span>Restauração Divina (HP/SP Total)</span>
          <span>Custo: 30 Ouro</span>
          <button @click="buyBlessing('restore')" :disabled="gameState.player.gold < 30">Comprar</button>
        </li>
        <li>
          <span>Bênção da Vitalidade (+20 Vida Máx)</span>
          <span>Custo: 50 Ouro</span>
          <button @click="buyBlessing('vitality')" :disabled="gameState.player.gold < 50">Comprar</button>
        </li>
        <li>
          <span>Bênção do Vigor (+20 Stamina Máx)</span>
          <span>Custo: 50 Ouro</span>
          <button @click="buyBlessing('vigor')" :disabled="gameState.player.gold < 50">Comprar</button>
        </li>
        <li>
          <span>Bênção do Rio (Permite Atravessar)</span>
          <span>Custo: 100 Ouro</span>
          <!-- Adicionar v-if="!gameState.player.flags.canCrossRiver" se usar flag -->
          <button @click="buyBlessing('river')" :disabled="gameState.player.gold < 100">Comprar</button>
        </li>
      </ul>
      <p v-if="blessingMessage" class="blessing-feedback">{{ blessingMessage }}</p>
      <button @click="closeBlessingMenu">Sair</button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'; // Para navegação
import { useGameState } from '@/stores/gameState'; // Para ouro e efeitos
import bgImage from '@/assets/interior/igreja-bg.png'
import padreSprite from '@/assets/Padre.png'
// Remover import não utilizado: import BlessingsMenu from '@/components/views/interiors/BlessingsMenu.vue'

const router = useRouter();
const gameState = useGameState();
const screenRef = ref(null); // Referência para focar

// Sprites (Mantido da sua versão)
const sprites = {
  idle: '/img/sprites/player/player_idle.png',
  walk_up: '/img/sprites/player/player_walk_up.png',
  walk_down: '/img/sprites/player/player_walk_down.png',
  walk_left: '/img/sprites/player/player_walk_left.png',
  walk_right: '/img/sprites/player/player_walk_right.png'
}

// Estado do personagem (Mantido da sua versão)
const currentSprite = ref(sprites.idle)
const characterPosition = ref({ x: 500, y: 800 }) // Posição inicial perto da saída (ajustada)
const zoomLevel = ref(0.95)
const moving = ref({ up: false, down: false, left: false, right: false })
const lastDirection = ref('up')

// Estado do padre (Mantido da sua versão)
const padrePosition = ref({ x: 400, y: 120 })

// --- CONTROLE DO DIÁLOGO INICIAL ---
const showDialog = ref(false) // Começa falso, verifica no onMounted
const dialogIndex = ref(0)
const dialogLines = [
  'Filho, bem-vindo à casa sagrada de Albadia.',
  'Aqui oferecemos bênçãos para proteger-te nas tuas batalhas.',
  'Cada bênção carrega consigo um poder divino e um preço justo.',
  'Escolha com fé...'
]
const displayedText = ref('')
const typing = ref(false)
const canMove = ref(false) // Só pode mover após diálogo ou se já viu
const DIALOGUE_SEEN_KEY = 'churchDialogueSeen_v1'; // Chave única para localStorage

// Indicadores de interação
const showExitIndicator = ref(false)
const exitDialogText = `Pressione 'E' para Sair da Igreja`
const showPadreIndicator = ref(false)

// --- ESTADO DO MENU DE BÊNÇÃOS ---
const showBlessingMenu = ref(false)
const blessingMessage = ref('')

// Tamanho do fundo e ID da animação (Mantido da sua versão)
const bgWidth = 1024
const bgHeight = 1024
let animationFrameId = null

// Áreas de colisão
const collisionAreas = [
  { x: 0, y: 200, width: 1024, height: 50 },
  { x: 0, y: 950, width: 1024, height: 50 },
  { x: 1020, y: 200, width: 50, height: 1000 },
  { x: 820, y: 700, width: 130, height: 100 },
  { x: 430, y: 890, width: 170, height: 50 },
]

const interactionAreas = [
  { x: 430, y: 850, width: 170, height: 80, action: () =>  window.location.href = '/level/albadia' },
  { x: padrePosition.value.x - 40, y: padrePosition.value.y - 20, width: 160, height: 160, id: 'padre', action: () => openBlessingMenu() }
]

// Verificação de colisão (Mantida da sua versão, com pequeno ajuste no charBox)
const isColliding = (nextX, nextY) => {
  const charWidth = 60; // Ajustar se necessário
  const charHeight = 60; // Ajustar se necessário
  const charBox = {
    x: nextX + 10, // Offset para melhor colisão
    y: nextY + 10,
    width: charWidth,
    height: charHeight
  }
  return collisionAreas.some(area =>
    charBox.x < area.x + area.width &&
    charBox.x + charBox.width > area.x &&
    charBox.y < area.y + area.height &&
    charBox.y + charBox.height > area.y
  )
}

// Verifica área interativa (Mantida da sua versão)
const getInteractionArea = () => {
  const charBox = {
    x: characterPosition.value.x,
    y: characterPosition.value.y,
    width: 80,
    height: 80
  }
  return interactionAreas.find(area =>
    charBox.x < area.x + area.width &&
    charBox.x + charBox.width > area.x &&
    charBox.y < area.y + area.height &&
    charBox.y + charBox.height > area.y
  )
}

// Digitação do texto do diálogo inicial (Mantida da sua versão)
const typeLine = () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0
  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index++]
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 40)
}

// Avançar diálogo e marcar como visto (Ajustado)
const nextDialog = () => {
  if (typing.value) return
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    canMove.value = true
    localStorage.setItem(DIALOGUE_SEEN_KEY, 'true'); // Marca como visto
    focusScreen(); // Foca após diálogo
  }
}

// --- FUNÇÕES DO MENU DE BÊNÇÃOS ---
const openBlessingMenu = () => {
  if (!canMove.value || showDialog.value) return; // Não abrir se não puder mover ou se diálogo inicial estiver ativo
  console.log("Abrindo menu de bênçãos...");
  blessingMessage.value = ''; // Limpa feedback
  showBlessingMenu.value = true;
  canMove.value = false; // Bloqueia movimento
}

const closeBlessingMenu = () => {
  showBlessingMenu.value = false;
  canMove.value = true; // Libera movimento
  focusScreen();
}

const buyBlessing = (blessingType) => {
  let cost = 0;
  let purchased = false;

  // Definir custos e lógica aqui (ajustar conforme seu jogo)
  switch (blessingType) {
    case 'restore':
      cost = 30;
      if (gameState.player.gold >= cost) {
        gameState.player.gold -= cost;
        gameState.player.health = gameState.player.maxHealth;
        gameState.player.stamina = gameState.player.maxStamina;
        blessingMessage.value = "Vida e Vigor restaurados!";
        purchased = true;
      } else {
        blessingMessage.value = "Ouro insuficiente.";
      }
      break;
    case 'vitality':
      cost = 50;
      if (gameState.player.gold >= cost) {
        gameState.player.gold -= cost;
        gameState.player.maxHealth += 20;
        gameState.player.health += 20; // Cura um pouco também
        blessingMessage.value = "Bênção da Vitalidade recebida!";
        purchased = true;
      } else {
        blessingMessage.value = "Ouro insuficiente.";
      }
      break;
    case 'vigor':
      cost = 50;
      if (gameState.player.gold >= cost) {
        gameState.player.gold -= cost;
        gameState.player.maxStamina += 20;
        gameState.player.stamina += 20; // Restaura um pouco também
        blessingMessage.value = "Bênção do Vigor recebida!";
        purchased = true;
      } else {
        blessingMessage.value = "Ouro insuficiente.";
      }
      break;
    case 'river':
      cost = 100;
      // Assumindo que você adicionará uma flag `canCrossRiver` ao gameState
      // Exemplo: if (!gameState.player.flags) gameState.player.flags = {};
      // if (gameState.player.gold >= cost && !gameState.player.flags?.canCrossRiver) {
      if (gameState.player.gold >= cost) { // Simplificado por enquanto
        gameState.player.gold -= cost;
        // gameState.player.flags.canCrossRiver = true;
        blessingMessage.value = "Você recebeu a bênção para cruzar o rio!";
        purchased = true;
      } else if (gameState.player.gold < cost) {
        blessingMessage.value = "Ouro insuficiente.";
      } else {
        // blessingMessage.value = "Você já possui esta bênção.";
      }
      break;
    default:
      blessingMessage.value = "Bênção desconhecida.";
  }

  // Opcional: Limpar mensagem após um tempo
  if (blessingMessage.value) {
      setTimeout(() => { blessingMessage.value = ''; }, 2500);
  }
}

// Limites de movimento (Mantido da sua versão)
const getMovementBounds = () => {
    // Calcula limites baseados no tamanho real da imagem de fundo
    return {
        minX: 0,
        maxX: bgWidth - 80, // Largura do personagem
        minY: 0,
        maxY: bgHeight - 80 // Altura do personagem
    }
}

// Atualização do movimento (Mantida da sua versão, com bloqueio para menu)
const updateMovement = () => {
  // Bloquear se diálogo inicial ou menu de bênçãos estiverem ativos
  if (!canMove.value || showBlessingMenu.value) {
    animationFrameId = requestAnimationFrame(updateMovement);
    return;
  }

  const step = 4; // Velocidade ajustada
  let moved = false;
  const bounds = getMovementBounds();
  let nextX = characterPosition.value.x;
  let nextY = characterPosition.value.y;

  // Lógica de movimento (mantida)
  if (moving.value.up) { nextY -= step; lastDirection.value = 'up'; moved = true; }
  if (moving.value.down) { nextY += step; lastDirection.value = 'down'; moved = true; }
  if (moving.value.left) { nextX -= step; lastDirection.value = 'left'; moved = true; }
  if (moving.value.right) { nextX += step; lastDirection.value = 'right'; moved = true; }

  // Clamp dentro dos limites
  nextX = Math.max(bounds.minX, Math.min(nextX, bounds.maxX));
  nextY = Math.max(bounds.minY, Math.min(nextY, bounds.maxY));

  // Verifica colisão antes de mover
  if (!isColliding(nextX, nextY)) {
    characterPosition.value.x = nextX;
    characterPosition.value.y = nextY;
  } else {
    // Tenta deslizar (opcional, mas melhora a sensação)
    if (!isColliding(nextX, characterPosition.value.y)) {
        characterPosition.value.x = nextX;
    } else if (!isColliding(characterPosition.value.x, nextY)) {
        characterPosition.value.y = nextY;
    } else {
        moved = false; // Bloqueado em ambas as direções
    }
  }

  // Atualiza sprite (mantido)
  if (moved) {
    currentSprite.value = sprites[`walk_${lastDirection.value}`];
  } else if (!Object.values(moving.value).some(v => v)) {
    currentSprite.value = sprites.idle;
  }

  // Verifica área interativa (mantido)
  const currentInteractionArea = getInteractionArea();
  showExitIndicator.value = currentInteractionArea?.id === 'exit';
  showPadreIndicator.value = currentInteractionArea?.id === 'padre';

  animationFrameId = requestAnimationFrame(updateMovement);
}

// Controles do teclado (Mantido da sua versão, com bloqueio para menu e tecla 'E')
const handleKeyDown = (event) => {
  // Avançar diálogo inicial
  if (showDialog.value && !typing.value && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); nextDialog(); return;
  }

  // Não fazer nada se não puder mover ou menu estiver aberto
  if (!canMove.value || showBlessingMenu.value) return;

  const key = event.key.toLowerCase();

  // Tecla de Interação 'E'
  if (key === 'e') {
    event.preventDefault();
    const area = getInteractionArea();
    if (area) {
      area.action(); // Chama openBlessingMenu ou navega para saída
    }
    return;
  }

  // Movimento
  switch (key) {
    case 'w': case 'arrowup': moving.value.up = true; break;
    case 's': case 'arrowdown': moving.value.down = true; break;
    case 'a': case 'arrowleft': moving.value.left = true; break;
    case 'd': case 'arrowright': moving.value.right = true; break;
  }
}

const handleKeyUp = (event) => {
  // Não precisa verificar canMove aqui
  switch (event.key.toLowerCase()) {
    case 'w': case 'arrowup': moving.value.up = false; break;
    case 's': case 'arrowdown': moving.value.down = false; break;
    case 'a': case 'arrowleft': moving.value.left = false; break;
    case 'd': case 'arrowright': moving.value.right = false; break;
  }
}

// Focar a tela (Mantido)
const focusScreen = () => { nextTick(() => { screenRef.value?.focus(); }); }

onMounted(() => {
  // --- VERIFICA SE DIÁLOGO JÁ FOI VISTO ---
  const dialogueSeen = localStorage.getItem(DIALOGUE_SEEN_KEY);
  if (!dialogueSeen) {
    showDialog.value = true;
    typeLine(); // Mostra diálogo
  } else {
    showDialog.value = false;
    canMove.value = true; // Permite mover direto
  }

  focusScreen();
  screenRef.value?.addEventListener('click', focusScreen);

  // Define posição inicial (mantido da sua versão, mas centralizado como exemplo)
  // const bounds = getMovementBounds();
  // characterPosition.value.x = (bounds.minX + bounds.maxX) / 2;
  // characterPosition.value.y = (bounds.minY + bounds.maxY) / 2;
  // Mantendo a posição perto da saída:
  characterPosition.value.x = 500;
  characterPosition.value.y = 850; // Ajustar se necessário


  animationFrameId = requestAnimationFrame(updateMovement);
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  screenRef.value?.removeEventListener('click', focusScreen);
})

</script>

<style scoped>
/* Estilos gerais (Mantidos da sua versão) */
.igreja-screen { height: 100vh; width: 100vw; position: relative; overflow: hidden; outline: none; font-family: 'Press Start 2P', cursive; color: white; background-color: #000; }
.zoom-layer { position: absolute; top: 50%; left: 50%; width: 1024px; height: 1024px; background-repeat: no-repeat; background-position: center; background-size: contain; transform-origin: center center; image-rendering: pixelated; z-index: 0; }
.character { position: absolute; /* transition: transform 0.05s linear; */ image-rendering: pixelated; z-index: 3; }
.npc.padre { position: absolute; width: 80px; height: 80px; background-size: contain; background-repeat: no-repeat; image-rendering: pixelated; z-index: 2; }
.dialog-box { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); background-color: rgba(0, 0, 0, 0.85); padding: 20px; border: 2px solid #ffffff; border-radius: 10px; text-align: center; max-width: 600px; z-index: 10; font-size: 14px; line-height: 1.6; }
.dialog-box button { margin-top: 15px; padding: 8px 15px; font-family: 'Press Start 2P', cursive; background-color: #555; color: white; border: 2px solid #888; border-radius: 5px; cursor: pointer; }
.dialog-box button:disabled { opacity: 0.5; cursor: default; }
.dialog-box button:hover:not(:disabled) { background-color: #777; }
.interaction-indicator { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background-color: rgba(0, 0, 0, 0.7); color: #fff; padding: 8px 15px; border-radius: 5px; font-size: 12px; z-index: 9; }

/* Estilos para Menu de Bênçãos (Adicionados) */
.blessing-menu {
  max-width: 550px; /* Um pouco mais largo */
  text-align: center;
}
.blessing-menu h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #ffd700;
}
.blessing-menu ul {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}
.blessing-menu li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 5px; /* Mais espaçamento vertical */
  border-bottom: 1px solid #444;
}
.blessing-menu li:last-child {
  border-bottom: none;
}
.blessing-menu li span:first-child {
  flex-grow: 1;
  text-align: left;
  margin-right: 15px;
}
.blessing-menu li span:nth-child(2) {
  min-width: 110px; /* Espaço para custo */
  text-align: right;
  color: #ffcc00;
  margin-right: 20px;
}
.blessing-menu li button {
  margin: 0;
  padding: 6px 12px;
  font-size: 12px;
}
.blessing-feedback {
    margin-top: 15px;
    min-height: 20px; /* Espaço para feedback */
    color: #90ee90; /* Verde claro */
    font-style: italic;
}
/* Botão Sair do menu */
.blessing-menu > button {
    display: block;
    margin-left: auto;
    margin-right: 0;
}

/* Estilos de Debug (Manter comentados) */
/* .collision-box { position: absolute; background-color: rgba(255, 0, 0, 0.3); border: 1px solid red; z-index: 5; } */
/* .interaction-box { position: absolute; background-color: rgba(0, 255, 0, 0.3); border: 1px solid lime; z-index: 5; } */

</style>


import { reactive } from 'vue';

// --- Definições de Dados ---

const CLASSES = {
  Guerreiro: {
    name: 'Guerreiro',
    description: 'Combatente equilibrado, focado em dano corpo a corpo.',
    baseStats: { attack: 12, defense: 8, speed: 10, maxHealth: 110, maxStamina: 100 },
    startItems: { weapon: 'sword_wood', armor: 'armor_basic' }
  },
};

export const ITEMS = {
  // Armas
  sword_wood: { id: 'sword_wood', name: 'Espada de Madeira', type: 'Arma', slot: 'weapon', stats: { attack: 5 }, description: 'Uma espada de treino.' },
  axe_iron: { id: 'axe_iron', name: 'Machado de Ferro', type: 'Arma', slot: 'weapon', stats: { attack: 8, speed: -1 }, description: 'Pesado, mas poderoso.', icon: 'img/weapons/axe-iron.png'  },
  sword_iron: { id: 'sword_iron', name: 'Espada de Ferro', type: 'Arma', slot: 'weapon', price: 50, stats: { attack: 10 }, description: 'Uma espada básica, mas confiável.', icon: 'img/weapons/sword-iron.png' },
  sword_mythril: { 
    id: 'sword_mythril', 
    name: 'Lança Rúnica', 
    type: 'Arma', 
    slot: 'weapon', 
    price: 200, 
    stats: { attack: 20 }, 
    description: 'Aumenta o dano em +20. Forjada com magia anã.',
  },
  // Armaduras
  armor_basic: { id: 'armor_basic', name: 'Armadura Básica', type: 'Armadura', slot: 'armor', stats: { defense: 3 }, description: 'Proteção simples.' },
  armor_heavy: { id: 'armor_heavy', name: 'Armadura Pesada', type: 'Armadura', slot: 'armor', stats: { defense: 8, speed: -2 }, description: 'Muito resistente, mas lenta.' },
  armor_leather: { id: 'armor_leather', name: 'Armadura de Couro', type: 'Armadura', slot: 'armor', price: 75, stats: { defense: 5 }, description: 'Oferece proteção modesta.' },
  // Consumíveis
  potion_health_small: { id: 'potion_health_small', name: 'Poção de Cura Pequena', type: 'Consumível', price: 15, effect: { heal: 30 }, description: 'Restaura 30 de vida.' },
  potion_stamina_small: { id: 'potion_stamina_small', name: 'Poção de Vigor Pequena', type: 'Consumível', price: 20, effect: { stamina: 50 }, description: 'Restaura 50 de stamina.' },
  potion_forbidden: { id: 'potion_forbidden', name: 'Poção Proibida', type: 'Consumível Especial', price: 500, effect: { special: 'sacrifice' }, description: 'Troca sua vida pela da princesa.' },
  // Chaves
  key_ancient: { id: 'key_ancient', name: 'Chave Ancestral', type: 'Chave', description: 'Uma chave antiga das ruínas.' },
  key_ice: { id: 'key_ice', name: 'Chave de Gelo', type: 'Chave', description: 'Uma chave congelada da montanha.' },
  key_fire: { id: 'key_fire', name: 'Chave de Fogo', type: 'Chave', description: 'Uma chave em brasa da caverna.' },
  key_small_rusty: { id: 'key_small_rusty', name: 'Chave Pequena Enferrujada', type: 'Chave', description: 'Abre alguma porta no castelo?' },
};

export const ITEM_ICONS = {
  // potion_health_small: '/icons/potion_health_small.png',
  // potion_stamina_small: '/icons/potion_stamina_small.png',
  // potion_forbidden: '/icons/potion_forbidden.png',
  // sword_wood: '/icons/sword_wood.png',
  sword_iron: '/icons/sword_iron.png',
  axe_iron: '/icons/axe_iron.png',
  sword_mythril: '/icons/sword_mythril.png',
  // key_small_rusty: '/icons/key_small_rusty.png',
  // key_ancient: '/icons/key_ancient.png',
  // key_ice: '/icons/key_ice.png',
  // key_fire: '/icons/key_fire.png',
  // armor_basic: '/icons/armor_basic.png',
  // armor_leather: '/icons/armor_leather.png',
  // armor_heavy: '/icons/armor_heavy.png',
};
// Estado inicial padrão
const initialState = {
  player: {
    classe: null,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    gold: 150, // Alinhado com o ferreiro
    inventory: [],
    equipment: {
      weapon: null,
      armor: null,
    },
    stats: {
      attack: 10,
      defense: 5,
      speed: 10,
    },
    keys: {
      ancestral: false,
      ice: false,
      fire: false
    },
    hasRiverBlessing: false,
    hasForbiddenPotion: false,
  },
  boss: {
    name: 'Magnus',
    health: 500,
    maxHealth: 500,
    stamina: 100,
    maxStamina: 100,
    phase: 1,
    isVulnerable: false,
    attackPattern: null,
  },
  currentArea: 'CutsceneInicial',
  levelsCompleted: [],
  quests: {
    mainQuestStep: 0,
    luccaRescued: false,
  },
  castleState: {
    leverPulled: false,
    foundSmallKey: false,
    crossedBridge: false,
    finalDoorOpened: false
  },
  magnusDefeated: false,
  endingTriggered: false,
  endingType: null,
  isBagOpen: false,
  currentDialog: null,
};

// --- Estado Global ---
export const gameState = reactive(loadStateFromLocalStorage());

// Função para carregar o estado do localStorage
function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem('gameState');
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (e) {
      console.error('Erro ao carregar estado do localStorage:', e);
    }
  }
  return initialState;
}

// Função para salvar o estado no localStorage
function saveState() {
  try {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  } catch (e) {
    console.error('Erro ao salvar estado no localStorage:', e);
  }
}

// --- Ações ---
export const actions = {
  // --- Inicialização e Classe ---
  setPlayerClass(className) {
    if (!CLASSES[className]) return;
    const classData = CLASSES[className];
    gameState.player.classe = className;

    // Definir stats base e vida/stamina máximas
    gameState.player.maxHealth = classData.baseStats.maxHealth;
    gameState.player.maxStamina = classData.baseStats.maxStamina;
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.stamina = gameState.player.maxStamina;

    // Limpar inventário e equipamento
    gameState.player.inventory = [];
    gameState.player.equipment = { weapon: null, armor: null };

    // Adicionar e equipar itens iniciais
    for (const slot in classData.startItems) {
      const itemId = classData.startItems[slot];
      if (ITEMS[itemId]) {
        this.addItemToInventory(itemId, 1);
        this.equipItem(itemId);
      }
    }
    this.recalculateStats();
    saveState(); // Salvar após alterar a classe
  },

  recalculateStats() {
    if (!gameState.player.classe) return;
    const baseStats = CLASSES[gameState.player.classe].baseStats;
    let currentStats = { ...baseStats };

    // Adiciona stats dos equipamentos
    for (const slot in gameState.player.equipment) {
      const itemId = gameState.player.equipment[slot];
      if (itemId && ITEMS[itemId] && ITEMS[itemId].stats) {
        for (const stat in ITEMS[itemId].stats) {
          currentStats[stat] = (currentStats[stat] || 0) + ITEMS[itemId].stats[stat];
        }
      }
    }
    gameState.player.stats = currentStats;
    gameState.player.maxHealth = currentStats.maxHealth;
    gameState.player.maxStamina = currentStats.maxStamina;
    gameState.player.health = Math.min(gameState.player.health, gameState.player.maxHealth);
    gameState.player.stamina = Math.min(gameState.player.stamina, gameState.player.maxStamina);
    saveState(); // Salvar após recalcular stats
  },

  // --- Inventário e Equipamento ---
  addItemToInventory(itemId, quantity = 1) {
    if (!ITEMS[itemId]) return;
    const existingItem = gameState.player.inventory.find(item => item.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      gameState.player.inventory.push({ itemId, quantity });
    }
    saveState(); // Salvar após adicionar item
  },

  removeItemFromInventory(itemId, quantity = 1) {
    const itemIndex = gameState.player.inventory.findIndex(item => item.itemId === itemId);
    if (itemIndex > -1) {
      gameState.player.inventory[itemIndex].quantity -= quantity;
      if (gameState.player.inventory[itemIndex].quantity <= 0) {
        gameState.player.inventory.splice(itemIndex, 1);
      }
    }
    saveState(); // Salvar após remover item
  },

  equipItem(itemId) {
    const itemData = ITEMS[itemId];
    if (!itemData || !itemData.slot) return;

    const currentItemInSlot = gameState.player.equipment[itemData.slot];
    if (currentItemInSlot) {
      this.unequipItem(itemData.slot);
    }

    gameState.player.equipment[itemData.slot] = itemId;
    this.recalculateStats();
    saveState(); // Salvar após equipar item
  },

  unequipItem(slot) {
    const itemId = gameState.player.equipment[slot];
    if (!itemId) return;

    gameState.player.equipment[slot] = null;
    this.recalculateStats();
    saveState(); // Salvar após desequipar item
  },

  // --- Ações do Jogador ---
  takeDamage(amount) {
    const defense = gameState.player.stats.defense || 0;
    const damageTaken = Math.max(1, amount - defense);
    gameState.player.health = Math.max(0, gameState.player.health - damageTaken);
    if (gameState.player.health === 0) {
      console.log("Game Over");
    }
    saveState(); // Salvar após receber dano
  },

  useStamina(amount) {
    gameState.player.stamina = Math.max(0, gameState.player.stamina - amount);
    saveState(); // Salvar após usar stamina
  },

  recoverStamina(amount) {
    gameState.player.stamina = Math.min(gameState.player.maxStamina, gameState.player.stamina + amount);
    saveState(); // Salvar após recuperar stamina
  },

  healPlayer(amount) {
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + amount);
    saveState(); // Salvar após curar
  },

  restorePlayer() {
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.stamina = gameState.player.maxStamina;
    saveState(); // Salvar após restaurar
  },

  useItem(itemId) {
    const itemData = ITEMS[itemId];
    const itemInInventory = gameState.player.inventory.find(i => i.itemId === itemId);
    if (!itemData || !itemInInventory || itemInInventory.quantity <= 0) return false;

    let used = false;
    if (itemData.type === 'Consumível' && itemData.effect) {
      if (itemData.effect.heal) {
        this.healPlayer(itemData.effect.heal);
        used = true;
      }
      if (itemData.effect.stamina) {
        this.recoverStamina(itemData.effect.stamina);
        used = true;
      }
    } else if (itemData.type === 'Consumível Especial' && itemData.effect?.special === 'sacrifice') {
      console.log("Poção Proibida selecionada para uso...");
      used = true;
    }

    if (used && itemData.type !== 'Consumível Especial') {
      this.removeItemFromInventory(itemId, 1);
    }
    saveState(); // Salvar após usar item
    return used;
  },

  addGold(amount) {
    gameState.player.gold += amount;
    saveState(); // Salvar após adicionar ouro
  },

  removeGold(amount) {
    gameState.player.gold = Math.max(0, gameState.player.gold - amount);
    saveState(); // Salvar após remover ouro
  },

  collectKey(keyType) {
    if (keyType === 'small_rusty') {
      this.addItemToInventory('key_small_rusty', 1);
      gameState.castleState.foundSmallKey = true;
    } else if (gameState.player.keys.hasOwnProperty(keyType)) {
      gameState.player.keys[keyType] = true;
      this.addItemToInventory(`key_${keyType}`, 1);
    }
    saveState(); // Salvar após coletar chave
  },

  grantRiverBlessing() {
    gameState.player.hasRiverBlessing = true;
    saveState(); // Salvar após conceder bênção
  },

  collectForbiddenPotion() {
    gameState.player.hasForbiddenPotion = true;
    saveState(); // Salvar após coletar poção proibida
  },

  // --- Ações de Combate ---
  playerAttackAction() {
    if (gameState.player.stamina < 10) return { success: false, message: 'Sem stamina!' };
    this.useStamina(10);
    const attackPower = gameState.player.stats.attack || 5;
    const damage = Math.floor(Math.random() * (attackPower / 2)) + Math.floor(attackPower / 2) + 1;
    saveState(); // Salvar após ataque
    return { success: true, damage: damage, message: `Você ataca com ${gameState.player.equipment.weapon || 'punhos'}!` };
  },

  damageBoss(amount) {
    if (gameState.boss.isVulnerable) {
      gameState.boss.health = Math.max(0, gameState.boss.health - amount);
      this.checkBossPhaseChange();
      if (gameState.boss.health === 0) {
        this.defeatMagnus();
      }
    }
    saveState(); // Salvar após causar dano ao chefe
  },

  setBossVulnerable(isVulnerable) {
    gameState.boss.isVulnerable = isVulnerable;
    saveState(); // Salvar após alterar vulnerabilidade
  },

  setBossPhase(phase) {
    gameState.boss.phase = phase;
    saveState(); // Salvar após alterar fase
  },

  resetBossStamina() {
    gameState.boss.stamina = gameState.boss.maxStamina;
    saveState(); // Salvar após restaurar stamina do chefe
  },

  drainBossStamina(amount) {
    gameState.boss.stamina = Math.max(0, gameState.boss.stamina - amount);
    if (gameState.boss.stamina === 0 && !gameState.boss.isVulnerable) {
      this.setBossVulnerable(true);
    }
    saveState(); // Salvar após drenar stamina do chefe
  },

  checkBossPhaseChange() {
    const healthPercent = (gameState.boss.health / gameState.boss.maxHealth) * 100;
    if (gameState.boss.phase === 1 && healthPercent <= 66) {
      this.setBossPhase(2);
    } else if (gameState.boss.phase === 2 && healthPercent <= 33) {
      this.setBossPhase(3);
    }
    saveState(); // Salvar após verificar fase
  },

  // --- Ações de Progresso ---
  completeLevel(levelId) {
    if (!gameState.levelsCompleted.includes(levelId)) {
      gameState.levelsCompleted.push(levelId);
    }
    saveState(); // Salvar após completar nível
  },

  completeQuest(questId) {
    if (gameState.quests.hasOwnProperty(questId)) {
      gameState.quests[questId] = true;
      if (questId === 'luccaRescued') {
        this.completeLevel('acampamento');
      }
    }
    saveState(); // Salvar após completar quest
  },

  setCurrentArea(areaName) {
    gameState.currentArea = areaName;
    saveState(); // Salvar após mudar área
  },

  defeatMagnus() {
    gameState.magnusDefeated = true;
    saveState(); // Salvar após derrotar Magnus
  },

  triggerEnding(type) {
    if (!gameState.endingTriggered) {
      gameState.endingType = type;
      gameState.endingTriggered = true;
    }
    saveState(); // Salvar após acionar final
  },

  // --- UI ---
  toggleBag() {
    gameState.isBagOpen = !gameState.isBagOpen;
    saveState(); // Salvar após abrir/fechar mochila
  },

  // --- Reset ---
  resetGame() {
    Object.assign(gameState, initialState);
    localStorage.removeItem('gameState'); // Limpar localStorage
    saveState(); // Salvar estado inicial
  }
  
};
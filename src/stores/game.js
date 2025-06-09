import { reactive } from 'vue';

const CLASSES = {
  Guerreiro: {
    name: 'Guerreiro',
    description: 'Combatente equilibrado, focado em dano corpo a corpo.',
    baseStats: { attack: 12, defense: 8, speed: 10, maxHealth: 110, maxStamina: 100 },
    startItems: { weapon: 'sword_wood' }
  },
};

export const ITEMS = {
  sword_wood: { id: 'sword_wood', name: 'Espada de Madeira', type: 'Arma', slot: 'weapon', stats: { attack: 5 }, description: 'Uma espada de treino.', icon: '/icons/weapons/sword_wood.png' },
  axe_iron: { id: 'axe_iron', name: 'Machado de Ferro', type: 'Arma', slot: 'weapon', stats: { attack: 8, speed: -1 }, description: 'Pesado, mas poderoso.', icon: '/icons/weapons/axe_iron.png' },
  sword_iron: { id: 'sword_iron', name: 'Espada de Ferro', type: 'Arma', slot: 'weapon', price: 50, stats: { attack: 10 }, description: 'Uma espada básica, mas confiável.', icon: '/icons/weapons/sword_iron.png' },
  sword_mythril: { id: 'sword_mythril', name: 'Lança Rúnica', type: 'Arma', slot: 'weapon', price: 200, stats: { attack: 20 }, description: 'Aumenta o dano em +20. Forjada com magia anã.', icon: '/icons/weapons/sword_mythril.png' },
  potion_health: { id: 'potion_health', name: 'Poção de Cura', type: 'Consumível', price: 80, effect: { heal: 50 }, description: 'Restaura 50 de vida.', icon: '/icons/potions/potvida-icon.png' },
  potion_mystery: { id: 'potion_mystery', name: 'Poção Azul Misteriosa', type: 'Consumível', price: 120, effect: { mystery: true }, description: 'Um líquido enigmático que pode revelar segredos... ou não.', icon: '/icons/potions/potmystery-icon.png' },
  potion_death: { id: 'potion_death', name: 'Poção da Morte', type: 'Consumível', price: 999, effect: { heal: -999 }, description: 'Uma poção letal. Use por sua conta e risco.', icon: '/icons/potions/potmorte-icon.png' },
  potion_forbidden: { id: 'potion_forbidden', name: 'Poção Proibida', type: 'Consumível Especial', price: 500, effect: { special: 'sacrifice' }, description: 'Troca sua vida pela da princesa.', icon: '/icons/potions/potforbidden-icon.png' },
  key_ancient: { id: 'key_ancient', name: 'Chave Ancestral', type: 'Chave', description: 'Uma chave antiga das ruínas.', icon: '/icons/key_ancient.png' },
  key_ice: { id: 'key_ice', name: 'Chave de Gelo', type: 'Chave', description: 'Uma chave congelada da montanha.', icon: '/icons/key_ice.png' },
  key_fire: { id: 'key_fire', name: 'Chave de Fogo', type: 'Chave', description: 'Uma chave em brasa da caverna.', icon: '/icons/key_fire.png' },
  key_small_rusty: { id: 'key_small_rusty', name: 'Chave Pequena Enferrujada', type: 'Chave', description: 'Abre alguma porta no castelo?', icon: '/icons/key_small_rusty.png' },
};

const initialState = {
  player: {
    classe: 'Guerreiro',
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    gold: 100,
    lives: 3, // Added lives property
    inventory: [{ itemId: 'sword_wood', quantity: 1 }, { itemId: 'potion_health', quantity: 1 }],
    equipment: {
      weapon: 'sword_wood',
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
    hasRiverBlessing: true,
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
      const parsedState = JSON.parse(savedState);
      // Ensure lives is initialized if missing in saved state
      if (!parsedState.player.hasOwnProperty('lives')) {
        parsedState.player.lives = 3;
      }
      return parsedState;
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
  setPlayerClass(className) {
    if (!CLASSES[className]) return;
    const classData = CLASSES[className];
    gameState.player.classe = className;
    gameState.player.maxHealth = classData.baseStats.maxHealth;
    gameState.player.maxStamina = classData.baseStats.maxStamina;
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.stamina = gameState.player.maxStamina;
    gameState.player.lives = 3; // Reset lives when setting class
    gameState.player.inventory = [];
    gameState.player.equipment = { weapon: null, armor: null };
    for (const slot in classData.startItems) {
      const itemId = classData.startItems[slot];
      if (ITEMS[itemId]) {
        this.addItemToInventory(itemId, 1);
        this.equipItem(itemId);
      }
    }
    this.recalculateStats();
    saveState();
  },

  recalculateStats() {
    if (!gameState.player.classe) return;
    const baseStats = CLASSES[gameState.player.classe].baseStats;
    let currentStats = { ...baseStats };
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
    saveState();
  },

  addItemToInventory(itemId, quantity = 1) {
    if (!ITEMS[itemId]) return;
    const existingItem = gameState.player.inventory.find(item => item.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      gameState.player.inventory.push({ itemId, quantity });
    }
    saveState();
  },

  removeItemFromInventory(itemId, quantity = 1) {
    const itemIndex = gameState.player.inventory.findIndex(item => item.itemId === itemId);
    if (itemIndex > -1) {
      gameState.player.inventory[itemIndex].quantity -= quantity;
      if (gameState.player.inventory[itemIndex].quantity <= 0) {
        gameState.player.inventory.splice(itemIndex, 1);
      }
    }
    saveState();
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
    saveState();
  },

  unequipItem(slot) {
    const itemId = gameState.player.equipment[slot];
    if (!itemId) return;
    gameState.player.equipment[slot] = null;
    this.recalculateStats();
    saveState();
  },

  takeDamage(amount) {
    const defense = gameState.player.stats.defense || 0;
    const damageTaken = Math.max(1, amount - defense);
    gameState.player.health = Math.max(0, gameState.player.health - damageTaken);
    if (gameState.player.health === 0) {
      this.handleDeath();
    }
    saveState();
  },

  handleDeath() {
    gameState.player.lives -= 1;
    if (gameState.player.lives > 0) {
      // Respawn player with full health and stamina
      gameState.player.health = gameState.player.maxHealth;
      gameState.player.stamina = gameState.player.maxStamina;
      console.log(`Player died! Lives remaining: ${gameState.player.lives}`);
    } else {
      // Trigger game over
      gameState.endingTriggered = true;
      gameState.endingType = 'gameover';
      console.log('Game Over: No lives remaining.');
    }
    saveState();
  },

  gameOver() {
    gameState.player.health = 0;
    gameState.player.lives = 0;
    gameState.endingTriggered = true;
    gameState.endingType = 'gameover';
    saveState();
    console.log('Game Over: Player has been defeated.');
  },

  useStamina(amount) {
    gameState.player.stamina = Math.max(0, gameState.player.stamina - amount);
    saveState();
  },

  recoverStamina(amount) {
    gameState.player.stamina = Math.min(gameState.player.maxStamina, gameState.player.stamina + amount);
    saveState();
  },

  healPlayer(amount) {
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + amount);
    saveState();
  },

  restorePlayer() {
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.stamina = gameState.player.maxStamina;
    saveState();
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
    saveState();
    return used;
  },

  addGold(amount) {
    gameState.player.gold += amount;
    saveState();
  },

  removeGold(amount) {
    gameState.player.gold = Math.max(0, gameState.player.gold - amount);
    saveState();
  },

  collectKey(keyType) {
    if (keyType === 'small_rusty') {
      this.addItemToInventory('key_small_rusty', 1);
      gameState.castleState.foundSmallKey = true;
    } else if (gameState.player.keys.hasOwnProperty(keyType)) {
      gameState.player.keys[keyType] = true;
      this.addItemToInventory(`key_${keyType}`, 1);
    }
    saveState();
  },

  grantRiverBlessing() {
    gameState.player.hasRiverBlessing = true;
    saveState();
  },

  collectForbiddenPotion() {
    gameState.player.hasForbiddenPotion = true;
    saveState();
  },

  playerAttackAction() {
    if (gameState.player.stamina < 10) return { success: false, message: 'Sem stamina!' };
    this.useStamina(10);
    const attackPower = gameState.player.stats.attack || 5;
    const damage = Math.floor(Math.random() * (attackPower / 2)) + Math.floor(attackPower / 2) + 1;
    saveState();
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
    saveState();
  },

  setBossVulnerable(isVulnerable) {
    gameState.boss.isVulnerable = isVulnerable;
    saveState();
  },

  setBossPhase(phase) {
    gameState.boss.phase = phase;
    saveState();
  },

  resetBossStamina() {
    gameState.boss.stamina = gameState.boss.maxStamina;
    saveState();
  },

  drainBossStamina(amount) {
    gameState.boss.stamina = Math.max(0, gameState.boss.stamina - amount);
    if (gameState.boss.stamina === 0 && !gameState.boss.isVulnerable) {
      this.setBossVulnerable(true);
    }
    saveState();
  },

  checkBossPhaseChange() {
    const healthPercent = (gameState.boss.health / gameState.boss.maxHealth) * 100;
    if (gameState.boss.phase === 1 && healthPercent <= 66) {
      this.setBossPhase(2);
    } else if (gameState.boss.phase === 2 && healthPercent <= 33) {
      this.setBossPhase(3);
    }
    saveState();
  },

  completeLevel(levelId) {
    if (!gameState.levelsCompleted.includes(levelId)) {
      gameState.levelsCompleted.push(levelId);
    }
    saveState();
  },

  completeQuest(questId) {
    if (gameState.quests.hasOwnProperty(questId)) {
      gameState.quests[questId] = true;
      if (questId === 'luccaRescued') {
        this.completeLevel('acampamento');
      }
    }
    saveState();
  },

  setCurrentArea(areaName) {
    gameState.currentArea = areaName;
    saveState();
  },

  defeatMagnus() {
    gameState.magnusDefeated = true;
    saveState();
  },

  triggerEnding(type) {
    if (!gameState.endingTriggered) {
      gameState.endingType = type;
      gameState.endingTriggered = true;
    }
    saveState();
  },

  toggleBag() {
    gameState.isBagOpen = !gameState.isBagOpen;
    saveState();
  },

  resetGame() {
    Object.assign(gameState, initialState);
    gameState.player.lives = 3; // Ensure lives are reset
    localStorage.removeItem('gameState');
    saveState();
  }
};
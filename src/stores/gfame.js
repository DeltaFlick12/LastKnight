import { reactive } from 'vue';

// --- Definições de Dados ---

const CLASSES = {
  Guerreiro: {
    name: 'Guerreiro',
    description: 'Combatente equilibrado, focado em dano corpo a corpo.',
    baseStats: { attack: 12, defense: 8, speed: 10, maxHealth: 110, maxStamina: 100 },
    startItems: { weapon: 'sword_wood', armor: 'armor_basic' }
  },
  Arqueiro: {
    name: 'Arqueiro',
    description: 'Ágil e preciso, ataca à distância.',
    baseStats: { attack: 10, defense: 5, speed: 12, maxHealth: 90, maxStamina: 110 },
    startItems: { weapon: 'bow_used', armor: 'hat_archer' } // 'armor' aqui representa o slot de cabeça
  },
  Mago: {
    name: 'Mago',
    description: 'Utiliza poder arcano para atacar e controlar.',
    baseStats: { attack: 14, defense: 4, speed: 9, maxHealth: 85, maxStamina: 120 },
    startItems: { weapon: 'staff_old', armor: 'robe_magic' }
  },
  Shilder: { // Renomeado de 'Shilder' para 'Tank' (ou 'Defensor') para clareza?
    name: 'Defensor',
    description: 'Resistente e focado em defesa, com ataques lentos e fortes.',
    baseStats: { attack: 8, defense: 12, speed: 8, maxHealth: 130, maxStamina: 90 },
    startItems: { weapon: 'axe_iron', armor: 'armor_heavy', shield: 'shield_wood' }
  }
};

const ITEMS = {
  // Armas
  sword_wood: { id: 'sword_wood', name: 'Espada de Madeira', type: 'Arma', slot: 'weapon', stats: { attack: 5 }, description: 'Uma espada de treino.' },
  bow_used: { id: 'bow_used', name: 'Arco Usado', type: 'Arma', slot: 'weapon', stats: { attack: 4, speed: 1 }, description: 'Um arco simples e desgastado.' },
  staff_old: { id: 'staff_old', name: 'Cajado Velho', type: 'Arma', slot: 'weapon', stats: { attack: 6 }, description: 'Um cajado com marcas de uso.' },
  axe_iron: { id: 'axe_iron', name: 'Machado de Ferro', type: 'Arma', slot: 'weapon', stats: { attack: 8, speed: -1 }, description: 'Pesado, mas poderoso.' },
  sword_iron: { id: 'sword_iron', name: 'Espada de Ferro', type: 'Arma', slot: 'weapon', price: 50, stats: { attack: 10 }, description: 'Uma espada básica, mas confiável.' },
  // Armaduras (Corpo/Cabeça)
  armor_basic: { id: 'armor_basic', name: 'Armadura Básica', type: 'Armadura', slot: 'armor', stats: { defense: 3 }, description: 'Proteção simples.' },
  hat_archer: { id: 'hat_archer', name: 'Chapéu de Arqueiro', type: 'Armadura', slot: 'armor', stats: { speed: 1 }, description: 'Aumenta a agilidade.' },
  robe_magic: { id: 'robe_magic', name: 'Manto Mágico', type: 'Armadura', slot: 'armor', stats: { maxStamina: 10 }, description: 'Aumenta a reserva de energia.' },
  armor_heavy: { id: 'armor_heavy', name: 'Armadura Pesada', type: 'Armadura', slot: 'armor', stats: { defense: 8, speed: -2 }, description: 'Muito resistente, mas lenta.' },
  armor_leather: { id: 'armor_leather', name: 'Armadura de Couro', type: 'Armadura', slot: 'armor', price: 75, stats: { defense: 5 }, description: 'Oferece proteção modesta.' },
  // Escudos
  shield_wood: { id: 'shield_wood', name: 'Escudo de Madeira', type: 'Escudo', slot: 'shield', price: 40, stats: { defense: 2 }, description: 'Um escudo simples para defesa.' },
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

// --- Estado Global --- 
export const gameState = reactive({
  // Estado do Jogador
  player: {
    classe: null, // String com o nome da classe (ex: 'Guerreiro')
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    gold: 50, // Ouro inicial
    inventory: [], // Array de objetos de item (ex: { itemId: 'potion_health_small', quantity: 3 })
    equipment: {
      weapon: null, // itemId
      armor: null,  // itemId
      shield: null, // itemId
    },
    stats: { // Stats base + modificadores de classe/equipamento
        attack: 10,
        defense: 5,
        speed: 10,
    },
    keys: { // Chaves principais para o portão do castelo
      ancestral: false,
      ice: false,
      fire: false
    },
    hasRiverBlessing: false,
    hasForbiddenPotion: false, // Indica se comprou/possui a poção
  },

  // Estado do Chefe Final (Magnus)
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

  // Progresso do Jogo
  currentArea: 'CutsceneInicial', // Começa com a cutscene
  levelsCompleted: [], // Guarda IDs de níveis/eventos chave concluídos
  quests: { // Rastreamento de quests
      mainQuestStep: 0, // Exemplo de acompanhamento da quest principal
      luccaRescued: false,
  },
  castleState: { // Estado persistente de puzzles/itens no castelo
      leverPulled: false,
      foundSmallKey: false,
      crossedBridge: false,
      finalDoorOpened: false
  },
  magnusDefeated: false,
  endingTriggered: false, // Para evitar múltiplos finais
  endingType: null, // 'Sacrificio', 'Tragico'

  // Outros estados
  isBagOpen: false,
  currentDialog: null, // Para diálogos globais ou complexos
});

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
    gameState.player.health = gameState.player.maxHealth; // Começa com vida cheia
    gameState.player.stamina = gameState.player.maxStamina;

    // Limpar inventário e equipamento antes de adicionar itens iniciais
    gameState.player.inventory = [];
    gameState.player.equipment = { weapon: null, armor: null, shield: null };

    // Adicionar e equipar itens iniciais
    for (const slot in classData.startItems) {
      const itemId = classData.startItems[slot];
      if (ITEMS[itemId]) {
        this.addItemToInventory(itemId, 1);
        this.equipItem(itemId);
      }
    }
    this.recalculateStats(); // Calcular stats finais após equipar
  },

  recalculateStats() {
    if (!gameState.player.classe) return;
    const baseStats = CLASSES[gameState.player.classe].baseStats;
    let currentStats = { ...baseStats }; // Começa com stats da classe

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
    // Ajustar maxHealth/maxStamina se os equipamentos os modificarem
    gameState.player.maxHealth = currentStats.maxHealth;
    gameState.player.maxStamina = currentStats.maxStamina;
    // Garantir que health/stamina atuais não excedam os novos máximos
    gameState.player.health = Math.min(gameState.player.health, gameState.player.maxHealth);
    gameState.player.stamina = Math.min(gameState.player.stamina, gameState.player.maxStamina);
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
  },

  removeItemFromInventory(itemId, quantity = 1) {
    const itemIndex = gameState.player.inventory.findIndex(item => item.itemId === itemId);
    if (itemIndex > -1) {
      gameState.player.inventory[itemIndex].quantity -= quantity;
      if (gameState.player.inventory[itemIndex].quantity <= 0) {
        gameState.player.inventory.splice(itemIndex, 1);
      }
    }
  },

  equipItem(itemId) {
    const itemData = ITEMS[itemId];
    if (!itemData || !itemData.slot) return;

    // Desequipa item atual no slot, se houver
    const currentItemInSlot = gameState.player.equipment[itemData.slot];
    if (currentItemInSlot) {
      this.unequipItem(itemData.slot);
    }

    // Equipa o novo item
    gameState.player.equipment[itemData.slot] = itemId;
    // Não remove do inventário ao equipar, apenas marca como equipado
    // this.removeItemFromInventory(itemId, 1); // Opcional: remover se inventário não mostrar equipados
    this.recalculateStats();
  },

  unequipItem(slot) {
    const itemId = gameState.player.equipment[slot];
    if (!itemId) return;

    gameState.player.equipment[slot] = null;
    // this.addItemToInventory(itemId, 1); // Opcional: adicionar de volta se removido ao equipar
    this.recalculateStats();
  },

  // --- Ações do Jogador ---
  takeDamage(amount) {
    const defense = gameState.player.stats.defense || 0;
    const damageTaken = Math.max(1, amount - defense); // Garante pelo menos 1 de dano
    gameState.player.health = Math.max(0, gameState.player.health - damageTaken);
    if (gameState.player.health === 0) {
      // Lógica de Game Over
      console.log("Game Over");
      // Chamar função de game over
    }
  },

  useStamina(amount) {
    // Considerar modificador de velocidade/peso?
    gameState.player.stamina = Math.max(0, gameState.player.stamina - amount);
  },

  recoverStamina(amount) {
    gameState.player.stamina = Math.min(gameState.player.maxStamina, gameState.player.stamina + amount);
  },

  healPlayer(amount) {
     gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + amount);
  },

  restorePlayer() { // Usado na Igreja
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.stamina = gameState.player.maxStamina;
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
      // Adicionar outros efeitos (buffs, etc.)
    } else if (itemData.type === 'Consumível Especial' && itemData.effect?.special === 'sacrifice') {
        // A lógica do sacrifício acontece na cena final
        console.log("Poção Proibida selecionada para uso...");
        // Não remove ainda, apenas marca a intenção?
        used = true; // Indica que a intenção foi registrada
    }

    if (used && itemData.type !== 'Consumível Especial') { // Não remove a proibida aqui
      this.removeItemFromInventory(itemId, 1);
    }
    return used;
  },

  addGold(amount) {
    gameState.player.gold += amount;
  },

  collectKey(keyType) { // 'ancestral', 'ice', 'fire', 'small_rusty'
    if (keyType === 'small_rusty') {
        this.addItemToInventory('key_small_rusty', 1);
        gameState.castleState.foundSmallKey = true; // Atualiza estado do puzzle
    } else if (gameState.player.keys.hasOwnProperty(keyType)) {
      gameState.player.keys[keyType] = true;
      this.addItemToInventory(`key_${keyType}`, 1); // Adiciona ao inventário visual
    }
  },

  grantRiverBlessing() {
    gameState.player.hasRiverBlessing = true;
  },

  collectForbiddenPotion() {
    // Apenas marca que comprou/possui, o item é adicionado via addItemToInventory
    gameState.player.hasForbiddenPotion = true;
  },

  // --- Ações de Combate (Simplificado) ---
  playerAttackAction() {
    if (gameState.player.stamina < 10) return { success: false, message: 'Sem stamina!' }; // Custo base
    this.useStamina(10);
    const attackPower = gameState.player.stats.attack || 5;
    const damage = Math.floor(Math.random() * (attackPower / 2)) + Math.floor(attackPower / 2) + 1;
    return { success: true, damage: damage, message: `Você ataca com ${gameState.player.equipment.weapon || 'punhos'}!` };
  },

  // --- Ações do Chefe (Magnus) ---
  damageBoss(amount) {
    if (gameState.boss.isVulnerable) {
      gameState.boss.health = Math.max(0, gameState.boss.health - amount);
      this.checkBossPhaseChange();
      if (gameState.boss.health === 0) {
          this.defeatMagnus();
      }
    }
  },
  setBossVulnerable(isVulnerable) {
    gameState.boss.isVulnerable = isVulnerable;
  },
  setBossPhase(phase) {
    gameState.boss.phase = phase;
  },
  resetBossStamina() {
    gameState.boss.stamina = gameState.boss.maxStamina;
  },
  drainBossStamina(amount) {
    gameState.boss.stamina = Math.max(0, gameState.boss.stamina - amount);
    if (gameState.boss.stamina === 0 && !gameState.boss.isVulnerable) {
      this.setBossVulnerable(true);
      // Iniciar timer para recuperação no componente da batalha
    }
  },
  checkBossPhaseChange() {
    const healthPercent = (gameState.boss.health / gameState.boss.maxHealth) * 100;
    if (gameState.boss.phase === 1 && healthPercent <= 66) {
      this.setBossPhase(2);
    } else if (gameState.boss.phase === 2 && healthPercent <= 33) {
      this.setBossPhase(3);
    }
  },

  // --- Ações de Progresso ---
  completeLevel(levelId) {
    if (!gameState.levelsCompleted.includes(levelId)) {
      gameState.levelsCompleted.push(levelId);
    }
  },
  completeQuest(questId) {
    if (gameState.quests.hasOwnProperty(questId)) {
      gameState.quests[questId] = true;
      if (questId === 'luccaRescued') {
          this.completeLevel('acampamento'); // Marca nível completo após resgate
      }
    }
  },
  setCurrentArea(areaName) {
    gameState.currentArea = areaName;
  },

  defeatMagnus() {
    gameState.magnusDefeated = true;
    // A determinação do final será feita na EndingScene com base no estado
  },

  triggerEnding(type) { // 'Sacrificio' ou 'Tragico'
    if (!gameState.endingTriggered) {
        gameState.endingType = type;
        gameState.endingTriggered = true;
    }
  },

  // --- UI ---
  toggleBag() {
    gameState.isBagOpen = !gameState.isBagOpen;
  },

  // --- Reset --- 
  resetGame() {
     // Resetar todo o estado para o inicial
     // (Implementação detalhada necessária)
     Object.assign(gameState, {
        // ... recriar estado inicial ...
     });
  }
};


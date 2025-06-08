import { defineStore } from 'pinia';

// Suponho que você tenha um objeto ITEMS em algum lugar para dados dos itens
// Se não tiver, precisa importar ou definir ele no contexto deste store
// Exemplo: import { ITEMS } from '@/data/items'; (ajuste conforme necessário)

export const useGameState = defineStore('gameState', {
  state: () => ({
    player: {
      name: null,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      gold: 100,
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
      },
      hasForbiddenPotion: false,
      relicsCollected: 0,
      classe: null,
      firstTimeChurch: true,
      keys: {
        ancestral: false,
        ice: false,
        fire: false,
      },
    },
    boss: {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      isVulnerable: false,
      phase: 1,
    },
    ending: null,
  }),

  getters: {
    isPlayerAlive: (state) => state.player.health > 0,
    isBossAlive: (state) => state.boss.health > 0,
    isPlayerStaminaFull: (state) => state.player.stamina >= state.player.maxStamina,
    isBossStaminaFull: (state) => state.boss.stamina >= state.boss.maxStamina,
    getItemQuantity: (state) => (itemId) => {
      const item = state.player.inventory.find((i) => i.itemId === itemId);
      return item ? item.quantity : 0;
    },
  },

  actions: {
    // Existing actions
    damagePlayer(amount) {
      this.player.health = Math.max(0, this.player.health - amount);
    },
    damageBoss(amount) {
      this.boss.health = Math.max(0, this.boss.health - amount);
    },
    useStamina(amount) {
      this.player.stamina = Math.max(0, this.player.stamina - amount);
    },
    restoreStamina(amount) {
      this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + amount);
    },
    drainBossStamina(amount) {
      this.boss.stamina = Math.max(0, this.boss.stamina - amount);
    },
    restoreBossStamina() {
      this.boss.stamina = this.boss.maxStamina;
    },
    markFinalBossDefeated() {
      this.boss.health = 0;
      this.ending = 3;
    },
    setEnding(type) {
      this.ending = type;
    },
    setPlayerClass(classe) {
      this.player.classe = classe;
    },
    equipItem(itemId) {
      const item = this.player.inventory.find((i) => i.itemId === itemId);
      if (!item) return;

      const itemData = ITEMS[itemId];
      if (!itemData || !itemData.slot) return;

      const slot = itemData.slot;
      const currentEquipped = this.player.equipment[slot];

      if (currentEquipped) {
        this.addItem(currentEquipped, 1);
      }

      this.player.equipment[slot] = itemId;
      this.removeItem(itemId, 1);
    },
    unequipItem(slot) {
      const equippedItem = this.player.equipment[slot];
      if (!equippedItem) return;

      this.addItem(equippedItem, 1);
      this.player.equipment[slot] = null;
    },
    useItem(itemId) {
      if (!this.isPlayerAlive) return false;

      const index = this.player.inventory.findIndex((i) => i.itemId === itemId && i.quantity > 0);
      if (index === -1) return false;

      const item = this.player.inventory[index];
      const itemData = ITEMS[itemId];

      if (!itemData || (itemData.type !== 'Consumível' && itemData.type !== 'Consumível Especial')) return false;

      if (itemData.effect) {
        itemData.effect(this);
      }

      item.quantity -= 1;
      if (item.quantity <= 0) {
        this.player.inventory.splice(index, 1);
      }

      return true;
    },
    addGold(amount) {
      this.player.gold += amount;
    },
    removeGold(amount) {
      this.player.gold = Math.max(0, this.player.gold - amount);
    },
    addItem(itemId, quantity = 1) {
      const item = this.player.inventory.find((i) => i.itemId === itemId);
      if (item) {
        item.quantity += quantity;
      } else {
        this.player.inventory.push({ itemId, quantity });
      }
    },
    removeItem(itemId, quantity = 1) {
      const item = this.player.inventory.find((i) => i.itemId === itemId);
      if (!item) return;

      item.quantity -= quantity;
      if (item.quantity <= 0) {
        const index = this.player.inventory.findIndex((i) => i.itemId === itemId);
        if (index !== -1) {
          this.player.inventory.splice(index, 1);
        }
      }
    },
    hasItem(itemId) {
      return this.player.inventory.some((i) => i.itemId === itemId && i.quantity > 0);
    },

    // New actions for player name and class
    initializePlayerName() {
      const storedName = localStorage.getItem('playerName');
      if (storedName) {
        this.player.name = storedName;
        console.log('Initialized player name:', storedName); // Debug
      } else {
        console.log('No stored player name found');
      }
    },
    setPlayerName(name) {
      this.player.name = name;
      localStorage.setItem('playerName', name);
      console.log('Set player name:', name); // Debug
    },
    setPlayerClass(classe) {
      this.player.classe = classe;
      localStorage.setItem('playerClass', classe);
      console.log('Set player class:', classe); // Debug
    },
  },
});
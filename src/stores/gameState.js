import { defineStore } from 'pinia';

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

  actions: {
    // Dano e recuperação
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

    // Finais
    markFinalBossDefeated() {
      this.boss.health = 0;
      this.ending = 3;
    },
    setEnding(type) {
      this.ending = type;
    },

    // Classe
    setPlayerClass(classe) {
      this.player.classe = classe;
    },

    // Equipar item
    equipItem(itemId) {
      const item = this.player.inventory.find(i => i.itemId === itemId);
      if (!item) return;

      const itemData = ITEMS[itemId];
      if (!itemData || !itemData.slot) return;

      this.player.equipment[itemData.slot] = itemId;
    },

    // Usar item
    useItem(itemId) {
      const index = this.player.inventory.findIndex(i => i.itemId === itemId && i.quantity > 0);
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

    // Modificar ouro
    addGold(amount) {
      this.player.gold += amount;
    },
    removeGold(amount) {
      this.player.gold = Math.max(0, this.player.gold - amount);
    },

    // Manipular inventário
    addItem(itemId, quantity = 1) {
      const item = this.player.inventory.find(i => i.itemId === itemId);
      if (item) {
        item.quantity += quantity;
      } else {
        this.player.inventory.push({ itemId, quantity });
      }
    },
  },
});

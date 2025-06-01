import { defineStore } from 'pinia';

export const useGameState = defineStore('gameState', {
  state: () => ({
    player: {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      gold: 100,
      inventory: [],
      hasForbiddenPotion: false,
      relicsCollected: 0
    },
    boss: {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      isVulnerable: false,
      phase: 1
    },
    ending: null
  }),
  actions: {
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
    }
  }
});
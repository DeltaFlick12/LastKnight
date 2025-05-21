<template>
  <div class="battle-container">
    <div class="battle-grid">
      <!-- Status -->
      <div class="game-status-top">
        <div v-if="isPlayerTurn">SUA VEZ! Selecione um inimigo para atacar</div>
        <div v-else>VEZ DOS INIMIGOS! Prepare-se para defender</div>
      </div>

      <!-- Jogador -->
      <div class="unit player" :class="{ 'is-damaging': damagedPlayer }"
           :style="{ top: playerTop + 'px', left: playerLeft + 'px' }">
        🧙‍♂️
        <div class="hp-bar">
          <div class="hp" :style="{ width: playerHp + '%' }"></div>
        </div>
      </div>

      <!-- Inimigos -->
      <div v-for="(enemy, index) in enemies" :key="'enemy-' + index">
        <div class="unit-enemy enemy" :style="{ top: enemy.top + 'px', left: enemy.left + 'px' }"
             :class="{ 'is-damaging': damagedEnemy === index }">
          😈
        </div>
        <div class="hp-bar-enemy" 
             :style="{ top: (enemy.top + 50) + 'px', left: (enemy.left - 30) + 'px' }">
          <div class="hp-enemy" :style="{ width: enemy.hp + '%' }"></div>
        </div>
        <div v-if="enemy.hp > 0" class="enemy-clickable-area"
             :class="{ 'enemy-selected': selectedEnemy === index }"
             :style="{ top: initialEnemyPositions[index].top + 'px', left: initialEnemyPositions[index].left + 'px' }"
             @click="selectEnemy(index)">
          <div v-if="selectedEnemy === index" class="selected-marker">🎯</div>
        </div>
      </div>

      <!-- Popup de dano flutuante -->
      <div v-if="damagePopup.active" 
           class="damage-popup" 
           :class="{ 'player-damage': damagePopup.isPlayer, 'enemy-damage': !damagePopup.isPlayer }"
           :style="{ top: damagePopup.top + 'px', left: damagePopup.left + 'px' }">
        -{{ damagePopup.value }}
      </div>

      <!-- Áreas de posicionamento -->
      <div class="blue-area"></div>
      <div class="red-area-1"></div>
      <div class="red-area-2"></div>
      <div class="red-area-3"></div>
    </div>

    <!-- Botões principais -->
    <div class="actions">
      <button @click="abrirMenu('ataque')">Atacar</button>
      <button @click="abrirMenu('inventario')">Inventário</button>
    </div>

    <!-- Botões de ataque -->
    <div class="actions" v-if="menuAtual === 'ataque'">
      <button class="attack-btn weak-attack" :disabled="btnDisabled" @click="attack(10)">Ataque Fraco</button>
      <button class="attack-btn medium-attack" :disabled="btnDisabled" @click="attack(20)">Ataque Médio</button>
      <button class="attack-btn strong-attack" :disabled="btnDisabled" @click="attack(30)">Ataque Forte</button>
    </div>

    <!-- Botões de inventário -->
    <div class="actions" v-if="menuAtual === 'inventario'">
      <button class="attack-btn" :disabled="poções[20] <= 0" @click="usarPocao(20)">Poção +20 ({{ poções[20] }})</button>
      <button class="attack-btn" :disabled="poções[50] <= 0" @click="usarPocao(50)">Poção +50 ({{ poções[50] }})</button>
      <button class="attack-btn" :disabled="poções[100] <= 0" @click="usarPocao(100)">Poção Total ({{ poções[100] }})</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BattleWithInventory',
  data() {
    return {
      playerTop: 220,
      playerLeft: 100,
      playerHp: 100,

      initialEnemyPositions: [
        { top: 140, left: 640 },
        { top: 320, left: 640 },
        { top: 500, left: 640 },
      ],

      enemies: [
        { hp: 100, top: 140, left: 640 },
        { hp: 100, top: 320, left: 640 },
        { hp: 100, top: 500, left: 640 },
      ],

      selectedEnemy: null,
      damagedEnemy: null,
      damagedPlayer: false,
      attackCount: 0,
      isPlayerTurn: true,
      isAttacking: false,

      damagePopup: {
        active: false,
        value: 0,
        top: 0,
        left: 0,
        isPlayer: false,
      },

      menuAtual: null, // 'ataque' ou 'inventario'

      poções: {
        20: 3,
        50: 3,
        100: 3,
      },
    };
  },
  computed: {
    btnDisabled() {
      return (
        !this.isPlayerTurn ||
        this.selectedEnemy === null ||
        this.enemies[this.selectedEnemy]?.hp <= 0 ||
        this.isAttacking ||
        this.playerHp <= 0
      );
    },
  },
  methods: {
    abrirMenu(menu) {
      this.menuAtual = this.menuAtual === menu ? null : menu;
    },

    usarPocao(valor) {
      if (!this.isPlayerTurn || this.isAttacking || this.playerHp <= 0) return;
      if (this.poções[valor] <= 0) return;

      this.playerHp = Math.min(100, this.playerHp + valor);
      this.poções[valor]--;
      this.menuAtual = null;
    },

    selectEnemy(index) {
      if (
        this.isPlayerTurn &&
        this.playerHp > 0 &&
        !this.isAttacking &&
        this.enemies[index].hp > 0
      ) {
        this.selectedEnemy = index;
      }
    },

    showDamagePopup(value, top, left, isPlayer = false) {
      this.damagePopup = {
        active: true,
        value,
        top,
        left,
        isPlayer,
      };
      setTimeout(() => {
        this.damagePopup.active = false;
      }, 1000);
    },

    async attack(damage) {
      if (this.btnDisabled) return;

      this.isAttacking = true;
      const enemy = this.enemies[this.selectedEnemy];

      const startTop = this.playerTop;
      const startLeft = this.playerLeft;

      this.playerTop = enemy.top;
      this.playerLeft = enemy.left - 100;
      await this.sleep(400);

      this.damagedEnemy = this.selectedEnemy;
      enemy.hp = Math.max(0, enemy.hp - damage);
      this.showDamagePopup(damage, enemy.top, enemy.left, false);
      await this.sleep(200);
      this.damagedEnemy = null;

      this.playerTop = startTop;
      this.playerLeft = startLeft;

      this.selectedEnemy = null;
      this.attackCount++;
      this.menuAtual = null;

      if (this.attackCount >= 3) {
        this.attackCount = 0;
        this.isPlayerTurn = false;
        await this.sleep(500);
        await this.enemyTurn();
      }
      this.isAttacking = false;
    },

    async enemyTurn() {
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;

        const origTop = enemy.top;
        const origLeft = enemy.left;

        enemy.top = this.playerTop;
        enemy.left = this.playerLeft + 100;
        await this.sleep(400);

        this.damagedPlayer = true;
        this.playerHp = Math.max(0, this.playerHp - 10);
        this.showDamagePopup(10, this.playerTop, this.playerLeft, true);
        await this.sleep(200);
        this.damagedPlayer = false;

        enemy.top = origTop;
        enemy.left = origLeft;
        await this.sleep(400);
      }
      this.isPlayerTurn = true;
    },

    sleep(ms) {
      return new Promise(r => setTimeout(r, ms));
    },
  },
};
</script>


<style scoped>

.battle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(to bottom, #0a3614, #06240f);
  box-sizing: border-box;
}

.battle-grid {
  position: relative;
  width: 90vw;
  max-width: 800px;
  height: 70vh;
  max-height: 600px;
  margin-top: 5vh;
  margin-bottom: 20px;
  border: 2px solid #fff;
  background: #222;
  border-radius: 12px;
  overflow: hidden;
}

.unit {
  position: absolute;
  width: 80px;
  height: 80px;
  font-size: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: top 0.4s ease, left 0.4s ease;
  user-select: none;
}

.unit-enemy {
  position: absolute;
  width: 0px;
  height: 0px;
  font-size: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: top 0.4s ease, left 0.4s ease;
  user-select: none;
  /* centraliza o emoji usando translate */
  transform: translate(-50%, -50%);
}

.player {
  z-index: 5;
}

.enemy {
  z-index: 2;
}

/* Barra de vida do inimigo - posicionada fora do emoji */
.hp-bar-enemy {
  position: absolute;
  width: 60px;
  height: 8px;
  border: 1px solid #000;
  background: #400;
  margin-top: -20px;
  z-index: 3;
}

.hp-enemy {
  height: 100%;
  background: red;
  transition: width 0.3s;
}

/* Barra de vida do jogador */
.hp-bar {
  width: 60px;
  height: 8px;
  border: 1px solid #000;
  margin-top: 4px;
  background: rgb(18, 54, 1);
}

.hp {
  height: 100%;
  background: rgb(5, 255, 67);
  transition: width 0.3s;
}

/* Área de clique */
.enemy-clickable-area {
  position: absolute;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 20px;
  background: rgba(255, 0, 0, 0.1);
  z-index: 3;
  transition: all 0.2s ease;
  transform: translate(-50%, -50%);
}

.enemy-clickable-area:hover {
  background: rgba(255, 0, 0, 0.116);
  transform: translate(-50%, -50%) scale(1.05);
}

.enemy-selected {
  box-shadow: 0 0 20px 8px rgba(255, 255, 0, 0.377);
  background: rgba(255, 215, 0, 0.2);
  border: 3px solid rgba(255, 255, 0, 0.452);
}

/* Marcador de seleção */
.selected-marker {
  font-size: 24px;
  color: yellow;
  position: absolute;
  top: -25px;
  animation: bounce 0.8s infinite alternate;
}

@keyframes bounce {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-10px);
  }
}

/* Status, botões e efeitos */
.game-status-top {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  z-index: 20;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.attack-btn {
  margin: 5px;
  padding: 15px 30px;
  font-size: 1.4rem;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  transition: all 0.2s;
}

.weak-attack {
  background: #4caf50;
}

.medium-attack {
  background: #2196f3;
}

.strong-attack {
  background: #f44336;
}

.attack-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.attack-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.player.is-damaging,
.enemy.is-damaging {
  animation: damageFlash 0.2s alternate 3;
}

@keyframes damageFlash {
  from {
    filter: brightness(1);
  }
  to {
    filter: brightness(2.5) saturate(2);
  }
}

/* Áreas coloridas */
.blue-area,
.red-area-1,
.red-area-2,
.red-area-3 {
  position: absolute;
  width: 140px;
  height: 140px;
  border: 2px solid;
  z-index: 1;
}

.blue-area {
  background: rgba(0, 255, 255, 0.3);
  top: 190px;
  left: 70px;
  border-color: cyan;
}

.red-area-1 {
  background: rgba(200, 0, 0, 0.3);
  top: 70px;
  left: 570px;
  border-color: darkred;
}

.red-area-2 {
  background: rgba(200, 0, 0, 0.3);
  top: 250px;
  left: 570px;
  border-color: darkred;
}

.red-area-3 {
  background: rgba(200, 0, 0, 0.3);
  top: 430px;
  left: 570px;
  border-color: darkred;
}

/* Popup dano flutuante */
.damage-popup {
  position: absolute;
  font-size: 24px;
  font-weight: bold;
  color: red;
  user-select: none;
  animation: floatUpFade 1s forwards;
  pointer-events: none;
  transform: translate(-50%, 0);
  z-index: 10;
}

.player-damage {
  color: rgb(255, 255, 255); /* verde para dano no player */
}

.enemy-damage {
  color: rgb(255, 255, 255); /* vermelho para dano no inimigo */
}

@keyframes floatUpFade {
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -40px);
  }
}
</style>


<style scoped>


.hud {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.battle-box {
  background-color: rgba(0, 0, 0, 0.5);
  padding: 20px;
  border: 2px solid #8b5e3c;
  border-radius: 12px;
  max-width: 500px;
  margin: auto;
  text-align: center;
}

.enemy h2 {
  margin-bottom: 5px;
}

.actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
}

button {
  background-color: #8b5e3c;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.log {
  font-size: 12px;
  margin-top: 10px;
}
</style>

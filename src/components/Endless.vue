<template>
  <div class="medieval-battle-container">
    <div class="battle-arena">

      <!-- Status Superior -->
      <div class="game-status-top">
        <div v-if="!gameOver && !victory">{{ battleStatus }}</div>
        <div v-if="victory" class="victory-message">VITÓRIA! Você derrotou todos os inimigos!</div>
        <div v-if="gameOver" class="game-over-message">DERROTA! Você sucumbiu aos perigos...</div>
      </div>

      <!-- Personagem do Jogador -->
      <div class="character-info player-info">
        <span class="character-name">{{ playerCharacter.name }} ({{ playerCharacter.className }})</span>
        <div class="resource-bar-container">
          <div class="hp-bar-label">HP:</div>
          <div class="hp-bar">
            <div class="hp" :style="{ width: playerCharacter.hpPercent + '%' }"></div>
          </div>
          <span class="resource-value">{{ playerCharacter.currentHp }}/{{ playerCharacter.maxHp }}</span>
        </div>
         <div class="resource-bar-container">
          <div class="stamina-bar-label">SP:</div>
          <div class="stamina-bar">
            <div class="stamina" :style="{ width: playerCharacter.staminaPercent + '%' }"></div>
          </div>
          <span class="resource-value">{{ playerCharacter.currentStamina }}/{{ playerCharacter.maxStamina }}</span>
        </div>
      </div>
      <div
        class="unit player-character"
        :class="{ 'is-attacking': playerAttacking, 'is-damaged': damagedPlayer }"
        :style="{ top: playerCharacter.top + 'px', left: playerCharacter.left + 'px' }"
      >
        ⚔️ <!-- Representação do Guerreiro -->
      </div>

      <!-- Inimigos -->
      <div v-for="(enemy, index) in enemies" :key="'enemy-' + index">
        <div v-if="enemy.hpPercent > 0">
          <div class="character-info enemy-info" :style="{ top: (initialEnemyPositions[index].top - 70) + 'px', left: (initialEnemyPositions[index].left - 60) + 'px' }">
            <span class="character-name">{{ enemy.name }}</span>
            <div class="resource-bar-container">
              <div class="hp-bar-label">HP:</div>
              <div class="hp-bar enemy-hp-bar">
                <div class="hp enemy-hp" :style="{ width: enemy.hpPercent + '%' }"></div>
              </div>
               <span class="resource-value">{{ enemy.currentHp }}/{{ enemy.maxHp }}</span>
            </div>
          </div>
          <div
            class="unit enemy-character"
            :class="{ 'is-attacking': enemyAttacking === index, 'is-damaged': damagedEnemy === index }"
            :style="{ top: enemy.top + 'px', left: enemy.left + 'px' }"
          >
            🐺 <!-- Representação do Lobo -->
          </div>
          <div
            v-if="enemy.hpPercent > 0 && isPlayerTurn && !isAttacking"
            class="enemy-clickable-area"
            :class="{ 'enemy-selected': selectedEnemy === index }"
            :style="{ top: initialEnemyPositions[index].top + 'px', left: initialEnemyPositions[index].left + 'px' }"
            @click="selectEnemy(index)"
          >
            <div v-if="selectedEnemy === index" class="selected-marker">🎯</div>
          </div>
        </div>
         <div v-else class="unit enemy-character fainted" :style="{ top: initialEnemyPositions[index].top + 'px', left: initialEnemyPositions[index].left + 'px' }">
            🐺
         </div>
      </div>

      <!-- Popup de Dano -->
      <div
        v-if="damagePopup.active"
        class="damage-popup"
        :class="damagePopup.type"
        :style="{ top: damagePopup.top + 'px', left: damagePopup.left + 'px' }"
      >
        {{ damagePopup.prefix }}{{ damagePopup.value }}
      </div>

      <!-- Efeito de Ataque -->
      <div v-if="attackEffect.active" class="attack-effect" :style="attackEffect.style">💥</div>

    </div>

    <!-- Caixa de Diálogo/Log -->
    <div class="battle-log-container">
      <div class="battle-log">
        <p v-for="(message, index) in battleLog" :key="index" v-html="message"></p> <!-- Use v-html for potential styling -->
      </div>
      <div class="actions" v-if="isPlayerTurn && !isAttacking && !gameOver && !victory">
         <button
            v-for="(skill, key) in playerCharacter.skills"
            :key="key"
            class="action-btn skill-btn"
            :class="'skill-type-' + skill.type"
            :disabled="btnDisabled(skill.staminaCost)"
            @click="useSkill(key)"
            v-tooltip="'Custo: ' + skill.staminaCost + ' SP'"
          >
            {{ skill.name }} ({{ skill.power }})
          </button>
          <!-- Add Defend/Item buttons later if needed -->
      </div>
       <div class="actions-placeholder" v-else>
        <!-- Placeholder or message when actions are unavailable -->
        Aguarde...
      </div>
    </div>

  </div>
</template>

<script>
// Simple tooltip directive (optional, or use a library)
const tooltip = {
  mounted(el, binding) {
    el.setAttribute('data-tooltip', binding.value);
    el.style.position = 'relative';
    el.addEventListener('mouseenter', () => {
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip-text';
      tooltipEl.textContent = el.getAttribute('data-tooltip');
      el.appendChild(tooltipEl);
    });
    el.addEventListener('mouseleave', () => {
      const tooltipEl = el.querySelector('.tooltip-text');
      if (tooltipEl) {
        el.removeChild(tooltipEl);
      }
    });
  },
  unmounted(el) {
     const tooltipEl = el.querySelector('.tooltip-text');
      if (tooltipEl) {
        el.removeChild(tooltipEl);
      }
      // Remove listeners if necessary, though Vue handles most cleanup
  }
};

export default {
  name: "MedievalBattle",
  directives: { tooltip },
  data() {
    return {
      playerCharacter: {
        name: "Herói", // Placeholder, could be user input
        className: "Guerreiro",
        hpPercent: 100,
        currentHp: 100,
        maxHp: 100,
        staminaPercent: 100,
        currentStamina: 50,
        maxStamina: 50,
        staminaRegen: 5, // SP regenerated per turn
        top: 300,
        left: 150,
        skills: {
          quickSlash: { name: "Corte Rápido", power: 15, staminaCost: 5, type: "physical" },
          heavyStrike: { name: "Golpe Pesado", power: 25, staminaCost: 15, type: "physical" },
          shieldBash: { name: "Investida c/ Escudo", power: 10, staminaCost: 10, type: "physical" }, // Example
        },
      },
      initialEnemyPositions: [
        { top: 150, left: 650 },
        { top: 350, left: 700 },
        // { top: 500, left: 650 }, // Start with 2 wolves
      ],
      enemies: [
        { name: "Lobo Cinzento", hpPercent: 100, currentHp: 60, maxHp: 60, top: 150, left: 650, attacks: [{ name: "Mordida Feroz", power: 12 }] },
        { name: "Lobo Negro", hpPercent: 100, currentHp: 70, maxHp: 70, top: 350, left: 700, attacks: [{ name: "Arranhão", power: 10 }] },
        // { name: "Lobo Alfa", hpPercent: 100, currentHp: 90, maxHp: 90, top: 500, left: 650, attacks: [{ name: "Uivo Intimidador", power: 5 }, { name: "Mordida Alfa", power: 15 }] },
      ],
      selectedEnemy: null,
      damagedEnemy: null,
      damagedPlayer: false,
      playerAttacking: false,
      enemyAttacking: null, // Index of attacking enemy
      isPlayerTurn: true,
      isAttacking: false, // General flag to prevent actions during animations
      battleLog: ["Uma batalha começa na floresta sombria!"],
      battleStatus: "Escolha uma ação, Guerreiro!",
      gameOver: false,
      victory: false,
      damagePopup: {
        active: false,
        value: 0,
        top: 0,
        left: 0,
        type: 'enemy-damage', // 'enemy-damage', 'player-damage', 'stamina-cost', 'stamina-regen'
        prefix: '-'
      },
      attackEffect: {
        active: false,
        style: {},
      },
    };
  },
  computed: {
    // Combined disabled check for buttons
    btnDisabled() {
      return (skillCost) => {
          return (
            !this.isPlayerTurn ||
            this.selectedEnemy === null ||
            this.enemies[this.selectedEnemy]?.hpPercent <= 0 ||
            this.isAttacking ||
            this.playerCharacter.hpPercent <= 0 ||
            this.playerCharacter.currentStamina < skillCost || // Check stamina
            this.gameOver ||
            this.victory
          );
      }
    },
  },
  methods: {
    addLogMessage(message) {
      this.battleLog.push(message);
      if (this.battleLog.length > 10) { // Keep log size manageable
          this.battleLog.shift();
      }
      this.$nextTick(() => {
        const logContainer = this.$el.querySelector('.battle-log');
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
      });
    },

    selectEnemy(index) {
      if (this.isPlayerTurn && !this.isAttacking && this.enemies[index].hpPercent > 0) {
        this.selectedEnemy = index;
        this.battleStatus = `Atacar ${this.enemies[index].name}? Escolha uma Habilidade!`
        this.addLogMessage(`<i>${this.enemies[index].name} selecionado como alvo.</i>`);
      }
    },

    showPopup(value, targetElement, type = 'enemy-damage') {
        const rect = targetElement.getBoundingClientRect();
        const containerRect = this.$el.querySelector('.battle-arena').getBoundingClientRect();
        let prefix = '-';
        if (type === 'stamina-regen' || type === 'hp-heal') prefix = '+';
        if (type === 'stamina-cost') prefix = '-';

        this.damagePopup = {
            active: true,
            value,
            top: rect.top - containerRect.top + rect.height / 2 - 15,
            left: rect.left - containerRect.left + rect.width / 2,
            type: type,
            prefix: prefix
        };
        setTimeout(() => {
            this.damagePopup.active = false;
        }, 1000);
    },

    async showAttackEffect(attackerElement, targetElement) {
        const startRect = attackerElement.getBoundingClientRect();
        const endRect = targetElement.getBoundingClientRect();
        const containerRect = this.$el.querySelector('.battle-arena').getBoundingClientRect();

        this.attackEffect.style = {
            top: `${startRect.top - containerRect.top + startRect.height / 2}px`,
            left: `${startRect.left - containerRect.left + startRect.width / 2}px`,
            opacity: 1,
        };
        this.attackEffect.active = true;

        await this.sleep(50);

        this.attackEffect.style = {
            top: `${endRect.top - containerRect.top + endRect.height / 2}px`,
            left: `${endRect.left - containerRect.left + endRect.width / 2}px`,
            opacity: 0.5,
            transition: 'top 0.3s ease-out, left 0.3s ease-out, opacity 0.3s ease-out',
        };

        await this.sleep(300);
        this.attackEffect.active = false;
    },

    async useSkill(skillKey) {
      const skill = this.playerCharacter.skills[skillKey];
      if (this.btnDisabled(skill.staminaCost)) return;

      this.isAttacking = true;
      this.playerAttacking = true;
      const enemy = this.enemies[this.selectedEnemy];
      const enemyIndex = this.selectedEnemy;
      const playerElement = this.$el.querySelector('.player-character');
      const enemyElement = this.$el.querySelectorAll('.enemy-character')[enemyIndex];

      // Deduct Stamina
      this.playerCharacter.currentStamina -= skill.staminaCost;
      this.playerCharacter.staminaPercent = (this.playerCharacter.currentStamina / this.playerCharacter.maxStamina) * 100;
      this.showPopup(skill.staminaCost, playerElement, 'stamina-cost');
      await this.sleep(300); // Show stamina cost briefly

      this.battleStatus = `${this.playerCharacter.name} usa ${skill.name}!`;
      this.addLogMessage(`<b>${this.playerCharacter.name}</b> usou <b>${skill.name}</b> contra ${enemy.name}!`);

      // Animation
      const originalLeft = this.playerCharacter.left;
      this.playerCharacter.left += 30;
      await this.sleep(200);
      await this.showAttackEffect(playerElement, enemyElement);
      this.playerCharacter.left = originalLeft;

      // Apply Damage
      this.damagedEnemy = enemyIndex;
      const damageDealt = skill.power + Math.floor(Math.random() * 5 - 2); // Damage variation
      enemy.currentHp = Math.max(0, enemy.currentHp - damageDealt);
      enemy.hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
      this.showPopup(damageDealt, enemyElement, 'enemy-damage');
      this.addLogMessage(`<span style="color: #ffcc00;">${enemy.name} sofreu ${damageDealt} de dano!</span>`);

      await this.sleep(500);
      this.damagedEnemy = null;
      this.playerAttacking = false;

      // Check if enemy defeated
      if (enemy.hpPercent <= 0) {
        this.addLogMessage(`<span style="color: #cccccc;">${enemy.name} foi derrotado!</span>`);
        if (this.checkWinCondition()) {
            this.victory = true;
            this.battleStatus = "VITÓRIA!";
            this.addLogMessage("<b>Você venceu a batalha!</b>");
            this.isAttacking = false;
            return;
        }
      }

      this.selectedEnemy = null;
      this.isPlayerTurn = false;
      this.battleStatus = "Vez dos inimigos!";
      await this.sleep(1000);
      await this.enemyTurn();

      if (!this.gameOver && !this.victory) {
          this.isAttacking = false;
      }
    },

    async enemyTurn() {
      this.addLogMessage("<i>Os inimigos preparam seus ataques...</i>");
      const playerElement = this.$el.querySelector('.player-character');

      // Player Stamina Regen
      if (this.playerCharacter.currentStamina < this.playerCharacter.maxStamina) {
          const regeneratedStamina = Math.min(this.playerCharacter.staminaRegen, this.playerCharacter.maxStamina - this.playerCharacter.currentStamina);
          this.playerCharacter.currentStamina += regeneratedStamina;
          this.playerCharacter.staminaPercent = (this.playerCharacter.currentStamina / this.playerCharacter.maxStamina) * 100;
          this.showPopup(regeneratedStamina, playerElement, 'stamina-regen');
          this.addLogMessage(`<span style="color: #66ccff;">Você recuperou ${regeneratedStamina} SP.</span>`);
          await this.sleep(500);
      }

      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (enemy.hpPercent <= 0 || this.playerCharacter.hpPercent <= 0) continue;

        this.enemyAttacking = i;
        const enemyElement = this.$el.querySelectorAll('.enemy-character')[i];
        const attack = enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];

        this.battleStatus = `${enemy.name} está atacando!`;
        this.addLogMessage(`${enemy.name} usa ${attack.name}!`);
        await this.sleep(800);

        // Enemy Animation
        const originalLeft = enemy.left;
        enemy.left -= 30;
        await this.sleep(200);
        await this.showAttackEffect(enemyElement, playerElement);
        enemy.left = originalLeft;

        // Apply Damage to Player
        this.damagedPlayer = true;
        const damageTaken = attack.power + Math.floor(Math.random() * 5 - 2);
        this.playerCharacter.currentHp = Math.max(0, this.playerCharacter.currentHp - damageTaken);
        this.playerCharacter.hpPercent = (this.playerCharacter.currentHp / this.playerCharacter.maxHp) * 100;
        this.showPopup(damageTaken, playerElement, 'player-damage');
        this.addLogMessage(`<span style="color: #ff6666;">${this.playerCharacter.name} sofreu ${damageTaken} de dano!</span>`);

        await this.sleep(500);
        this.damagedPlayer = false;
        this.enemyAttacking = null;

        // Check if player defeated
        if (this.playerCharacter.hpPercent <= 0) {
          this.gameOver = true;
          this.battleStatus = "DERROTA!";
          this.addLogMessage(`<b>${this.playerCharacter.name} foi derrotado!</b>`);
          this.isAttacking = false;
          return;
        }
        await this.sleep(800);
      }

      if (!this.gameOver) {
          this.isPlayerTurn = true;
          this.battleStatus = `O que ${this.playerCharacter.name} fará?`;
          this.addLogMessage("<i>Sua vez de agir!</i>");
          this.selectedEnemy = null;
      }
      this.isAttacking = false;
    },

    checkWinCondition() {
        return this.enemies.every(enemy => enemy.hpPercent <= 0);
    },

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
  },
  mounted() {
      this.addLogMessage(`Adentrando a floresta, ${this.playerCharacter.name} encontra inimigos!`);
  }
};
</script>

<style scoped>
/* @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Press+Start+2P&display=swap'); */

.medieval-battle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  height: 100vh;
  width: 100vw;
  /* Background for forest battle */
  /* background: url('https://img.freepik.com/free-vector/dark-forest-landscape-background_1308-119986.jpg?w=1380') no-repeat center center / cover; */
  box-sizing: border-box;
  color: #eee; /* Light text color for dark background */
}

.battle-arena {
  position: relative;
  width: 95vw;
  max-width: 900px;
  height: 65vh;
  max-height: 550px;
  border: 4px solid #6b4f2d; /* Dark wood border */
  background: rgba(0, 0, 0, 0.4); /* Darker overlay */
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0,0,0,0.6);
}

/* Status Top */
.game-status-top {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px; /* Slightly smaller */
  font-weight: bold;
  color: #fff;
  background: rgba(40, 20, 0, 0.8); /* Dark brown background */
  padding: 8px 15px;
  border-radius: 5px;
  z-index: 20;
  text-align: center;
  min-width: 350px;
  border: 2px solid #9d7a50; /* Lighter wood border */
  text-shadow: 1px 1px 2px black;
}

.victory-message {
    color: #ffd700; /* Gold */
    font-size: 16px;
}

.game-over-message {
    color: #cc0000; /* Darker Red */
    font-size: 16px;
}

/* Character Units */
.unit {
  position: absolute;
  width: 80px;
  height: 80px;
  font-size: 45px; /* Adjust emoji size */
  display: flex;
  justify-content: center;
  align-items: center;
  transition: top 0.4s ease, left 0.4s ease, transform 0.2s ease;
  user-select: none;
  filter: drop-shadow(3px 5px 4px rgba(0,0,0,0.6));
}

.player-character {
  z-index: 10;
}

.enemy-character {
  z-index: 9;
}

.enemy-character.fainted {
    filter: grayscale(100%) opacity(40%);
    transition: filter 0.5s ease;
}

/* Character Info Boxes */
.character-info {
    position: absolute;
    background: rgba(30, 15, 0, 0.7); /* Darker brown info box */
    border: 2px solid #8b6f4a; /* Wood border */
    border-radius: 8px;
    padding: 6px 12px;
    z-index: 15;
    color: #eee;
    font-size: 11px; /* Smaller font */
    min-width: 180px; /* Wider info box */
    box-shadow: 2px 2px 5px rgba(0,0,0,0.4);
}

.player-info {
    bottom: 15px;
    left: 15px;
}

.enemy-info {
    text-align: right;
}

.character-name {
    font-weight: bold;
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: #fff;
}

/* Resource Bars (HP & Stamina) */
.resource-bar-container {
    display: flex;
    align-items: center;
    height: 14px;
    margin-bottom: 3px;
}

.hp-bar-label, .stamina-bar-label {
    font-size: 10px;
    font-weight: bold;
    margin-right: 5px;
    width: 25px; /* Align labels */
}

.hp-bar-label { color: #ff8888; } /* Light Red */
.stamina-bar-label { color: #88ccff; } /* Light Blue */

.hp-bar, .stamina-bar {
  flex-grow: 1; /* Take remaining space */
  height: 10px;
  border: 1px solid #222;
  border-radius: 3px;
  overflow: hidden;
}

.hp-bar { background: #8b0000; } /* Dark Red background */
.stamina-bar { background: #00008b; } /* Dark Blue background */

.hp {
  height: 100%;
  background: linear-gradient(to right, #ff4444, #ff8888); /* Red gradient */
  transition: width 0.5s ease-out;
  border-radius: 2px;
}

.stamina {
  height: 100%;
  background: linear-gradient(to right, #4488ff, #88ccff); /* Blue gradient */
  transition: width 0.5s ease-out;
  border-radius: 2px;
}

.resource-value {
    font-size: 10px;
    margin-left: 6px;
    font-weight: bold;
    min-width: 45px; /* Space for HP/SP values */
    text-align: right;
}

/* Enemy Clickable Area */
.enemy-clickable-area {
  position: absolute;
  width: 90px;
  height: 90px;
  cursor: pointer;
  border-radius: 50%;
  background: rgba(200, 180, 0, 0.08); /* Faint gold */
  z-index: 11;
  transition: background-color 0.2s ease;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.enemy-clickable-area:hover {
  background: rgba(200, 180, 0, 0.2);
}

.enemy-selected {
  background: rgba(255, 215, 0, 0.3);
  box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.6);
}

.selected-marker {
  font-size: 28px;
  color: #ffd700; /* Gold */
  position: absolute;
  top: -30px;
  animation: bounce 0.8s infinite alternate;
  text-shadow: 1px 1px 3px black;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-6px); }
}

/* Battle Log & Actions */
.battle-log-container {
  width: 95vw;
  max-width: 900px;
  height: 25vh;
  max-height: 200px;
  background: rgba(30, 15, 0, 0.85); /* Darker brown log */
  border: 4px solid #6b4f2d; /* Wood border */
  border-radius: 10px;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  margin-top: 10px;
}

.battle-log {
  width: 58%; /* Adjust width */
  height: 100%;
  overflow-y: auto;
  font-size: 12px; /* Smaller log font */
  line-height: 1.6;
  padding-right: 15px;
  border-right: 2px solid #8b6f4a; /* Wood separator */
  color: #ddd;
}

.battle-log p {
    margin: 0 0 6px 0;
}

/* Scrollbar styling */
.battle-log::-webkit-scrollbar {
  width: 10px;
}
.battle-log::-webkit-scrollbar-track {
  background: #4d3a1f; /* Dark wood track */
  border-radius: 5px;
}
.battle-log::-webkit-scrollbar-thumb {
  background: #8b6f4a; /* Lighter wood thumb */
  border-radius: 5px;
}
.battle-log::-webkit-scrollbar-thumb:hover {
  background: #a0845e;
}

.actions {
  width: 40%; /* Adjust width */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start; /* Align items to top */
  padding-top: 5px;
}

.actions-placeholder {
    width: 40%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #888;
    font-size: 14px;
}

.action-btn {
  margin: 6px;
  padding: 8px 12px;
  font-size: 11px; /* Smaller button font */
  cursor: pointer;
  border: 2px solid #333; /* Dark border */
  border-radius: 5px;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
  transition: all 0.15s;
  background-color: #888; /* Grey default */
  box-shadow: 2px 2px 0px #444;
}

/* Skill type colors */
.skill-type-physical { background-color: #a0522d; } /* Sienna */
.skill-type-magic { background-color: #483d8b; } /* DarkSlateBlue */

.action-btn:hover:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #222;
  filter: brightness(1.15);
}

.action-btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: none;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: 1px 1px 0px #444;
  background-color: #666;
}

/* Tooltip Style */
.tooltip-text {
  visibility: hidden;
  width: max-content;
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;
  text-align: center;
  border-radius: 4px;
  padding: 5px 8px;
  position: absolute;
  z-index: 30;
  bottom: 110%; /* Position above the button */
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 10px;
  white-space: nowrap;
}

[data-tooltip]:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* Animations */
.unit.is-attacking {
  /* Simple jiggle or pulse */
  /* animation: attackPulse 0.4s ease-in-out; */
}

.unit.is-damaged {
  animation: damageFlashMedieval 0.3s linear 2;
}

@keyframes damageFlashMedieval {
  0%, 100% { filter: brightness(1) drop-shadow(3px 5px 4px rgba(0,0,0,0.6)); }
  50% { filter: brightness(1.8) saturate(1.2) drop-shadow(3px 5px 4px rgba(200,0,0,0.7)); }
}

/* Damage Popup */
.damage-popup {
  position: absolute;
  font-size: 20px;
  font-weight: bold;
  user-select: none;
  animation: floatUpFade 1s forwards ease-out;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 25;
  text-shadow: 1px 1px 3px black;
}

.damage-popup.player-damage { color: #ff6666; } /* Red for damage TO player */
.damage-popup.enemy-damage { color: #ffcc00; } /* Yellow for damage TO enemy */
.damage-popup.stamina-cost { color: #88ccff; font-size: 16px; } /* Blue for stamina cost */
.damage-popup.stamina-regen { color: #66ffaa; font-size: 16px; } /* Green/Blue for stamina regen */
.damage-popup.hp-heal { color: #90ee90; } /* LightGreen for healing */

@keyframes floatUpFade {
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -45px);
  }
}

/* Attack Effect */
.attack-effect {
    position: absolute;
    font-size: 28px;
    z-index: 20;
    pointer-events: none;
    color: #ffdd88; /* Light gold effect */
    text-shadow: 0 0 5px #fff, 0 0 10px #ffcc00;
}

</style>


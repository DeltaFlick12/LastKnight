<template>
  <div class="final-battle" :style="battleBackgroundStyle">
    <div class="boss-section">
      <div class="boss-info">
        <h2>Magnus</h2>
        <div class="health-bar">
          <div class="bar" :style="{ width: bossHealthPercent + '%', backgroundColor: 'darkred' }"></div>
        </div>
        <div class="stamina-bar">
          <div class="bar" :style="{ width: bossStaminaPercent + '%', backgroundColor: 'orange' }"></div>
        </div>
      </div>
      <div class="boss-visual" :class="{ vulnerable: gameState.boss.isVulnerable }">
        <img src="@/assets/magnus.png" alt="Magnus" />
      </div>
    </div>

    <div class="battle-log">{{ currentAction }}</div>

    <div class="player-section">
      <div class="player-info">
        <h2>Você</h2>
        <div class="health-bar">
          <div class="bar" :style="{ width: playerHealthPercent + '%', backgroundColor: 'green' }"></div>
        </div>
        <div class="stamina-bar">
          <div class="bar" :style="{ width: playerStaminaPercent + '%', backgroundColor: 'lightgreen' }"></div>
        </div>
      </div>
      <div class="actions">
        <button @click="playerAttack">Atacar</button>
        <button @click="playerDodge">Esquivar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useGameState } from '@/stores/gameState';
import { useGameActions } from '@/composables/gameActions';
import { useAudio } from '@/composables/audio';
import { useRouter } from 'vue-router';

const gameState = useGameState();
const actions = useGameActions();
const { playAudio } = useAudio();
const router = useRouter();

const currentAction = ref('A batalha final começou!');

const ATTACK_COST = 10;
const DODGE_COST = 15;
const BOSS_ATTACK_INTERVAL = 3000;
const STAMINA_REGEN_INTERVAL = 1000;
const STAMINA_REGEN_AMOUNT = 5;
const BOSS_VULNERABLE_DURATION = 5000;

const phaseColors = ['#2c1a3b', '#4b1f3b', '#6b243b'];
const battleBackgroundStyle = computed(() => ({ backgroundColor: phaseColors[gameState.boss.phase - 1] }));

const getPercent = (value, max) => (value / max) * 100;
const playerHealthPercent = computed(() => getPercent(gameState.player.health, gameState.player.maxHealth));
const playerStaminaPercent = computed(() => getPercent(gameState.player.stamina, gameState.player.maxStamina));
const bossHealthPercent = computed(() => getPercent(gameState.boss.health, gameState.boss.maxHealth));
const bossStaminaPercent = computed(() => getPercent(gameState.boss.stamina, gameState.boss.maxStamina));

const playerAttack = () => {
  if (!gameState.boss.isVulnerable || gameState.player.stamina < ATTACK_COST) return;

  actions.useStamina(ATTACK_COST);
  playAudio('player_attack_swing');

  const damage = Math.floor(Math.random() * 10 + 20);
  actions.damageBoss(damage);
  playAudio('boss_hit');

  currentAction.value = `Você atacou Magnus! (-${damage} HP)`;

  if (gameState.boss.health <= 0) endBattle();
};

const playerDodge = () => {
  if (gameState.player.stamina < DODGE_COST) return;
  actions.useStamina(DODGE_COST);
  currentAction.value = 'Você se esquivou!';
  playAudio('dodge');
};

const runBattleLoop = () => {
  if (gameState.boss.health <= 0 || gameState.player.health <= 0) {
    endBattle();
    return;
  }
  if (gameState.boss.isVulnerable) {
    currentAction.value = 'Magnus está exausto!';
    return;
  }
  executeBossAttack();
  actions.drainBossStamina(25);
};

const executeBossAttack = () => {
  const damage = Math.floor(Math.random() * 15 + 10);
  actions.damagePlayer(damage);
  playAudio('boss_attack');
  currentAction.value = `Magnus atacou você! (-${damage} HP)`;
};

const endBattle = () => {
  if (gameState.player.health <= 0) {
    currentAction.value = 'Você foi derrotado por Magnus...';
    playAudio('player_defeated');
  } else if (gameState.boss.health <= 0) {
    currentAction.value = 'Você derrotou Magnus!';
    playAudio('boss_defeated');
    actions.markFinalBossDefeated();
    setTimeout(() => {
      router.push('/credits');
    }, 3000);
  }
};

watch(() => gameState.boss.stamina, (newStamina) => {
  if (newStamina <= 0 && !gameState.boss.isVulnerable) {
    gameState.boss.isVulnerable = true;
    currentAction.value = 'Magnus está vulnerável!';
    setTimeout(() => {
      gameState.boss.isVulnerable = false;
      actions.restoreBossStamina();
      currentAction.value = 'Magnus se recuperou!';
    }, BOSS_VULNERABLE_DURATION);
  }
});

onMounted(() => {
  setInterval(runBattleLoop, BOSS_ATTACK_INTERVAL);
  setInterval(() => actions.restoreStamina(STAMINA_REGEN_AMOUNT), STAMINA_REGEN_INTERVAL);
  playAudio('music_final_battle', { loop: true });
});
</script>


<style scoped>
.final-battle {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  color: #fff;
  min-height: 100vh;
  background-color: #2c1a3b;
  transition: background-color 0.5s ease;
}

.boss-section,
.player-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.boss-info,
.player-info {
  flex: 1;
}

.health-bar,
.stamina-bar {
  height: 15px;
  background: #444;
  border-radius: 5px;
  margin: 5px 0;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s ease;
}

.boss-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.boss-visual img {
  width: 200px;
  transition: filter 0.3s ease;
}

.boss-visual.vulnerable img {
  filter: grayscale(100%) brightness(1.2);
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.battle-log {
  text-align: center;
  font-size: 1.2em;
  padding: 10px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
}
</style>

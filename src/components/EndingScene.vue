<template>
  <div class="ending-scene" :style="endingBackgroundStyle">
    <div class="narrative-box">
      <!-- Contexto Comum -->
      <p v-if="step === 1">A energia sombria que preenchia o Santuário Corrompido recua como uma maré sinistra. Magnus, o Paladino Caído, jaz derrotado, sua armadura quebrada silenciando o pulsar profano.</p>
      <p v-if="step === 2">O último cavaleiro, exausto mas vitorioso, corre até onde a Princesa Julie estava aprisionada. Ele a liberta, e por um instante, em meio à poeira e à desolação, há um vislumbre de esperança.</p>
      <p v-if="step === 3">Mas o mal não cede tão facilmente... Com um último espasmo de força maligna, Magnus, mesmo caído, lança sua arma em direção à princesa. O cavaleiro tenta intervir, mas é tarde demais. A lâmina sombria encontra seu alvo.</p>

      <!-- Lógica de Decisão (Final 1 vs Final 2) -->
      <div v-if="step === 4 && requiresDecision">
        <p>O grito de dor da Princesa Julie ecoa pelo santuário profanado. O cavaleiro a segura em seus braços enquanto a vida se esvai dela, a ferida sombria pulsando...</p>
        <p>Você se lembra da Poção Proibida. Uma troca... vida por vida.</p>
        <p>O que você faz?</p>
        <button @click="makeDecision(1)">Usar a Poção Proibida (Sacrificar-se)</button>
        <button @click="makeDecision(2)">Não usar a Poção (Aceitar o destino)</button>
      </div>

      <!-- Narrativa do Final Escolhido -->
      <div v-if="step === 5">
        <p v-html="endingText"></p>
      </div>

      <!-- Botão para Próximo Passo / Créditos -->
      <button v-if="step < 4 || (step === 4 && !requiresDecision)" @click="nextStep">Continuar...</button>
      <button v-if="step === 5" @click="goToCredits">Ver Créditos</button>
    </div>

    <!-- Placeholder para Imagem/Animação do Final -->
    <div class="ending-visual">
      <!-- <img v-if="finalImage" :src="finalImage" alt="Cena Final"> -->
      <p v-if="step === 5">(Placeholder: Imagem/Animação da Cena Final {{ finalEndingType }})</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { gameState, actions } from '@/store/gfame.js'; // Ajuste o caminho
import { playAudio, stopAudio } from '@/utils/audioManager.js'; // Importar gerenciador de áudio

const route = useRoute();
const router = useRouter();

const step = ref(1);
const requiresDecision = ref(false);
const finalEndingType = ref(null);
const endingText = ref('');
const currentMusic = ref(null);

// Mapeamento de textos e sons dos finais
const endingsContent = {
  1: {
    // Final 1: Sacrifício
    text: `O grito de dor da Princesa Julie ecoa... Você se lembra. A Poção Proibida... Com as mãos trêmulas, ele retira o frasco cintilante... Olhando uma última vez para o rosto pálido da princesa... ele toma sua decisão.<br><br>Ele derrama a poção sobre a ferida de Julie... Uma luz ofuscante envolve os dois. O cavaleiro sente sua própria força vital sendo drenada... enquanto a cor retorna ao rosto da princesa. Seus olhos se abrem... e ela vê o cavaleiro desabando ao seu lado, um sorriso fraco nos lábios.<br><br><i>"E assim, o último cavaleiro deu sua vida para que Albadia pudesse viver. Seu nome foi esquecido, mas seu sacrifício se tornou a pedra fundamental de um reino renascido das cinzas da tirania. A luz retornou, mas a um custo que jamais seria esquecido."</i>`,
    background: '#a0a0c0', // Cor placeholder: Cinza-azulado melancólico
    music: 'ending_music_sacrifice',
    sfx: ['princess_cry', 'potion_use', 'sacrifice_light']
  },
  2: {
    // Final 2: Trágico
    text: `O grito de dor da Princesa Julie ecoa e silencia rapidamente... A luz em seus olhos se apaga. A ferida sombria era absoluta. Ela se foi.<br><br>O cavaleiro olha para suas mãos, para a princesa sem vida... A vitória tem um gosto amargo de cinzas... Ele a deposita gentilmente no chão frio... Levanta-se, o peso do mundo sobre seus ombros. Caminha lentamente até a beira da torre... O vento frio chicoteia seu rosto... Não há mais propósito.<br><br>Ele se inclina para frente... A tela corta para preto absoluto. Silêncio.<br><br><i>"A vitória foi conquistada, mas a esperança foi perdida. No coração do castelo sombrio, o último cavaleiro encontrou seu fim, não pela lâmina inimiga, mas pelo peso insuportável do fracasso. A escuridão recuou, mas deixou para trás apenas o vazio."</i>`,
    background: '#404050', // Cor placeholder: Cinza escuro desolador
    music: 'ending_music_tragic',
    sfx: ['princess_cry_short', 'player_despair', 'fall_sound', 'screen_black']
  },
  3: {
    // Final 3: Verdadeiro
    text: `O grito de dor da Princesa Julie ecoa... Mas então, algo acontece. As três Relíquias de Albadia brilham intensamente.<br><br>Uma luz suave e protetora envolve a princesa. A ferida sombria recua... A energia das relíquias não apenas cura a princesa, mas também reage ao mal residual de Magnus... Sua armadura começa a se desintegrar... Magnus solta um último grito enquanto seu ser corrompido é completamente obliterado.<br><br>A luz diminui, deixando o cavaleiro e a Princesa Julie, agora totalmente curada, sozinhos no santuário banhado pela luz do amanhecer... Juntos, eles olham pela janela enquanto o sol nasce sobre Albadia.<br><br><i>"Pela coragem e perseverança, as Relíquias perdidas de Albadia foram reunidas... O último cavaleiro e a princesa retornaram como símbolos de resiliência. Um novo amanhecer surgiu para Albadia, construído sobre as ruínas do passado, com a promessa de um futuro forjado em esperança e bravura."</i>`,
    background: '#c0b0a0', // Cor placeholder: Bege/Dourado esperançoso
    music: 'ending_music_true',
    sfx: ['princess_cry', 'relics_shine', 'healing_sound', 'magnus_disintegrate']
  }
};

onMounted(() => {
  const initialType = route.params.type;
  playAudio('ending_scene_start'); // Som inicial da cena

  if (initialType === '3') {
    finalEndingType.value = 3;
    requiresDecision.value = false;
  } else if (gameState.player.hasForbiddenPotion && gameState.player.relicsCollected < 3) {
    requiresDecision.value = true;
  } else {
    finalEndingType.value = 2;
    requiresDecision.value = false;
  }

  if (!requiresDecision.value && finalEndingType.value) {
    actions.setEnding(finalEndingType.value);
    // Tocar música se o final já estiver definido
    const style = endingsContent[finalEndingType.value];
    if (style && style.music) {
      playAudio(style.music, { loop: true });
      currentMusic.value = style.music;
    }
  }
});

onUnmounted(() => {
  stopAudio(currentMusic.value); // Para a música ao sair da cena
});

const nextStep = () => {
  step.value++;
  // Tocar SFX baseado no passo da narrativa comum
  if (step.value === 3) playAudio('magnus_final_attack');
  if (step.value === 4 && !requiresDecision.value) {
    // Pula a etapa de decisão se não for necessária
    prepareEndingDisplay();
    step.value = 5;
  }
};

const makeDecision = (decision) => {
  finalEndingType.value = decision;
  actions.setEnding(finalEndingType.value);
  prepareEndingDisplay();
  step.value = 5;
};

const prepareEndingDisplay = () => {
  if (finalEndingType.value && endingsContent[finalEndingType.value]) {
    const content = endingsContent[finalEndingType.value];
    endingText.value = content.text;
    // Parar música anterior e tocar a nova música do final
    stopAudio(currentMusic.value);
    if (content.music) {
      playAudio(content.music, { loop: true });
      currentMusic.value = content.music;
    }
    // Tocar SFX específicos do início do final
    if (content.sfx && content.sfx.length > 0) {
      playAudio(content.sfx[0]); // Exemplo: tocar o primeiro SFX da lista
    }
  } else {
    endingText.value = 'Erro ao carregar o final.';
  }
};

const goToCredits = () => {
  router.push({ path: `/credits/${finalEndingType.value}` });
};

// Estilo de Fundo Dinâmico
const endingBackgroundStyle = computed(() => {
  const bg = finalEndingType.value && endingsContent[finalEndingType.value]
             ? endingsContent[finalEndingType.value].background
             : '#1a1a2e'; // Fundo padrão escuro
  return { backgroundColor: bg };
});

</script>

<style scoped>
.ending-scene {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Georgia', serif;
  padding: 40px;
  box-sizing: border-box;
  text-align: center;
  transition: background-color 1s ease;
}

.narrative-box {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 30px;
  border-radius: 10px;
  max-width: 800px;
  margin-bottom: 30px;
  border: 1px solid #ccc;
}

.narrative-box p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 15px;
}

.narrative-box button {
  padding: 10px 20px;
  font-size: 1rem;
  margin: 10px;
  cursor: pointer;
  font-family: 'Press Start 2P', cursive;
}

.ending-visual {
  width: 80%;
  max-width: 600px;
  height: 200px; /* Ajustar conforme necessário */
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
}
</style>

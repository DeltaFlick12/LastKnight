<template>
  <div class="cutscene-player" :style="backgroundStyle">
    <div class="dialog-box">
      <p v-if="currentSceneData && currentSceneData.speaker" class="speaker-name">{{ currentSceneData.speaker }}:</p>
      <p v-if="currentSceneData" class="dialog-text">{{ currentSceneData.text }}</p>
    </div>
    <div class="visual-placeholder">
      <!-- Placeholder para imagens/animações da cutscene -->
      <p>(Placeholder: Visual da Cutscene - {{ sceneKey }})</p>
      <p v-if="currentSceneData && currentSceneData.action">({{ currentSceneData.action }})</p>
    </div>
    <button @click="nextScene">Continuar...</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { playAudio, stopAudio } from '@/utils/audioManager.js'; // Ajuste o caminho

const props = defineProps({
  sceneKey: {
    type: String,
    required: true
  }
});

const router = useRouter();

// TODO: Definir dados das cutscenes em um arquivo separado (ex: cutscenes.js)
const cutscenes = {
  inicio: [
    { speaker: 'Bob (Mental)', text: 'É hoje... meu primeiro teste para cavaleiro real. Tantos outros falharam... Consigo sentir o olhar deles nas minhas costas.', background: 'castelo_patio_teste', action: 'Bob está nervoso entre outros cavaleiros.' },
    { speaker: null, text: 'De repente, uma explosão abala o pátio! Magnus, o Paladino Caído, surge das sombras!', background: 'castelo_patio_invasao', action: 'Magnus aparece imponente.', sfx: 'explosion_sound' },
    { speaker: 'Cavaleiro Real', text: 'Protejam a princesa! Ao ataque!', background: 'castelo_patio_invasao', action: 'Cavaleiros avançam contra Magnus.' },
    { speaker: null, text: 'Magnus libera uma onda de energia sombria, derrubando todos os cavaleiros instantaneamente.', background: 'castelo_patio_derrota', action: 'Cavaleiros caídos, Magnus se aproxima da princesa.', sfx: 'dark_wave_attack' },
    { speaker: 'Princesa Julie', text: 'Não! Socorro!', background: 'castelo_patio_derrota', action: 'Magnus agarra a Princesa Julie.' },
    { speaker: null, text: 'Magnus desaparece com a princesa em um portal de sombras.', background: 'castelo_patio_vazio', action: 'Portal se fecha.', sfx: 'portal_close' },
    { speaker: null, text: '(Tela escurece)', background: 'black' },
    { speaker: null, text: '(A câmera mostra o castelo de Magnus no mapa, depois volta para o Campo de Treino onde Bob acorda)', background: 'mapa_zoom_out_in', action: 'Transição para o jogo.', music: 'theme_start' }
  ],
  // Adicionar outras cutscenes aqui (ex: final_tragico, final_sacrificio)
};

const currentSceneIndex = ref(0);
const sceneData = ref(cutscenes[props.sceneKey] || []);
const currentMusic = ref(null);

const currentSceneData = computed(() => {
  return sceneData.value[currentSceneIndex.value];
});

const backgroundStyle = computed(() => {
  const bgKey = currentSceneData.value?.background || 'black';
  // TODO: Mapear bgKey para URLs de imagem reais
  const colors = { black: '#000', castelo_patio_teste: '#aabbcc', castelo_patio_invasao: '#ccaa99', castelo_patio_derrota: '#886666', castelo_patio_vazio: '#555566', mapa_zoom_out_in: '#778899' };
  return { backgroundColor: colors[bgKey] || '#000' };
});

const playSceneAudio = () => {
  const scene = currentSceneData.value;
  if (!scene) return;

  if (scene.music && scene.music !== currentMusic.value) {
    stopAudio(currentMusic.value);
    playAudio(scene.music, { loop: true });
    currentMusic.value = scene.music;
  }
  if (scene.sfx) {
    playAudio(scene.sfx);
  }
};

const nextScene = () => {
  if (currentSceneIndex.value < sceneData.value.length - 1) {
    currentSceneIndex.value++;
    playSceneAudio();
  } else {
    // Fim da cutscene
    stopAudio(currentMusic.value);
    // TODO: Navegar para a próxima cena/nível apropriado
    if (props.sceneKey === 'inicio') {
      router.push({ name: 'CampoTreino' }); // Exemplo: Ir para o campo de treino após a intro
    } else {
      router.push('/'); // Voltar ao menu por padrão
    }
  }
};

onMounted(() => {
  playSceneAudio(); // Toca áudio da primeira cena
});

onUnmounted(() => {
  stopAudio(currentMusic.value); // Garante que a música pare ao sair
});

</script>

<style scoped>
.cutscene-player {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* Coloca a caixa de diálogo embaixo */
  align-items: center;
  color: white;
  font-family: 'Press Start 2P', cursive;
  background-color: black; /* Fundo padrão */
  background-size: cover;
  background-position: center;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
}

.dialog-box {
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px solid #ccc;
  padding: 20px;
  margin-bottom: 20px;
  width: 80%;
  max-width: 800px;
  border-radius: 5px;
  text-align: left;
}

.speaker-name {
  font-weight: bold;
  color: #ffd700; /* Dourado */
  margin-bottom: 5px;
}

.dialog-text {
  font-size: 1rem;
  line-height: 1.5;
}

.visual-placeholder {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 50%; /* Ajustar conforme necessário */
  background-color: rgba(50, 50, 50, 0.5);
  border: 1px dashed white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-style: italic;
}

button {
  padding: 10px 20px;
  font-family: 'Press Start 2P', cursive;
  cursor: pointer;
  margin-top: 10px; /* Espaço entre diálogo e botão */
}
</style>

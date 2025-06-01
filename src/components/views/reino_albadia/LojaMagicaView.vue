<template>
  <div v-if="shopOpen" class="shop-interface">
    <h3>Loja Mágica</h3>
    <ul>
      <li v-for="item in itemsForSale" :key="item.id" @click="buyItem(item)">
        <span>{{ item.name }} - {{ item.price }} 🪙</span>
        <p>{{ item.description }}</p>
      </li>
    </ul>
    <button @click="closeShop">Fechar</button>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameState } from '@/stores/gameState';

export default {
  name: 'LojaMagicaView',
  setup() {
    const router = useRouter();
    const gameState = useGameState();
    const shopOpen = ref(true);
    const itemsForSale = ref([
      { id: 'potion_stamina_small', name: 'Poção de Vigor Pequena', type: 'Consumível', price: 20, description: 'Restaura uma pequena quantidade de stamina.', effect: { stamina: 50 } },
      { id: 'potion_forbidden', name: 'Poção Proibida', type: 'Consumível Especial', price: 500, description: 'Um líquido instável que pulsa com poder... Dizem que pode trocar vida por vida. (Uso único)' }
    ]);

    const buyItem = (item) => {
      if (gameState.player.gold >= item.price) {
        gameState.player.gold -= item.price;
        gameState.player.inventory = gameState.player.inventory || [];
        gameState.player.inventory.push(item);
        if (item.id === 'potion_forbidden') {
          gameState.player.hasForbiddenPotion = true;
        }
        alert(`Você comprou ${item.name}!`);
      } else {
        alert('Ouro insuficiente!');
      }
    };

    const closeShop = () => {
      shopOpen.value = false;
      router.push('/level/albadia');
    };

    return { shopOpen, itemsForSale, buyItem, closeShop };
  }
}
</script>

<style scoped>
.shop-interface {
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 10px;
  font-family: 'Press Start 2P', cursive;
  max-width: 600px;
  margin: 20px auto;
}

h3 {
  color: #ffd700;
  margin-bottom: 20px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 10px;
  border-bottom: 1px solid #444;
  cursor: pointer;
}

li:hover {
  background: rgba(139, 94, 60, 0.2);
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  background: #8b5e3c;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background: #a0704c;
}
</style>
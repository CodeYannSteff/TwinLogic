import cardData from '../data/cards.json';

export class CardManager {
  constructor(scene) {
    this.scene = scene;
    this.allCards = new Map();
    this.inventory = [];
    this.equipped = [null, null, null, null]; // 4 active hotbar slots
    this.cooldowns = {};

    cardData.cards.forEach(card => {
      this.allCards.set(card.id, { ...card });
    });

    // Distribute initial starter cards
    cardData.starterCards.forEach(id => {
      this.addCard(id);
    });

    // Autofill hotbar slots with starter cards
    for (let i = 0; i < Math.min(this.inventory.length, 4); i++) {
      this.equipped[i] = this.inventory[i];
    }
  }

  addCard(cardId) {
    if (!this.inventory.includes(cardId) && this.allCards.has(cardId)) {
      this.inventory.push(cardId);
      const emptySlot = this.equipped.indexOf(null);
      if (emptySlot !== -1) {
        this.equipped[emptySlot] = cardId;
      }
      return true;
    }
    return false;
  }

  getCard(cardId) {
    return this.allCards.get(cardId);
  }

  getEquippedCard(slotIndex) {
    const id = this.equipped[slotIndex];
    if (!id) return null;
    return this.allCards.get(id);
  }

  equipCard(cardId, slotIndex) {
    if (slotIndex < 0 || slotIndex > 3) return;
    if (!this.inventory.includes(cardId)) return;

    // Swap card slots if this card is already equipped in a different slot
    const existingSlot = this.equipped.indexOf(cardId);
    if (existingSlot !== -1) {
      this.equipped[existingSlot] = this.equipped[slotIndex];
    }
    this.equipped[slotIndex] = cardId;
  }

  canUse(slotIndex, currentTime) {
    const cardId = this.equipped[slotIndex];
    if (!cardId) return false;

    const card = this.allCards.get(cardId);
    const lastUse = this.cooldowns[cardId] || 0;
    return (currentTime - lastUse) >= card.cooldown;
  }

  useCard(slotIndex, currentTime) {
    const cardId = this.equipped[slotIndex];
    if (!cardId) return null;
    if (!this.canUse(slotIndex, currentTime)) return null;

    this.cooldowns[cardId] = currentTime;
    return this.allCards.get(cardId);
  }

  getCooldownPercent(slotIndex, currentTime) {
    const cardId = this.equipped[slotIndex];
    if (!cardId) return 0;

    const card = this.allCards.get(cardId);
    const lastUse = this.cooldowns[cardId] || 0;
    const elapsed = currentTime - lastUse;

    if (elapsed >= card.cooldown) return 1;
    return elapsed / card.cooldown;
  }

  getState() {
    return {
      inventory: [...this.inventory],
      equipped: [...this.equipped],
      cooldowns: { ...this.cooldowns }
    };
  }

  loadState(state) {
    if (state) {
      this.inventory = state.inventory || [];
      this.equipped = state.equipped || [null, null, null, null];
      this.cooldowns = state.cooldowns || {};
    }
  }
}

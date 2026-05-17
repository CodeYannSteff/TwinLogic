import Phaser from 'phaser';
import cardData from '../data/cards.json';

export class DeckBuildScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeckBuildScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'HubScene';
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Initialize state. Jucătorul poate naviga între cele 4 sloturi echipate ('slots') și lista de cărți deblocate ('inventory').
    this.cardState = this.registry.get('cardState') || { inventory: [], equipped: [null, null, null, null] };
    this.inventory = [...this.cardState.inventory];
    this.equipped = [...this.cardState.equipped];
    this.selectedSlot = 0;
    this.scrollOffset = 0;
    this.mode = 'slots';
    this.invCursor = 0;

    this.allCards = new Map();
    cardData.cards.forEach(c => this.allCards.set(c.id, c));
    this.buildUI();

    // Map keys for standard WASD, Arrow keys, and confirmation buttons
    this.keys = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      upAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      downAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      leftAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      rightAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      confirm: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      confirmAlt: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      back: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      tab: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB),
      remove: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)
    };
    this._inputCooldown = 0;
  }

  buildUI() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0e1a, 1);
    bg.fillRect(0, 0, w, h);

    this.add.text(w / 2, 16, 'DECK BUILDER', {
      fontSize: '20px', fontFamily: 'monospace', color: '#c8a84e',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(w / 2, 36, 'TAB: switch | ENTER: equip | X: remove | ESC: done', {
      fontSize: '11px', fontFamily: 'monospace', color: '#667788'
    }).setOrigin(0.5);

    this.add.text(16, 54, 'EQUIPPED (1-4)', {
      fontSize: '13px', fontFamily: 'monospace', color: '#44ffcc'
    });

    this.slotGfx = [];
    this.slotTexts = [];
    this.slotSelector = this.add.rectangle(0, 0, 160, 32, 0x44ffcc, 0.15).setStrokeStyle(1, 0x44ffcc, 0.8).setDepth(5);

    // Build the 4 hotbar slot slots graphically
    for (let i = 0; i < 4; i++) {
      const sx = 16;
      const sy = 72 + i * 36;
      const frame = this.add.graphics();
      frame.fillStyle(0x1a1a2e, 1);
      frame.fillRoundedRect(sx, sy, 160, 32, 4);
      frame.lineStyle(1, 0x3a3a5a, 0.6);
      frame.strokeRoundedRect(sx, sy, 160, 32, 4);
      this.slotGfx.push(frame);

      const keyLabel = this.add.text(sx + 4, sy + 4, `[${i + 1}]`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#c8a84e'
      });
      const nameText = this.add.text(sx + 30, sy + 4, '', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ddeeff'
      });
      const typeText = this.add.text(sx + 30, sy + 18, '', {
        fontSize: '10px', fontFamily: 'monospace', color: '#888'
      });
      this.slotTexts.push({ name: nameText, type: typeText });
    }

    const divX = 190;
    this.add.rectangle(divX, h / 2 + 20, 2, h - 60, 0x3a3a5a, 0.5);

    this.add.text(divX + 12, 54, 'COLLECTION', {
      fontSize: '13px', fontFamily: 'monospace', color: '#c8a84e'
    });

    this.invGfx = [];
    this.invTexts = [];
    this.maxVisible = 7;
    this.invSelector = this.add.rectangle(0, 0, 280, 32, 0xc8a84e, 0.15).setStrokeStyle(1, 0xc8a84e, 0.8).setDepth(5).setVisible(false);

    // Build the collection list cards
    for (let i = 0; i < this.maxVisible; i++) {
      const ix = divX + 12;
      const iy = 72 + i * 36;
      const frame = this.add.graphics();
      frame.fillStyle(0x1a1a2e, 1);
      frame.fillRoundedRect(ix, iy, 280, 32, 4);
      frame.lineStyle(1, 0x2a2a4a, 0.5);
      frame.strokeRoundedRect(ix, iy, 280, 32, 4);
      this.invGfx.push(frame);

      const nameText = this.add.text(ix + 8, iy + 4, '', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ddeeff'
      });
      const descText = this.add.text(ix + 8, iy + 18, '', {
        fontSize: '10px', fontFamily: 'monospace', color: '#777'
      });
      this.invTexts.push({ name: nameText, desc: descText });
    }

    // Detail card viewer panel at the bottom
    this.detailBg = this.add.graphics();
    this.detailBg.fillStyle(0x111128, 0.95);
    this.detailBg.fillRoundedRect(8, h - 70, w - 16, 64, 6);
    this.detailBg.lineStyle(1, 0x4a4a6a, 0.5);
    this.detailBg.strokeRoundedRect(8, h - 70, w - 16, 64, 6);

    this.detailName = this.add.text(18, h - 65, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#44ffcc'
    });
    this.detailDesc = this.add.text(18, h - 48, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aabbcc',
      wordWrap: { width: w - 40 }
    });
    this.detailStats = this.add.text(18, h - 28, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#c8a84e'
    });

    this.emptyMsg = this.add.text(w / 2 + 80, h / 2, 'No cards collected yet!\nExplore zones to find cards.', {
      fontSize: '14px', fontFamily: 'monospace', color: '#555', align: 'center'
    }).setOrigin(0.5).setVisible(this.inventory.length === 0);

    this.refreshDisplay();
  }

  refreshDisplay() {
    if (!this.slotTexts) return;

    const typeColors = { attack: '#cc4444', defense: '#4488cc', utility: '#44aa66', chrono: '#8844cc' };

    // Render currently equipped cards in slots
    for (let i = 0; i < 4; i++) {
      const cardId = this.equipped[i];
      if (cardId && this.allCards.has(cardId)) {
        const card = this.allCards.get(cardId);
        this.slotTexts[i].name.setText(card.name);
        this.slotTexts[i].type.setText(`${card.type} | dmg:${card.damage || 0} cd:${(card.cooldown / 1000).toFixed(1)}s`);
        this.slotTexts[i].type.setColor(typeColors[card.type] || '#888');
      } else {
        this.slotTexts[i].name.setText('— Empty —');
        this.slotTexts[i].type.setText('');
      }
    }

    // Render the visible subset of the collection (handles vertical scrolling)
    for (let i = 0; i < this.maxVisible; i++) {
      const idx = this.scrollOffset + i;
      if (idx < this.inventory.length) {
        const cardId = this.inventory[idx];
        const card = this.allCards.get(cardId);
        const equipped = this.equipped.includes(cardId);
        this.invTexts[i].name.setText((equipped ? '★ ' : '  ') + (card ? card.name : cardId));
        this.invTexts[i].name.setColor(equipped ? '#44ffcc' : '#ddeeff');
        this.invTexts[i].desc.setText(card ? `${card.type} | ${card.era}` : '');
        this.invTexts[i].desc.setColor(typeColors[card?.type] || '#777');
        this.invGfx[i].setVisible(true);
        this.invTexts[i].name.setVisible(true);
        this.invTexts[i].desc.setVisible(true);
      } else {
        this.invGfx[i].setVisible(false);
        this.invTexts[i].name.setVisible(false);
        this.invTexts[i].desc.setVisible(false);
      }
    }

    // Toggle selector rectangles depending on active selection mode
    if (this.mode === 'slots') {
      this.slotSelector.setPosition(96, 88 + this.selectedSlot * 36).setVisible(true);
      this.invSelector.setVisible(false);
    } else {
      this.slotSelector.setVisible(false);
      const visIdx = this.invCursor - this.scrollOffset;
      this.invSelector.setPosition(342, 88 + visIdx * 36).setVisible(true);
    }

    // Populate detail panel attributes (DMG, CD, HEAL, duration) dynamically
    let detailCard = null;
    if (this.mode === 'slots') {
      const id = this.equipped[this.selectedSlot];
      if (id) detailCard = this.allCards.get(id);
    } else if (this.inventory.length > 0) {
      detailCard = this.allCards.get(this.inventory[this.invCursor]);
    }

    if (detailCard) {
      this.detailName.setText(detailCard.name + ' (' + detailCard.era + ')');
      this.detailDesc.setText(detailCard.description);
      const stats = [];
      if (detailCard.damage) stats.push(`DMG:${detailCard.damage}`);
      if (detailCard.cooldown) stats.push(`CD:${(detailCard.cooldown / 1000).toFixed(1)}s`);
      if (detailCard.healAmount) stats.push(`HEAL:${detailCard.healAmount}`);
      if (detailCard.range) stats.push(`RNG:${detailCard.range}`);
      if (detailCard.duration) stats.push(`DUR:${(detailCard.duration / 1000).toFixed(1)}s`);
      this.detailStats.setText(stats.join('  '));
    } else {
      this.detailName.setText('No card selected');
      this.detailDesc.setText('');
      this.detailStats.setText('');
    }
  }

  update(time) {
    if (!this.allCards || time < this._inputCooldown) return;

    const cd = 150;
    const up = Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.upAlt);
    const down = Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.downAlt);
    const confirm = Phaser.Input.Keyboard.JustDown(this.keys.confirm) || Phaser.Input.Keyboard.JustDown(this.keys.confirmAlt);
    const back = Phaser.Input.Keyboard.JustDown(this.keys.back);
    const tab = Phaser.Input.Keyboard.JustDown(this.keys.tab);
    const remove = Phaser.Input.Keyboard.JustDown(this.keys.remove);

    if (back) {
      this._inputCooldown = time + 300;
      this.saveAndExit();
      return;
    }

    if (tab) {
      this._inputCooldown = time + cd;
      this.mode = this.mode === 'slots' ? 'inventory' : 'slots';
      this.refreshDisplay();
      return;
    }

    if (this.mode === 'slots') {
      if (up) { this.selectedSlot = Math.max(0, this.selectedSlot - 1); this._inputCooldown = time + cd; }
      if (down) { this.selectedSlot = Math.min(3, this.selectedSlot + 1); this._inputCooldown = time + cd; }
      if (remove) {
        this.equipped[this.selectedSlot] = null;
        this._inputCooldown = time + cd;
      }
      if (confirm && this.inventory.length > 0) {
        this.mode = 'inventory';
        this._inputCooldown = time + cd;
      }
    } else {
      if (this.inventory.length === 0) { this.mode = 'slots'; this.refreshDisplay(); return; }
      if (up) {
        this.invCursor = Math.max(0, this.invCursor - 1);
        if (this.invCursor < this.scrollOffset) this.scrollOffset = this.invCursor;
        this._inputCooldown = time + cd;
      }
      if (down) {
        this.invCursor = Math.min(this.inventory.length - 1, this.invCursor + 1);
        if (this.invCursor >= this.scrollOffset + this.maxVisible) this.scrollOffset = this.invCursor - this.maxVisible + 1;
        this._inputCooldown = time + cd;
      }
      if (confirm) {
        const cardId = this.inventory[this.invCursor];
        const existingSlot = this.equipped.indexOf(cardId);
        if (existingSlot !== -1) {
          this.equipped[existingSlot] = this.equipped[this.selectedSlot];
        }
        this.equipped[this.selectedSlot] = cardId;
        this.mode = 'slots';
        this._inputCooldown = time + cd;
      }
    }

    this.refreshDisplay();
  }

  saveAndExit() {
    const state = this.registry.get('cardState') || {};
    state.inventory = [...this.inventory];
    state.equipped = [...this.equipped];
    this.registry.set('cardState', state);
    this.scene.start(this.returnScene);
  }
}

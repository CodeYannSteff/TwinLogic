import Phaser from 'phaser';

export class HUD {
  constructor(scene, player, cardManager) {
    this.scene = scene;
    this.player = player;
    this.cardManager = cardManager;
    this.container = scene.add.container(0, 0).setDepth(100).setScrollFactor(0);

    this.createHealthBar();
    this.createCardHotbar();
    this.createZoneLabel();
  }

  createHealthBar() {
    const x = 10;
    const y = 8;

    const frame = this.scene.add.graphics();
    frame.fillStyle(0x5a4a2a, 1);
    frame.fillRoundedRect(x, y, 160, 24, 5);
    frame.fillStyle(0x3a2a12, 1);
    frame.fillRoundedRect(x + 2, y + 2, 156, 20, 4);

    this.hpBg = this.scene.add.rectangle(x + 4, y + 4, 152, 16, 0x1a0808).setOrigin(0);
    this.hpFill = this.scene.add.rectangle(x + 4, y + 4, 152, 16, 0x22bb44).setOrigin(0);
    this.hpShine = this.scene.add.rectangle(x + 4, y + 4, 152, 5, 0xffffff, 0.1).setOrigin(0);

    this.hpText = this.scene.add.text(x + 80, y + 12, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);

    const heart = this.scene.add.graphics();
    heart.fillStyle(0xff3344, 1);
    heart.fillCircle(x + 8, y + 12, 5);
    heart.fillCircle(x + 14, y + 12, 5);

    this.container.add([frame, this.hpBg, this.hpFill, this.hpShine, this.hpText, heart]);
  }

  createCardHotbar() {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;
    this.cardSlots = [];
    this.cdOverlays = [];
    this.slotLabels = [];
    this.cardNameTexts = [];
    this.cardTypeIcons = [];

    const keys = ['1', '2', '3', '4'];
    const slotW = 44;
    const slotH = 48;
    const gap = 6;
    const totalW = 4 * slotW + 3 * gap;
    const startX = (w - totalW) / 2 + slotW / 2;
    const y = h - slotH / 2 - 8;

    // Draw an ornate background panel flanking the action slots
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x2a1a0a, 0.85);
    panelBg.fillRoundedRect(startX - slotW / 2 - 10, y - slotH / 2 - 6, totalW + 20, slotH + 12, 6);
    panelBg.lineStyle(1, 0x5a4a2a, 0.9);
    panelBg.strokeRoundedRect(startX - slotW / 2 - 10, y - slotH / 2 - 6, totalW + 20, slotH + 12, 6);
    this.container.add(panelBg);

    for (let i = 0; i < 4; i++) {
      const sx = startX + i * (slotW + gap);

      const slotFrame = this.scene.add.graphics();
      slotFrame.fillStyle(0x1a1228, 1);
      slotFrame.fillRoundedRect(sx - slotW / 2, y - slotH / 2, slotW, slotH, 3);
      slotFrame.lineStyle(1, 0x6a5a3a, 0.8);
      slotFrame.strokeRoundedRect(sx - slotW / 2, y - slotH / 2, slotW, slotH, 3);

      const cd = this.scene.add.rectangle(sx, y, slotW - 2, slotH - 2, 0x000000, 0.6);
      const typeBar = this.scene.add.rectangle(sx, y - slotH / 2 + 4, slotW - 6, 3, 0x444466).setOrigin(0.5, 0.5);

      const label = this.scene.add.text(sx + slotW / 2 - 3, y - slotH / 2 + 4, keys[i], {
        fontSize: '12px', fontFamily: 'monospace', color: '#c8a84e',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(1, 0);

      const name = this.scene.add.text(sx, y + 8, '', {
        fontSize: '9px', fontFamily: 'monospace', color: '#aabbcc',
        align: 'center'
      }).setOrigin(0.5);

      this.cardSlots.push(slotFrame);
      this.cdOverlays.push(cd);
      this.slotLabels.push(label);
      this.cardNameTexts.push(name);
      this.cardTypeIcons.push(typeBar);

      this.container.add([slotFrame, cd, typeBar, label, name]);
    }
  }

  createZoneLabel() {
    const w = this.scene.cameras.main.width;

    // Zone label (top-right)
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1228, 0.7);
    bg.fillRoundedRect(w - 200, 8, 192, 24, 5);
    bg.lineStyle(1, 0x5a4a2a, 0.5);
    bg.strokeRoundedRect(w - 200, 8, 192, 24, 5);

    this.zoneLabel = this.scene.add.text(w - 104, 20, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#c8a84e',
      align: 'center'
    }).setOrigin(0.5);

    this.container.add([bg, this.zoneLabel]);
  }

  setZoneName(name) {
    this.zoneLabel.setText(name);
  }

  update(time) {
    // Health bar
    const hpPercent = this.player.hp / this.player.maxHp;
    this.hpFill.width = 152 * hpPercent;
    this.hpShine.width = 152 * hpPercent;

    if (hpPercent > 0.6) this.hpFill.fillColor = 0x22bb44;
    else if (hpPercent > 0.3) this.hpFill.fillColor = 0xddaa22;
    else this.hpFill.fillColor = 0xcc3333;

    this.hpText.setText(`${Math.ceil(this.player.hp)} / ${this.player.maxHp}`);

    // Low HP pulse effect
    if (hpPercent <= 0.25) {
      this.hpFill.alpha = 0.7 + Math.sin(time * 0.008) * 0.3;
    } else {
      this.hpFill.alpha = 1;
    }

    // Card hotbar
    const typeColors = {
      attack: 0xcc3333, defense: 0x3355cc, utility: 0x33aa44, chrono: 0x8833cc
    };

    for (let i = 0; i < 4; i++) {
      const card = this.cardManager.getEquippedCard(i);
      if (card) {
        const cdPercent = this.cardManager.getCooldownPercent(i, time);
        this.cdOverlays[i].scaleY = 1 - cdPercent;
        this.cdOverlays[i].fillAlpha = cdPercent >= 1 ? 0 : 0.5;

        // Type color bar
        this.cardTypeIcons[i].fillColor = typeColors[card.type] || 0x444466;
        this.cardTypeIcons[i].alpha = cdPercent >= 1 ? 1 : 0.4;

        // Key label glow when ready
        this.slotLabels[i].setColor(cdPercent >= 1 ? '#ffdd66' : '#665544');

        // Card name
        const shortName = card.name.length > 8 ? card.name.substring(0, 8) : card.name;
        this.cardNameTexts[i].setText(shortName);
        this.cardNameTexts[i].setAlpha(cdPercent >= 1 ? 1 : 0.4);
      } else {
        this.cdOverlays[i].fillAlpha = 0.3;
        this.slotLabels[i].setColor('#443322');
        this.cardNameTexts[i].setText('Empty');
        this.cardNameTexts[i].setAlpha(0.3);
        this.cardTypeIcons[i].fillColor = 0x222222;
      }
    }
  }

  showCardPickup(cardName) {
    const w = this.scene.cameras.main.width;

    // Fancy notification
    const container = this.scene.add.container(w / 2, 60).setDepth(200).setScrollFactor(0).setAlpha(0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a2a1a, 0.92);
    bg.fillRoundedRect(-130, -16, 260, 32, 6);
    bg.lineStyle(1, 0x44ffaa, 0.6);
    bg.strokeRoundedRect(-130, -16, 260, 32, 6);

    const icon = this.scene.add.text(-115, 0, '✦', {
      fontSize: '16px', color: '#44ffcc'
    }).setOrigin(0.5);

    const text = this.scene.add.text(4, 0, `New Card: ${cardName}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#44ffaa',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);

    container.add([bg, icon, text]);

    // Animate in then out
    this.scene.tweens.add({
      targets: container, alpha: 1, y: 35,
      duration: 400, ease: 'Back.easeOut'
    });
    this.scene.tweens.add({
      targets: container, alpha: 0, y: 20,
      duration: 600, delay: 2500,
      onComplete: () => container.destroy()
    });

    // Sparkle effect
    this.scene.tweens.add({
      targets: icon,
      angle: 360,
      duration: 1000,
      repeat: 2
    });
  }

  destroy() {
    this.container.destroy();
  }
}

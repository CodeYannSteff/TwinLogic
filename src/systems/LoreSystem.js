export class LoreSystem {
  constructor(scene) {
    this.scene = scene;
    this.collectedLore = new Set();
    this.loreEntries = new Map();
  }

  registerLore(id, entry) {
    this.loreEntries.set(id, entry);
  }

  collectLore(id) {
    if (this.collectedLore.has(id)) return false;
    this.collectedLore.add(id);

    const w = this.scene.cameras.main.width;
    const entry = this.loreEntries.get(id);
    const title = entry ? entry.title : 'Lore Fragment';

    // Slide in an ornate gold-trimmed notification window
    const container = this.scene.add.container(w / 2, 50).setDepth(200).setScrollFactor(0).setAlpha(0);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2a2210, 0.92);
    bg.fillRoundedRect(-140, -16, 280, 32, 6);
    bg.lineStyle(1, 0xc8a84e, 0.5);
    bg.strokeRoundedRect(-140, -16, 280, 32, 6);
    const txt = this.scene.add.text(0, 0, `  ${title}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#c8a84e',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    container.add([bg, txt]);

    this.scene.tweens.add({
      targets: container, alpha: 1, y: 35,
      duration: 400, ease: 'Back.easeOut'
    });
    this.scene.tweens.add({
      targets: container, alpha: 0, y: 20,
      duration: 600, delay: 2500,
      onComplete: () => container.destroy()
    });

    return true;
  }

  hasLore(id) {
    return this.collectedLore.has(id);
  }

  getState() {
    return { collected: [...this.collectedLore] };
  }

  loadState(state) {
    if (state && state.collected) {
      this.collectedLore = new Set(state.collected);
    }
  }
}

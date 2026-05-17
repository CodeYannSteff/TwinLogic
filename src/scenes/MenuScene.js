import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Draw a smooth vertical color gradient representing the transition to the chronos void
    const bg = this.add.graphics();
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Math.floor(6 + t * 10);
      const g = Math.floor(8 + t * 12);
      const b = Math.floor(20 + t * 30);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, y, w, 1);
    }

    // Populate the upper sky with twinkling stars for depth
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, w);
      const sy = Phaser.Math.Between(0, h * 0.6);
      const size = Math.random() > 0.8 ? 2 : 1;
      const star = this.add.rectangle(sx, sy, size, size, 0xffffff, 0.3 + Math.random() * 0.5);
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Spawn ambient floating chrono-energy particles rising slowly
    for (let i = 0; i < 20; i++) {
      const px = Phaser.Math.Between(0, w);
      const py = Phaser.Math.Between(h * 0.3, h);
      const colors = [0x44ffcc, 0x4488ff, 0xaa44ff, 0xffcc44];
      const dot = this.add.circle(px, py, Phaser.Math.Between(1, 3),
        colors[Math.floor(Math.random() * colors.length)], 0.2 + Math.random() * 0.3);
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(40, 120),
        x: dot.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }

    // Draw background silhouettes representing historical eras (pyramids, Roman columns, and modern towers)
    const ground = this.add.graphics();
    ground.fillStyle(0x0a0e1a, 1);
    ground.beginPath();
    ground.moveTo(0, h);
    ground.lineTo(0, h - 30);
    ground.lineTo(40, h - 30);
    ground.lineTo(100, h - 80);
    ground.lineTo(160, h - 30);
    ground.lineTo(240, h - 36);
    ground.lineTo(290, h - 60);
    ground.lineTo(310, h - 60);
    ground.lineTo(330, h - 36);
    ground.lineTo(420, h - 30);
    ground.lineTo(480, h - 56);
    ground.lineTo(520, h - 56);
    ground.lineTo(544, h - 76);
    ground.lineTo(568, h - 56);
    ground.lineTo(600, h - 56);
    ground.lineTo(w, h - 24);
    ground.lineTo(w, h);
    ground.closePath();
    ground.fill();

    // Render title text and its offset drop shadow
    this.add.text(w / 2 + 2, h * 0.2 + 2, 'CHRONOS', {
      fontSize: '40px', fontFamily: 'monospace', color: '#000000',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.3);

    const titleTop = this.add.text(w / 2, h * 0.2, 'CHRONOS', {
      fontSize: '40px', fontFamily: 'monospace', color: '#44ffcc',
      align: 'center', stroke: '#1a4040', strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(w / 2 + 2, h * 0.33 + 2, 'GUARDIAN', {
      fontSize: '32px', fontFamily: 'monospace', color: '#000000',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.3);

    const titleBot = this.add.text(w / 2, h * 0.33, 'GUARDIAN', {
      fontSize: '32px', fontFamily: 'monospace', color: '#c8a84e',
      align: 'center', stroke: '#3a2a10', strokeThickness: 2
    }).setOrigin(0.5);

    const sub = this.add.text(w / 2, h * 0.44, 'Defend the Timeline', {
      fontSize: '14px', fontFamily: 'monospace', color: '#8899aa'
    }).setOrigin(0.5);

    // Decorative division line in the center
    const line = this.add.graphics();
    line.lineStyle(1, 0xc8a84e, 0.4);
    line.lineBetween(w / 2 - 100, h * 0.49, w / 2 + 100, h * 0.49);
    const diamond = this.add.graphics();
    diamond.fillStyle(0xc8a84e, 0.8);
    diamond.fillRect(w / 2 - 3, h * 0.49 - 3, 6, 6);

    const menuY = h * 0.6;
    const newGame = this.add.text(w / 2, menuY, '▶  New Journey', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ddeeff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const controls = this.add.text(w / 2, menuY + 36, '⌨  Controls', {
      fontSize: '14px', fontFamily: 'monospace', color: '#8899aa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    newGame.on('pointerover', () => newGame.setColor('#44ffcc'));
    newGame.on('pointerout', () => newGame.setColor('#ddeeff'));
    controls.on('pointerover', () => controls.setColor('#44ffcc'));
    controls.on('pointerout', () => controls.setColor('#8899aa'));

    // Soft pulsing loop to highlight the primary CTA
    this.tweens.add({
      targets: newGame,
      alpha: 0.6,
      duration: 1200,
      yoyo: true,
      repeat: -1
    });

    // Add a gentle floating motion to the main title text to make the menu feel alive
    this.tweens.add({
      targets: [titleTop, titleBot],
      y: '-=3',
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Controls manual overlay panel toggled on click
    this.controlsVisible = false;
    this.controlsBox = this.add.container(w / 2, h * 0.84).setAlpha(0);
    const cbg = this.add.rectangle(0, 0, 380, 60, 0x111122, 0.95).setStrokeStyle(1, 0x44ffcc, 0.3);
    const ctxt = this.add.text(0, 0,
      'WASD/Arrows — Move   1-4 — Cards\nE — Interact   Enter/Space — Talk', {
      fontSize: '13px', fontFamily: 'monospace', color: '#8899aa',
      align: 'center', lineSpacing: 6
    }).setOrigin(0.5);
    this.controlsBox.add([cbg, ctxt]);

    controls.on('pointerdown', () => {
      this.controlsVisible = !this.controlsVisible;
      this.tweens.add({
        targets: this.controlsBox,
        alpha: this.controlsVisible ? 1 : 0,
        duration: 200
      });
    });

    this.add.text(8, h - 22, 'v0.3.0', {
      fontSize: '12px', fontFamily: 'monospace', color: '#334455'
    });
    this.add.text(w - 8, h - 22, 'A Passion Project', {
      fontSize: '12px', fontFamily: 'monospace', color: '#334455'
    }).setOrigin(1, 0);

    newGame.on('pointerdown', () => this.startGame());
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard.once('keydown-SPACE', () => this.startGame());
  }

  startGame() {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('HubScene');
    });
  }
}

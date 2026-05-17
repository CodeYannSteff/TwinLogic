import Phaser from 'phaser';
import { SpriteFactory } from '../utils/SpriteFactory.js';
import { SoundManager } from '../systems/SoundManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // A deep dark background for the loading screen
    this.cameras.main.setBackgroundColor('#0a0a1a');

    const title = this.add.text(w / 2, h / 2 - 60, 'CHRONOS GUARDIAN', {
      fontSize: '28px', fontFamily: 'monospace', color: '#44ffcc'
    }).setOrigin(0.5);

    const progressBg = this.add.rectangle(w / 2, h / 2, 200, 8, 0x1a1a3a);
    progressBg.setStrokeStyle(1, 0x44ffcc, 0.4);
    const progressBar = this.add.rectangle(w / 2 - 98, h / 2, 0, 6, 0x44ffcc);
    progressBar.setOrigin(0, 0.5);

    const loadingText = this.add.text(w / 2, h / 2 + 24, 'Weaving timelines...', {
      fontSize: '14px', fontFamily: 'monospace', color: '#667788'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.width = 196 * value;
    });

    this.load.on('complete', () => {
      title.destroy();
      progressBg.destroy();
      progressBar.destroy();
      loadingText.destroy();
    });

    // Run the procedural pixel art factory to build all texture assets in memory
    const factory = new SpriteFactory(this);
    factory.generateAll();

    // Maintain a single, globally accessible sound manager instance
    if (!this.registry.get('soundManager')) {
      this.registry.set('soundManager', new SoundManager(this));
    }
  }

  create() {
    // Generate movement animations for the 32x32 player sheet
    this.anims.create({
      key: 'player-walk-down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'player-walk-left',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'player-walk-right',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'player-walk-up',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: 8, repeat: -1
    });
    this.anims.create({
      key: 'player-idle-down',
      frames: [{ key: 'player', frame: 0 }], frameRate: 1
    });
    this.anims.create({
      key: 'player-idle-left',
      frames: [{ key: 'player', frame: 4 }], frameRate: 1
    });
    this.anims.create({
      key: 'player-idle-right',
      frames: [{ key: 'player', frame: 8 }], frameRate: 1
    });
    this.anims.create({
      key: 'player-idle-up',
      frames: [{ key: 'player', frame: 12 }], frameRate: 1
    });

    this.scene.start('MenuScene');
  }
}

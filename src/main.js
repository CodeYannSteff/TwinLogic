import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { HubScene } from './scenes/HubScene.js';
import { EgyptScene } from './scenes/EgyptScene.js';
import { RomeScene } from './scenes/RomeScene.js';
import { ModernScene } from './scenes/ModernScene.js';
import { DeckBuildScene } from './scenes/DeckBuildScene.js';
import { DialogScene } from './scenes/DialogScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 640,
  height: 400,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, HubScene, EgyptScene, RomeScene, ModernScene, DeckBuildScene, DialogScene]
};

const game = new Phaser.Game(config);

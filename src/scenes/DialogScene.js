import Phaser from 'phaser';

// Reserved for future use as an overlay scene for card management UI
export class DialogScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogScene' });
  }

  create() {
    // This scene can be launched as an overlay for inventory/card management
  }
}

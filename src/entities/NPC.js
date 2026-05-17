import Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, config.texture || 'npc');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setImmovable(true);
    this.body.setSize(14, 16);
    this.body.setOffset(9, 14);
    this.setDepth(9);

    this.npcName = config.name || 'NPC';
    this.dialogueKey = config.dialogueKey || 'default';
    this.interactRange = config.interactRange || 32;
    this.hasInteracted = false;

    this.nameLabel = scene.add.text(x, y - 20, this.npcName, {
      fontSize: '12px', fontFamily: 'monospace', color: '#c8a84e',
      stroke: '#000000', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(15);

    // Prompt label which becomes visible only when the player enters the interaction range
    this.prompt = scene.add.text(x, y + 22, '[E] Talk', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffdd66',
      stroke: '#000000', strokeThickness: 2, align: 'center'
    }).setOrigin(0.5).setDepth(15).setAlpha(0);
  }

  update(player) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    this.prompt.setAlpha(dist <= this.interactRange ? 1 : 0);
    this.nameLabel.setPosition(this.x, this.y - 20);
    this.prompt.setPosition(this.x, this.y + 20);
  }

  isInRange(player) {
    return Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= this.interactRange;
  }
}

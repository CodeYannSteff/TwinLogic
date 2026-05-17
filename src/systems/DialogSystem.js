import Phaser from 'phaser';

export class DialogSystem {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this.lines = [];
    this.currentLine = 0;
    this.container = null;
    this.textObj = null;
    this.nameObj = null;
    this.promptObj = null;
    this.onComplete = null;
    this.typewriterTimer = null;
    this.fullText = '';
    this.displayedChars = 0;
    this._advanceCooldown = 0;

    this.advanceKeys = {
      E: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      ENTER: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      SPACE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    };

    this.createUI();
  }

  createUI() {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;

    this.container = this.scene.add.container(0, 0).setDepth(100).setScrollFactor(0).setVisible(false);

    // Build wooden aesthetic dialog container
    const boxY = h - 70;
    const boxH = 120;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x5a4a2a, 1);
    bg.fillRoundedRect(20, boxY - boxH / 2, w - 40, boxH, 8);
    bg.fillStyle(0x1a1228, 0.95);
    bg.fillRoundedRect(24, boxY - boxH / 2 + 4, w - 48, boxH - 8, 6);
    bg.lineStyle(2, 0xc8a84e, 0.6);
    bg.strokeRoundedRect(22, boxY - boxH / 2 + 2, w - 44, boxH - 4, 7);

    // Gold-rimmed ornate floating nameplate
    const namePlate = this.scene.add.graphics();
    namePlate.fillStyle(0x3a2a12, 1);
    namePlate.fillRoundedRect(30, boxY - boxH / 2 - 16, 180, 28, 6);
    namePlate.lineStyle(1, 0xc8a84e, 0.5);
    namePlate.strokeRoundedRect(30, boxY - boxH / 2 - 16, 180, 28, 6);

    this.nameObj = this.scene.add.text(120, boxY - boxH / 2 - 2, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#c8a84e',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);

    // Dialog text
    this.textObj = this.scene.add.text(38, boxY - boxH / 2 + 20, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#dde0ee',
      wordWrap: { width: w - 80 }, lineSpacing: 6
    });

    // Continue prompt
    this.promptObj = this.scene.add.text(w - 40, boxY + boxH / 2 - 18, '▼', {
      fontSize: '16px', fontFamily: 'monospace', color: '#c8a84e'
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: this.promptObj,
      y: this.promptObj.y - 4,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    this.container.add([bg, namePlate, this.nameObj, this.textObj, this.promptObj]);
  }

  show(dialogueLines, onComplete = null) {
    if (!dialogueLines || dialogueLines.length === 0) return;
    this.lines = dialogueLines;
    this.currentLine = 0;
    this.onComplete = onComplete;
    this.isActive = true;
    this.container.setVisible(true);
    this._advanceCooldown = 300; // 300ms skip protection delay when opening dialog
    this.showLine();
  }

  update(time, delta) {
    if (!this.isActive) return;

    if (this._advanceCooldown > 0) {
      this._advanceCooldown -= delta;
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.advanceKeys.E) ||
        Phaser.Input.Keyboard.JustDown(this.advanceKeys.ENTER) ||
        Phaser.Input.Keyboard.JustDown(this.advanceKeys.SPACE)) {
      this.advance();
    }
  }

  showLine() {
    const line = this.lines[this.currentLine];
    this.nameObj.setText(line.speaker || '');
    this.fullText = line.text || '';
    this.displayedChars = 0;
    this.textObj.setText('');
    this.promptObj.setVisible(false);

    // Typewriter text printing at 25ms speed intervals
    if (this.typewriterTimer) this.typewriterTimer.remove();
    this.typewriterTimer = this.scene.time.addEvent({
      delay: 25,
      repeat: this.fullText.length - 1,
      callback: () => {
        this.displayedChars++;
        this.textObj.setText(this.fullText.substring(0, this.displayedChars));
        if (this.displayedChars >= this.fullText.length) {
          this.promptObj.setVisible(true);
        }
      }
    });
  }

  advance() {
    if (!this.isActive) return;

    // Fast-forward dialogue rendering on subsequent button presses
    if (this.displayedChars < this.fullText.length) {
      if (this.typewriterTimer) this.typewriterTimer.remove();
      this.displayedChars = this.fullText.length;
      this.textObj.setText(this.fullText);
      this.promptObj.setVisible(true);
      return;
    }

    // Next line
    this.currentLine++;
    if (this.currentLine < this.lines.length) {
      this.showLine();
    } else {
      this.hide();
    }
  }

  hide() {
    this.isActive = false;
    this.container.setVisible(false);
    if (this.typewriterTimer) this.typewriterTimer.remove();
    if (this.onComplete) this.onComplete();
  }
}

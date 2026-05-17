import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { CardManager } from '../systems/CardManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { LoreSystem } from '../systems/LoreSystem.js';
import { HUD } from '../ui/HUD.js';
import { MapBuilder } from '../utils/MapBuilder.js';
import dialogueData from '../data/dialogue.json';
import enemyData from '../data/enemies.json';
import loreData from '../data/lore.json';

const MODERN_LAYOUT = [
  '####################################',
  '#..................................#',
  '#..S...............................#',
  '#..................................#',
  '#....L.............................#',
  '#################..#################',
  '................#..#................',
  '................#..#................',
  '....############..############......',
  '....#......................#........',
  '....#..E............E......#........',
  '....#......................#........',
  '....#..........C...........#........',
  '....#......................#........',
  '....#..E............E......#........',
  '....############..############......',
  '................#..#................',
  '................#..#................',
  '....############..############......',
  '....#......................#........',
  '....#..E.....E........E....#........',
  '....#......................#........',
  '....#....C..........L......#........',
  '....#......................#........',
  '....############..############......',
  '................#..#................',
  '................#..#................',
  '..################..################',
  '..#................................#',
  '..#..E...........E.........L.......#',
  '..#................................#',
  '..#..........C.....................#',
  '..#..E...............E.............#',
  '..#................................#',
  '..################..################',
  '................#..#................',
  '................#..#................',
  '....############..############......',
  '....#......................#........',
  '....#..E....E......E....E..#........',
  '....#......................#........',
  '....#.........C............#........',
  '....#..E..............E....#........',
  '....############..############......',
  '................#..#................',
  '................#..#................',
  '....############..############......',
  '....#......................#........',
  '....#..E.......L........E..#........',
  '....#......................#........',
  '....#..C...........C.......#........',
  '....#......................#........',
  '....############..############......',
  '................#..#................',
  '................#..#................',
  '....############..############......',
  '....#......................#........',
  '....#..E............E......#........',
  '....#......................#........',
  '....#........L.............#........',
  '....############..############......',
  '................#..#................',
  '................#..#................',
  '...##############..##############...',
  '...#............................#...',
  '...#..........B.................#...',
  '...#............................#...',
  '...##############################...',
];

export class ModernScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModernScene' });
  }

  create() {
    this._transitioning = false;
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(500);

    this.mapBuilder = new MapBuilder(this);
    this.mapBuilder.build(MODERN_LAYOUT, 'tile-floor-modern', 'tile-wall-modern');

    const spawn = this.mapBuilder.spawnPoints.player;
    this.player = new Player(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player, this.mapBuilder.walls);
    this.cameras.main.centerOn(spawn.x, spawn.y);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    if (this.registry.get('playerHp')) {
      this.player.hp = this.registry.get('playerHp');
    }

    // Initialize stateful combat card inventory manager
    this.cardManager = new CardManager(this);
    if (this.registry.get('cardState')) {
      this.cardManager.loadState(this.registry.get('cardState'));
    }

    // Instanciate our core gameplay managers and load achievement states
    this.combatSystem = new CombatSystem(this);
    this.dialogSystem = new DialogSystem(this);
    this.loreSystem = new LoreSystem(this);

    Object.entries(loreData.entries).forEach(([id, entry]) => {
      this.loreSystem.registerLore(id, entry);
    });
    if (this.registry.get('loreState')) {
      this.loreSystem.loadState(this.registry.get('loreState'));
    }

    this.hud = new HUD(this, this.player, this.cardManager);
    this.hud.setZoneName('The Lab — Present Day');

    this.enemies = this.physics.add.group();
    const modernTypes = ['void_fragment', 'void_sentinel', 'void_caster'];
    this.mapBuilder.spawnPoints.enemies.forEach((pos, i) => {
      const type = modernTypes[i % modernTypes.length];
      const data = enemyData.modern[type];
      const enemy = new Enemy(this, pos.x, pos.y, { ...data, texture: 'enemy-modern' });
      this.enemies.add(enemy);
      this.physics.add.collider(enemy, this.mapBuilder.walls);
    });

    this.bossAlive = true;
    this.bossPhase = 1;
    if (this.mapBuilder.spawnPoints.boss) {
      const bossPos = this.mapBuilder.spawnPoints.boss;
      const bossData = enemyData.modern.boss_eraser;
      this.boss = new Enemy(this, bossPos.x, bossPos.y, { ...bossData, texture: 'boss-modern' });
      this.enemies.add(this.boss);
      this.physics.add.collider(this.boss, this.mapBuilder.walls);

      this.bossMaxHp = bossData.hp;
    }

    this.physics.add.collider(this.player, this.enemies);

    // Lore
    const loreIds = ['lore_eraser_origin', 'lore_void_nature', 'lore_nexus_point', 'lore_guardian_sacrifice', 'lore_chrono_cards'];
    this.mapBuilder.spawnPoints.lore.forEach((pos, i) => {
      const loreId = loreIds[i] || loreIds[0];
      if (this.loreSystem.hasLore(loreId)) return;
      const scroll = this.physics.add.staticImage(pos.x, pos.y, 'lore-scroll').setDepth(5);
      scroll.loreId = loreId;
      this.physics.add.overlap(this.player, scroll, () => {
        if (this.loreSystem.collectLore(scroll.loreId)) scroll.destroy();
      });
    });

    // Card pickups (chrono cards)
    const cardIds = ['time_rewind', 'temporal_freeze', 'void_blast'];
    this.mapBuilder.spawnPoints.cards.forEach((pos, i) => {
      const cardId = cardIds[i];
      if (!cardId || this.cardManager.inventory.includes(cardId)) return;
      const pickup = this.physics.add.staticImage(pos.x, pos.y, 'card-pickup').setDepth(5);
      pickup.cardId = cardId;
      this.tweens.add({ targets: pickup, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });
      this.physics.add.overlap(this.player, pickup, () => {
        if (this.cardManager.addCard(pickup.cardId)) {
          this.hud.showCardPickup(this.cardManager.getCard(pickup.cardId).name);
          pickup.destroy();
        }
      });
    });

    // Card input
    this.cardKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
    ];

    this.events.on('enemy-killed', (enemy) => {
      if (enemy === this.boss || (enemy && enemy.name === 'The Eraser')) {
        this.bossAlive = false;
        this.showVictory();
      }
    });

    this.events.on('player-death', () => this.respawnPlayer());

    this.time.addEvent({
      delay: 3000, repeat: -1,
      callback: () => {
        this.player._rewindData = { x: this.player.x, y: this.player.y, hp: this.player.hp };
      }
    });

    this.addModernDecorations();

    // Intro
    this.time.delayedCall(500, () => {
      this.dialogSystem.show(dialogueData.modern_final);
    });
  }

  showVictory() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dramatic flash
    this.cameras.main.flash(1000, 255, 255, 255);

    this.time.delayedCall(1500, () => {
      this.dialogSystem.show([
        { speaker: 'Kael', text: 'It\'s over. The timelines are stabilized.' },
        { speaker: 'Dr. Elena Voss', text: 'You did it, Kael. Every era, every life — preserved because of you.' },
        { speaker: 'Kael', text: 'I am the Guardian. This is what I was made for.' },
        { speaker: '', text: 'The temporal rifts seal shut. History breathes once more.' },
        { speaker: '', text: 'But somewhere in the fabric of time, a new thread begins to unravel...' },
        { speaker: '', text: 'CHRONOS GUARDIAN — Thank you for playing!' }
      ], () => {
        this.cameras.main.fadeOut(2000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          const state = this.registry.get('gameState');
          state.modernComplete = true;
          this.scene.start('MenuScene');
        });
      });
    });
  }

  respawnPlayer() {
    const spawn = this.mapBuilder.spawnPoints.player;
    this.player.setPosition(spawn.x, spawn.y);
    this.player.hp = this.player.maxHp;
    this.player.isInvulnerable = false;
    this.player.setAlpha(1);
  }

  update(time, delta) {
    if (!this.player || !this.dialogSystem || !this.hud) return;
    this.dialogSystem.update(time, delta);
    this.hud.update(time);

    if (this.dialogSystem.isActive) {
      this.player.body.setVelocity(0, 0);
      return;
    }

    this.player.update();

    this.cardKeys.forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        const card = this.cardManager.useCard(i, time);
        if (card) this.combatSystem.executeCard(card, this.player, this.enemies);
      }
    });

    // Boss phase transitions
    if (this.boss && this.boss.active && this.bossAlive) {
      const hpPercent = this.boss.hp / this.bossMaxHp;
      if (hpPercent <= 0.5 && this.bossPhase === 1) {
        this.bossPhase = 2;
        this.boss.speed = 40;
        this.boss.damage = 25;
        this.boss.setTint(0x440066);

        // Spawn reinforcements
        for (let i = 0; i < 3; i++) {
          const data = enemyData.modern.void_fragment;
          const e = new Enemy(this, this.boss.x + Phaser.Math.Between(-40, 40),
            this.boss.y + Phaser.Math.Between(-40, 40), { ...data, texture: 'enemy-modern' });
          this.enemies.add(e);
          this.physics.add.collider(e, this.mapBuilder.walls);
        }

        const msg = this.add.text(this.cameras.main.width / 2, 60, 'The Eraser grows stronger!', {
          fontSize: '16px', fontFamily: 'monospace', color: '#ff44ff',
          backgroundColor: '#220033', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
        this.tweens.add({ targets: msg, alpha: 0, duration: 2000, delay: 1500, onComplete: () => msg.destroy() });
      }
    }

    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update(time, this.player);
    });
  }

  addModernDecorations() {
    // Consoles flanking room entrances
    const consolePositions = [
      { x: 5, y: 8 }, { x: 29, y: 8 },
      { x: 5, y: 18 }, { x: 29, y: 18 },
      { x: 3, y: 27 }, { x: 33, y: 27 },
      { x: 5, y: 37 }, { x: 29, y: 37 },
      { x: 5, y: 46 }, { x: 29, y: 46 },
      { x: 5, y: 55 }, { x: 29, y: 55 },
      { x: 4, y: 63 }, { x: 31, y: 63 }
    ];
    consolePositions.forEach(p => {
      this.add.image(p.x * 16 + 8, p.y * 16 + 8, 'deco-console').setDepth(2);
    });

    // Emergency lighting along corridors
    const lightPositions = [
      { x: 15, y: 7 }, { x: 18, y: 7 },
      { x: 15, y: 16 }, { x: 18, y: 16 },
      { x: 15, y: 25 }, { x: 18, y: 25 },
      { x: 15, y: 35 }, { x: 18, y: 35 },
      { x: 15, y: 44 }, { x: 18, y: 44 },
      { x: 15, y: 53 }, { x: 18, y: 53 },
      { x: 15, y: 61 }, { x: 18, y: 61 }
    ];
    lightPositions.forEach(p => {
      const glow = this.add.circle(p.x * 16 + 8, p.y * 16 + 8, 20, 0xff2244, 0.05).setDepth(1);
      this.tweens.add({
        targets: glow, alpha: 0.12, scale: 1.4,
        duration: 800, yoyo: true, repeat: -1
      });
    });

    // Void corruption patches inside rooms
    const corridorTiles = [
      { x: 10, y: 12 }, { x: 22, y: 22 },
      { x: 8, y: 32 }, { x: 22, y: 41 },
      { x: 10, y: 50 }, { x: 22, y: 58 },
      { x: 15, y: 66 }
    ];
    corridorTiles.forEach(p => {
      const patch = this.add.circle(p.x * 16, p.y * 16, Phaser.Math.Between(8, 14), 0x330066, 0.15).setDepth(1);
      this.tweens.add({
        targets: patch, alpha: 0.05, scale: 0.5,
        duration: 2000 + Math.random() * 1000, yoyo: true, repeat: -1
      });
    });
  }
}

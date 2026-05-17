import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { NPC } from '../entities/NPC.js';
import { CardManager } from '../systems/CardManager.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { LoreSystem } from '../systems/LoreSystem.js';
import { HUD } from '../ui/HUD.js';
import { MapBuilder } from '../utils/MapBuilder.js';
import dialogueData from '../data/dialogue.json';
import enemyData from '../data/enemies.json';
import loreData from '../data/lore.json';

const ROME_LAYOUT = [
  '####################################',
  '#..................................#',
  '#..S..........N..........L.........#',
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
  '..#..E.........N..........E........#',
  '..#................................#',
  '..#...........C.........L..........#',
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
  '....#..E...N............E..#........',
  '....#......................#........',
  '....#........L.............#........',
  '....############..############......',
  '................#..#................',
  '................#..#................',
  '...##############..##############...',
  '...#............................#...',
  '...#..........B.................#...',
  '...#............................#...',
  '...#..........P.................#...',
  '...##############################...',
];

export class RomeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RomeScene' });
  }

  create() {
    this._transitioning = false;
    this.sfx = this.registry.get('soundManager');
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(500);

    this.mapBuilder = new MapBuilder(this);
    this.mapBuilder.build(ROME_LAYOUT, 'tile-floor-rome', 'tile-wall-rome');

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
    this.hud.setZoneName('Roman Empire — 44 BC');

    this.enemies = this.physics.add.group();
    const romeTypes = ['temporal_legionary', 'phantom_centurion', 'roman_archer', 'praetorian_guard'];
    this.mapBuilder.spawnPoints.enemies.forEach((pos, i) => {
      const type = romeTypes[i % romeTypes.length];
      const data = enemyData.rome[type];
      const enemy = new Enemy(this, pos.x, pos.y, { ...data, texture: 'enemy-rome' });
      this.enemies.add(enemy);
      this.physics.add.collider(enemy, this.mapBuilder.walls);
    });

    this.bossAlive = true;
    if (this.mapBuilder.spawnPoints.boss) {
      const bossPos = this.mapBuilder.spawnPoints.boss;
      const bossData = enemyData.rome.boss_temporal_anomaly;
      this.boss = new Enemy(this, bossPos.x, bossPos.y, { ...bossData, texture: 'boss-rome' });
      this.enemies.add(this.boss);
      this.physics.add.collider(this.boss, this.mapBuilder.walls);
    }

    this.physics.add.collider(this.player, this.enemies);

    // NPCs
    this.npcs = [];
    const npcConfigs = [
      { name: 'Brutus', dialogueKey: 'rome_brutus', texture: 'npc-brutus' },
      { name: 'Senator', dialogueKey: 'rome_senator', texture: 'npc-senator' }
    ];
    this.mapBuilder.spawnPoints.npcs.forEach((pos, i) => {
      const config = npcConfigs[i] || npcConfigs[0];
      const npc = new NPC(this, pos.x, pos.y, config);
      this.npcs.push(npc);
      this.physics.add.collider(npc, this.mapBuilder.walls);
    });

    // Lore
    const loreIds = ['lore_ides_of_march', 'lore_roman_engineering', 'lore_colosseum_rift', 'lore_senate_conspiracy', 'lore_legion_lost', 'lore_timeline_bleed'];
    this.mapBuilder.spawnPoints.lore.forEach((pos, i) => {
      const loreId = loreIds[i] || loreIds[0];
      if (this.loreSystem.hasLore(loreId)) return;
      const scroll = this.physics.add.staticImage(pos.x, pos.y, 'lore-scroll').setDepth(5);
      scroll.loreId = loreId;
      this.physics.add.overlap(this.player, scroll, () => {
        if (this.loreSystem.collectLore(scroll.loreId)) {
          if (this.sfx) this.sfx.lorePickup();
          scroll.destroy();
        }
      });
    });

    // Card pickup
    const cardIds = ['greek_fire', 'mercurys_sprint', 'chain_lightning', 'pilum_throw', 'phalanx_shield'];
    this.mapBuilder.spawnPoints.cards.forEach((pos, i) => {
      const cardId = cardIds[i];
      if (!cardId || this.cardManager.inventory.includes(cardId)) return;
      const pickup = this.physics.add.staticImage(pos.x, pos.y, 'card-pickup').setDepth(5);
      pickup.cardId = cardId;
      this.tweens.add({ targets: pickup, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });
      this.physics.add.overlap(this.player, pickup, () => {
        if (this.cardManager.addCard(pickup.cardId)) {
          this.hud.showCardPickup(this.cardManager.getCard(pickup.cardId).name);
          if (this.sfx) this.sfx.cardPickup();
          pickup.destroy();
        }
      });
    });

    // Return portal
    const portalSpawn = this.mapBuilder.spawnPoints.portals[0];
    if (portalSpawn) {
      this.returnPortal = this.add.image(portalSpawn.x, portalSpawn.y, 'tile-portal').setDepth(2).setVisible(false);
      this.returnLabel = this.add.text(portalSpawn.x, portalSpawn.y - 18, 'Return [Walk Here]', {
        fontSize: '12px', fontFamily: 'monospace', color: '#aa88ff',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(15).setVisible(false);
      this._returnPortalPos = { x: portalSpawn.x, y: portalSpawn.y };
    }

    // Card input
    this.cardKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
    ];

    // NPC interaction
    this.player.interactKey.on('down', () => {
      if (this.dialogSystem.isActive) return;
      this.npcs.forEach(npc => {
        if (npc.isInRange(this.player)) {
          this.dialogSystem.show(dialogueData[npc.dialogueKey]);
        }
      });
    });

    this.events.on('enemy-killed', (enemy) => {
      if (this.sfx) this.sfx.enemyDie();
      if (enemy === this.boss || (enemy && enemy.name === 'Temporal Anomaly')) {
        this.bossAlive = false;
        if (this.sfx) this.sfx.bossDefeat();
        this.showBossDefeated();
      }
    });

    this.events.on('player-death', () => {
      if (this.sfx) this.sfx.playerDie();
      this.respawnPlayer();
    });

    this.time.addEvent({
      delay: 3000, repeat: -1,
      callback: () => {
        this.player._rewindData = { x: this.player.x, y: this.player.y, hp: this.player.hp };
      }
    });

    this.addRomeDecorations();

    if (!this.registry.get('romeVisited')) {
      this.registry.set('romeVisited', true);
      this.time.delayedCall(500, () => {
        this.dialogSystem.show([
          { speaker: 'Kael', text: 'The Forum of Rome... marble columns and the scent of conspiracy.' },
          { speaker: 'Kael', text: 'Caesar must fall today, as history demands. I need to find Brutus.' }
        ]);
      });
    }
  }

  showBossDefeated() {
    if (this.returnPortal) {
      this.returnPortal.setVisible(true);
      this.returnLabel.setVisible(true);
    }
    const w = this.cameras.main.width;
    const msg = this.add.text(w / 2, 60, 'Temporal Anomaly Destroyed!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#aa88ff',
      backgroundColor: '#110022', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);
    this.tweens.add({ targets: msg, alpha: 0, duration: 3000, delay: 2000, onComplete: () => msg.destroy() });
  }

  completeZone() {
    if (this._transitioning) return;
    this._transitioning = true;
    if (this.sfx) this.sfx.portalEnter();
    const state = this.registry.get('gameState');
    state.romeComplete = true;
    this.registry.set('cardState', this.cardManager.getState());
    this.player.hp = this.player.maxHp;
    this.registry.set('playerHp', this.player.maxHp);
    this.registry.set('loreState', this.loreSystem.getState());
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('HubScene');
    });
  }

  respawnPlayer() {
    const spawn = this.mapBuilder.spawnPoints.player;
    this.player.setPosition(spawn.x, spawn.y);
    this.player.hp = this.player.maxHp;
    this.player.isInvulnerable = false;
    this.player.setAlpha(1);
  }

  addRomeDecorations() {
    // Pillars flanking room entrances
    const pillarPositions = [
      { x: 5, y: 8 }, { x: 29, y: 8 },
      { x: 5, y: 18 }, { x: 29, y: 18 },
      { x: 3, y: 27 }, { x: 33, y: 27 },
      { x: 5, y: 37 }, { x: 29, y: 37 },
      { x: 5, y: 46 }, { x: 29, y: 46 },
      { x: 5, y: 55 }, { x: 29, y: 55 },
      { x: 4, y: 63 }, { x: 31, y: 63 }
    ];
    pillarPositions.forEach(p => {
      this.add.image(p.x * 16 + 8, p.y * 16, 'deco-pillar').setDepth(2);
    });

    // Torches at corridor junctions
    const torchPositions = [
      { x: 15, y: 6 }, { x: 18, y: 6 },
      { x: 15, y: 16 }, { x: 18, y: 16 },
      { x: 15, y: 25 }, { x: 18, y: 25 },
      { x: 15, y: 35 }, { x: 18, y: 35 },
      { x: 15, y: 44 }, { x: 18, y: 44 },
      { x: 15, y: 53 }, { x: 18, y: 53 },
      { x: 15, y: 61 }, { x: 18, y: 61 }
    ];
    torchPositions.forEach(p => {
      this.add.image(p.x * 16 + 8, p.y * 16, 'deco-torch').setDepth(3);
      const glow = this.add.circle(p.x * 16 + 8, p.y * 16, 16, 0xff8800, 0.06).setDepth(1);
      this.tweens.add({
        targets: glow, alpha: 0.12, scale: 1.3,
        duration: 1000 + Math.random() * 500, yoyo: true, repeat: -1
      });
    });

    // Flower patches in spawn room
    [{ x: 20, y: 3 }, { x: 25, y: 2 }, { x: 30, y: 3 }].forEach(p => {
      this.add.image(p.x * 16 + 8, p.y * 16 + 8, 'deco-flowers').setDepth(1);
    });
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
        if (card) { if (this.sfx) this.sfx.playerAttack(); this.combatSystem.executeCard(card, this.player, this.enemies); }
      }
    });

    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update(time, this.player);
    });

    this.npcs.forEach(npc => npc.update(this.player));

    // Return portal proximity check
    if (this._returnPortalPos && this.returnPortal && this.returnPortal.visible && !this._transitioning) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, this._returnPortalPos.x, this._returnPortalPos.y
      );
      if (dist < 24) {
        this.completeZone();
      }
    }
  }
}

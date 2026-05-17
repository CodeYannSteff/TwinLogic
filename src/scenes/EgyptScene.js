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

const EGYPT_LAYOUT = [
  '####################################',
  '#..................................#',
  '#..S..........N..........L.........#',
  '#..................................#',
  '#....L.............................#',
  '#################..#################',
  '................#..#................',
  '................#..#................',
  '.....###########..###########.......',
  '.....#....................#.........',
  '.....#..E..........E.....#..........',
  '.....#....................#.........',
  '.....#.........C..........#.........',
  '.....#....................#.........',
  '.....#..E..........E.....#..........',
  '.....###########..###########.......',
  '................#..#................',
  '................#..#................',
  '.....###########..###########.......',
  '.....#....................#.........',
  '.....#..E....E......E....#..........',
  '.....#....................#.........',
  '.....#...C..........L....#..........',
  '.....#....................#.........',
  '.....###########..###########.......',
  '................#..#................',
  '................#..#................',
  '..################..################',
  '..#................................#',
  '..#..E.......N...........E.........#',
  '..#................................#',
  '..#..........C.........L...........#',
  '..#..E..............E..............#',
  '..#................................#',
  '..################..################',
  '................#..#................',
  '................#..#................',
  '.....###########..###########.......',
  '.....#....................#.........',
  '.....#..E...E.....E...E..#..........',
  '.....#....................#.........',
  '.....#........C..........#..........',
  '.....#..E.............E..#..........',
  '.....###########..###########.......',
  '................#..#................',
  '................#..#................',
  '.....###########..###########.......',
  '.....#....................#.........',
  '.....#..E......L......E..#..........',
  '.....#....................#.........',
  '.....#..C..........C.....#..........',
  '.....#....................#.........',
  '.....###########..###########.......',
  '................#..#................',
  '................#..#................',
  '.....###########..###########.......',
  '.....#....................#.........',
  '.....#..E..N..........E..#..........',
  '.....#....................#.........',
  '.....#.......L............#.........',
  '.....###########..###########.......',
  '................#..#................',
  '................#..#................',
  '...##############..##############...',
  '...#............................#...',
  '...#..........B.................#...',
  '...#............................#...',
  '...#..........P.................#...',
  '...##############################...',
];

export class EgyptScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EgyptScene' });
  }

  create() {
    this._transitioning = false;
    this.sfx = this.registry.get('soundManager');
    console.log('[EgyptScene] create START');
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(500);

    this.mapBuilder = new MapBuilder(this);
    this.mapBuilder.build(EGYPT_LAYOUT, 'tile-floor-egypt', 'tile-wall-egypt');

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
    this.hud.setZoneName('Ancient Egypt');

    this.enemies = this.physics.add.group();
    const egyptTypes = ['corrupted_guard', 'sand_wraith', 'desert_archer'];
    this.mapBuilder.spawnPoints.enemies.forEach((pos, i) => {
      const type = egyptTypes[i % egyptTypes.length];
      const data = enemyData.egypt[type];
      const enemy = new Enemy(this, pos.x, pos.y, { ...data, texture: 'enemy-egypt' });
      this.enemies.add(enemy);
      this.physics.add.collider(enemy, this.mapBuilder.walls);
    });

    this.bossAlive = true;
    if (this.mapBuilder.spawnPoints.boss) {
      const bossPos = this.mapBuilder.spawnPoints.boss;
      const bossData = enemyData.egypt.boss_medjay_captain;
      this.boss = new Enemy(this, bossPos.x, bossPos.y, { ...bossData, texture: 'boss-egypt' });
      this.enemies.add(this.boss);
      this.physics.add.collider(this.boss, this.mapBuilder.walls);
    }

    this.physics.add.collider(this.player, this.enemies);

    // NPCs
    this.npcs = [];
    const npcConfigs = [
      { name: 'Imhotep', dialogueKey: 'egypt_imhotep', texture: 'npc-imhotep' },
      { name: 'Worker', dialogueKey: 'egypt_worker', texture: 'npc-worker' },
      { name: 'Priestess', dialogueKey: 'egypt_worker', texture: 'npc-worker' }
    ];
    this.mapBuilder.spawnPoints.npcs.forEach((pos, i) => {
      const config = npcConfigs[i] || npcConfigs[0];
      const npc = new NPC(this, pos.x, pos.y, config);
      this.npcs.push(npc);
      this.physics.add.collider(npc, this.mapBuilder.walls);
    });

    // Lore scrolls
    this.lorePickups = [];
    const loreIds = ['lore_pyramid_secret', 'lore_nile_power', 'lore_ankh_meaning', 'lore_scarab_swarm', 'lore_pharaoh_curse', 'lore_guardian_origin'];
    this.mapBuilder.spawnPoints.lore.forEach((pos, i) => {
      const loreId = loreIds[i] || loreIds[0];
      if (this.loreSystem.hasLore(loreId)) return;
      const scroll = this.physics.add.staticImage(pos.x, pos.y, 'lore-scroll').setDepth(5);
      scroll.loreId = loreId;
      this.lorePickups.push(scroll);
      this.physics.add.overlap(this.player, scroll, () => {
        if (this.loreSystem.collectLore(scroll.loreId)) {
          if (this.sfx) this.sfx.lorePickup();
          scroll.destroy();
        }
      });
    });

    // Card pickup
    this.cardPickups = [];
    const cardIds = ['pharaohs_flame', 'sandstorm_veil', 'niles_blessing', 'ankh_of_life'];
    this.mapBuilder.spawnPoints.cards.forEach((pos, i) => {
      const cardId = cardIds[i];
      if (!cardId || this.cardManager.inventory.includes(cardId)) return;
      const pickup = this.physics.add.staticImage(pos.x, pos.y, 'card-pickup').setDepth(5);
      pickup.cardId = cardId;
      this.cardPickups.push(pickup);

      // Glow pulse
      this.tweens.add({
        targets: pickup,
        alpha: 0.5,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      this.physics.add.overlap(this.player, pickup, () => {
        if (this.cardManager.addCard(pickup.cardId)) {
          const card = this.cardManager.getCard(pickup.cardId);
          this.hud.showCardPickup(card.name);
          if (this.sfx) this.sfx.cardPickup();
          pickup.destroy();
        }
      });
    });

    // Warp points
    this.mapBuilder.spawnPoints.warps.forEach((pos, i) => {
      const warp = this.physics.add.staticImage(pos.x, pos.y, 'warp-point').setDepth(3);
      this.tweens.add({
        targets: warp,
        scale: 1.2,
        alpha: 0.6,
        duration: 600,
        yoyo: true,
        repeat: -1
      });
    });

    // Return portal (visible after boss killed)
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
          // Give card after Imhotep dialogue
          const isImhotep = npc.npcName === 'Imhotep' && !npc.hasInteracted;
          this.dialogSystem.show(dialogueData[npc.dialogueKey], () => {
            if (isImhotep) {
              npc.hasInteracted = true;
              if (this.cardManager.addCard('pharaohs_flame')) {
                const card = this.cardManager.getCard('pharaohs_flame');
                this.hud.showCardPickup(card.name);
              }
            }
          });
        }
      });
    });

    // Enemy killed event
    this.events.on('enemy-killed', (enemy) => {
      if (this.sfx) this.sfx.enemyDie();
      if (enemy === this.boss || (enemy && enemy.name === 'Captain Amenhotep')) {
        this.bossAlive = false;
        if (this.sfx) this.sfx.bossDefeat();
        this.showBossDefeated();
      }
    });

    // Player death
    this.events.on('player-death', () => {
      if (this.sfx) this.sfx.playerDie();
      this.respawnPlayer();
    });

    // Record rewind position periodically
    this.time.addEvent({
      delay: 3000,
      repeat: -1,
      callback: () => {
        this.player._rewindData = { x: this.player.x, y: this.player.y, hp: this.player.hp };
      }
    });

    // Environment decorations
    this.addEgyptDecorations();

    console.log('[EgyptScene] decorations done, setting up intro');
    // Intro dialogue on first visit
    if (!this.registry.get('egyptVisited')) {
      this.registry.set('egyptVisited', true);
      this.time.delayedCall(500, () => {
        this.dialogSystem.show([
          { speaker: 'Kael', text: 'The air is thick with sand and ancient power. I can feel the temporal distortion...' },
          { speaker: 'Kael', text: 'I need to find Imhotep. He may know what\'s causing the corruption here.' }
        ]);
      });
    }
    console.log('[EgyptScene] create COMPLETE');
  }

  showBossDefeated() {
    // Show return portal
    if (this.returnPortal) {
      this.returnPortal.setVisible(true);
      this.returnLabel.setVisible(true);
    }

    const w = this.cameras.main.width;
    const msg = this.add.text(w / 2, 60, 'Captain Amenhotep Defeated!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffaa00',
      backgroundColor: '#221100', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 3000,
      delay: 2000,
      onComplete: () => msg.destroy()
    });
  }

  completeZone() {
    if (this._transitioning) return;
    this._transitioning = true;
    if (this.sfx) this.sfx.portalEnter();

    const state = this.registry.get('gameState');
    state.egyptComplete = true;

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

  addEgyptDecorations() {
    // Torches at corridor entrances and room entries
    const torchPositions = [
      { x: 15, y: 6 }, { x: 18, y: 6 },
      { x: 6, y: 8 }, { x: 27, y: 8 },
      { x: 6, y: 18 }, { x: 27, y: 18 },
      { x: 3, y: 27 }, { x: 32, y: 27 },
      { x: 6, y: 37 }, { x: 27, y: 37 },
      { x: 6, y: 47 }, { x: 27, y: 47 },
      { x: 6, y: 55 }, { x: 27, y: 55 },
      { x: 4, y: 63 }, { x: 31, y: 63 }
    ];
    torchPositions.forEach(p => {
      this.add.image(p.x * 16 + 8, p.y * 16, 'deco-torch').setDepth(3);
      const glow = this.add.circle(p.x * 16 + 8, p.y * 16, 16, 0xff8800, 0.06).setDepth(1);
      this.tweens.add({
        targets: glow, alpha: 0.12, scale: 1.3,
        duration: 1000 + Math.random() * 500, yoyo: true, repeat: -1
      });
    });

    // Pots in rooms
    const potPositions = [
      { x: 8, y: 12 }, { x: 22, y: 22 }, { x: 6, y: 32 },
      { x: 22, y: 41 }, { x: 8, y: 50 }, { x: 22, y: 58 }
    ];
    potPositions.forEach(p => {
      this.add.image(p.x * 16 + 8, p.y * 16 + 8, 'deco-pot').setDepth(2);
    });

    // Palm trees near spawn
    const palmPositions = [{ x: 20, y: 2 }, { x: 25, y: 3 }, { x: 30, y: 2 }];
    palmPositions.forEach(p => {
      this.add.image(p.x * 16 + 8, p.y * 16 - 8, 'deco-palm').setDepth(2);
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

    // Card usage
    this.cardKeys.forEach((key, i) => {
      if (Phaser.Input.Keyboard.JustDown(key)) {
        const card = this.cardManager.useCard(i, time);
        if (card) {
          if (this.sfx) this.sfx.playerAttack();
          this.combatSystem.executeCard(card, this.player, this.enemies);
        }
      }
    });

    // Enemy AI
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.active) enemy.update(time, this.player);
    });

    // NPCs
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

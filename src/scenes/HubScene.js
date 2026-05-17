import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { CardManager } from '../systems/CardManager.js';
import { DialogSystem } from '../systems/DialogSystem.js';
import { LoreSystem } from '../systems/LoreSystem.js';
import { HUD } from '../ui/HUD.js';
import { MapBuilder } from '../utils/MapBuilder.js';
import dialogueData from '../data/dialogue.json';
import loreData from '../data/lore.json';

const HUB_LAYOUT = [
  '################################',
  '#..............................#',
  '#..####....................##..#',
  '#..#..#......S.............##..#',
  '#..#..#......................#.#',
  '#..####......................#.#',
  '#..............................#',
  '#..........N.......D...........#',
  '#..............................#',
  '#...####...........####.......#',
  '#...#..#...........#..#.......#',
  '#...#..#.....L.....#..#.......#',
  '#...####...........####.......#',
  '#..............................#',
  '#..............................#',
  '#...P.........P.........P.....#',
  '#..............................#',
  '#..............................#',
  '################################',
];

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HubScene' });
  }

  init(data) {
    this.returnData = data || {};
  }

  create() {
    this._transitioning = false;
    this.cameras.main.setAlpha(1);
    this.cameras.main.fadeIn(500);

    // Initialize our global game progress state registry on first visit
    if (!this.registry.get('gameState')) {
      this.registry.set('gameState', {
        egyptComplete: false,
        romeComplete: false,
        modernComplete: false,
        visitCount: 0
      });
    }
    const state = this.registry.get('gameState');
    state.visitCount++;

    this.mapBuilder = new MapBuilder(this);
    this.mapBuilder.build(HUB_LAYOUT, 'tile-floor-modern', 'tile-wall-modern');

    const spawn = this.mapBuilder.spawnPoints.player;
    this.player = new Player(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player, this.mapBuilder.walls);
    this.cameras.main.centerOn(spawn.x, spawn.y);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Restore cards state from registry if we're coming back from another era
    if (this.registry.get('cardState')) {
      this.cardManager = new CardManager(this);
      this.cardManager.loadState(this.registry.get('cardState'));
    } else {
      this.cardManager = new CardManager(this);
    }

    // Default to a full heal if no player HP was previously saved
    const savedHp = this.registry.get('playerHp');
    this.player.hp = savedHp ? Math.max(savedHp, this.player.maxHp) : this.player.maxHp;

    this.dialogSystem = new DialogSystem(this);
    this.loreSystem = new LoreSystem(this);

    Object.entries(loreData.entries).forEach(([id, entry]) => {
      this.loreSystem.registerLore(id, entry);
    });
    if (this.registry.get('loreState')) {
      this.loreSystem.loadState(this.registry.get('loreState'));
    }

    this.hud = new HUD(this, this.player, this.cardManager);
    this.hud.setZoneName('The Lab');

    this.addDecorations();

    const npcSpawn = this.mapBuilder.spawnPoints.npcs[0];
    this.drVoss = new NPC(this, npcSpawn.x, npcSpawn.y, {
      name: 'Dr. Voss',
      dialogueKey: 'hub_scientist_intro',
      texture: 'npc-voss'
    });
    this.physics.add.collider(this.drVoss, this.mapBuilder.walls);

    const loreSpawn = this.mapBuilder.spawnPoints.lore[0];
    if (loreSpawn) {
      this.lorePickup = this.physics.add.staticImage(loreSpawn.x, loreSpawn.y, 'lore-scroll').setDepth(5);
      this.physics.add.overlap(this.player, this.lorePickup, () => {
        if (this.loreSystem.collectLore('lore_lab_history')) {
          this.lorePickup.destroy();
        }
      });
    }

    // Map out portals, their era destinations, and whether progress dictates they are unlocked
    this.portals = [];
    const portalSpawns = this.mapBuilder.spawnPoints.portals;
    const portalDests = ['EgyptScene', 'RomeScene', 'ModernScene'];
    const portalLabels = ['Egypt', 'Rome', 'Finale'];
    const portalUnlocked = [true, state.egyptComplete, state.romeComplete];
    console.log('[HubScene] gameState:', JSON.stringify(state), 'portals unlocked:', portalUnlocked);

    portalSpawns.forEach((p, i) => {
      const portal = this.add.image(p.x, p.y, 'tile-portal').setDepth(2);

      const label = this.add.text(p.x, p.y - 18, portalLabels[i], {
        fontSize: '12px', fontFamily: 'monospace',
        color: portalUnlocked[i] ? '#aa88ff' : '#555555',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(15);

      if (!portalUnlocked[i]) {
        this.add.text(p.x, p.y + 4, '🔒', { fontSize: '14px' }).setOrigin(0.5).setDepth(15);
        portal.setTint(0x333333);
      } else {
        // Unlocked portals slowly pulsate with energy
        this.tweens.add({
          targets: portal, alpha: 0.6,
          duration: 1000, yoyo: true, repeat: -1
        });
      }

      this.portals.push({ x: p.x, y: p.y, dest: portalDests[i], unlocked: portalUnlocked[i] });
    });

    // Setup the hotbar card configuration station
    this.deckStation = null;
    if (this.mapBuilder.spawnPoints.deckStation) {
      const dp = this.mapBuilder.spawnPoints.deckStation;
      this.deckStation = { x: dp.x, y: dp.y };
      this.add.image(dp.x, dp.y, 'deco-console').setDepth(2);
      const glow = this.add.circle(dp.x, dp.y, 14, 0x44ffcc, 0.08).setDepth(1);
      this.tweens.add({ targets: glow, alpha: 0.18, scale: 1.3, duration: 1200, yoyo: true, repeat: -1 });
      this.deckLabel = this.add.text(dp.x, dp.y - 18, 'Deck [E]', {
        fontSize: '12px', fontFamily: 'monospace', color: '#44ffcc',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(15).setVisible(false);
    }

    this.player.interactKey.on('down', () => {
      if (this.dialogSystem.isActive) return;
      
      // Access the deck editor if the player is within range of the terminal
      if (this.deckStation) {
        const dd = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.deckStation.x, this.deckStation.y);
        if (dd < 20) {
          this.registry.set('cardState', this.cardManager.getState());
          this.registry.set('playerHp', this.player.hp);
          this.registry.set('loreState', this.loreSystem.getState());
          this.scene.start('DeckBuildScene', { returnScene: 'HubScene' });
          return;
        }
      }
      
      if (this.drVoss.isInRange(this.player)) {
        let key = 'hub_scientist_intro';
        if (state.romeComplete) key = 'hub_scientist_post_rome';
        else if (state.egyptComplete) key = 'hub_scientist_post_egypt';
        this.dialogSystem.show(dialogueData[key]);
      }
    });

    // Pre-bind hotbar triggers so they don't throw warnings in hub
    this.cardKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
    ];
  }

  transitionTo(sceneKey) {
    if (this._transitioning) return;
    this._transitioning = true;

    // Persist all vital progress states before swapping scenes
    this.registry.set('cardState', this.cardManager.getState());
    this.registry.set('playerHp', this.player.hp);
    this.registry.set('loreState', this.loreSystem.getState());

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey);
    });
  }

  addDecorations() {
    const consolePositions = [
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 27, y: 2 }, { x: 28, y: 2 },
      { x: 5, y: 10 }, { x: 26, y: 10 }, { x: 5, y: 14 }, { x: 26, y: 14 }
    ];
    consolePositions.forEach(p => {
      const cx = p.x * 16 + 8;
      const cy = p.y * 16 + 8;
      this.add.image(cx, cy, 'deco-console').setDepth(2);
    });

    // Flank each active portal with torches for dramatic contrast
    const portalSpawns = this.mapBuilder.spawnPoints.portals;
    portalSpawns.forEach(p => {
      this.add.image(p.x - 20, p.y, 'deco-torch').setDepth(3);
      this.add.image(p.x + 20, p.y, 'deco-torch').setDepth(3);
      const glow = this.add.circle(p.x, p.y, 20, 0x8844ff, 0.08).setDepth(1);
      this.tweens.add({
        targets: glow, alpha: 0.15, scale: 1.2,
        duration: 1500, yoyo: true, repeat: -1
      });
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
    this.drVoss.update(this.player);

    if (this.deckStation && this.deckLabel) {
      const dd = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.deckStation.x, this.deckStation.y);
      this.deckLabel.setVisible(dd < 24);
    }

    // Step into an unlocked portal to trigger a zone transition
    if (!this._transitioning) {
      for (const portal of this.portals) {
        if (!portal.unlocked) continue;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x, portal.y);
        if (dist < 24) {
          this.transitionTo(portal.dest);
          break;
        }
      }
    }
  }
}

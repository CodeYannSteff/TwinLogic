/**
 * Generates all game sprites programmatically with Stardew Valley-inspired pixel art.
 * Each sprite is hand-drawn pixel-by-pixel for a warm, detailed aesthetic.
 */
export class SpriteFactory {
  constructor(scene) {
    this.scene = scene;
  }

  generateAll() {
    this.generatePlayerSheet();
    this.generateEnemySheets();
    this.generateNPCSheets();
    this.generateTilesets();
    this.generateDecorations();
    this.generateUIElements();
    this.generateEffects();
    this.generateItems();
  }

  // ── PLAYER (32x32, 4 dirs x 4 frames) ──
  generatePlayerSheet() {
    const W = 32, H = 32, cols = 4, rows = 4;
    const c = this._canvas(W * cols, H * rows);
    const ctx = c.getContext('2d');

    for (let dir = 0; dir < 4; dir++) {
      for (let frame = 0; frame < 4; frame++) {
        const ox = frame * W;
        const oy = dir * H;
        this._drawKael(ctx, ox, oy, dir, frame);
      }
    }
    this.scene.textures.addSpriteSheet('player', c, { frameWidth: W, frameHeight: H });
  }

  _drawKael(ctx, ox, oy, dir, frame) {
    // dir: 0=down, 1=left, 2=right, 3=up
    const walk = (frame % 2 === 0) ? 0 : (frame === 1 ? -1 : 1);
    const bob = (frame === 1 || frame === 3) ? -1 : 0;

    // Shadow
    this._ellipse(ctx, ox + 16, oy + 30, 8, 3, '#00000040');

    // Cloak (deep blue-purple)
    ctx.fillStyle = '#2a2150';
    ctx.fillRect(ox + 10, oy + 14 + bob, 12, 12);
    // Cloak highlight
    ctx.fillStyle = '#3a3170';
    ctx.fillRect(ox + 11, oy + 15 + bob, 4, 10);
    // Cloak trim (gold)
    ctx.fillStyle = '#c8a84e';
    ctx.fillRect(ox + 10, oy + 25 + bob, 12, 1);

    // Legs
    ctx.fillStyle = '#1e1842';
    ctx.fillRect(ox + 12, oy + 26 + bob, 3, 3 + walk);
    ctx.fillRect(ox + 17, oy + 26 + bob, 3, 3 - walk);
    // Boots
    ctx.fillStyle = '#5c4a2a';
    ctx.fillRect(ox + 11, oy + 28 + walk + bob, 4, 2);
    ctx.fillRect(ox + 17, oy + 28 - walk + bob, 4, 2);

    // Arms
    const armSwing = walk * 2;
    ctx.fillStyle = '#3a3170';
    if (dir !== 1) {
      ctx.fillRect(ox + 22, oy + 16 + bob - armSwing, 3, 8);
      ctx.fillStyle = '#ffcca0';
      ctx.fillRect(ox + 22, oy + 23 + bob - armSwing, 3, 2);
    }
    ctx.fillStyle = '#3a3170';
    if (dir !== 2) {
      ctx.fillRect(ox + 7, oy + 16 + bob + armSwing, 3, 8);
      ctx.fillStyle = '#ffcca0';
      ctx.fillRect(ox + 7, oy + 23 + bob + armSwing, 3, 2);
    }

    // Head
    ctx.fillStyle = '#ffcca0'; // skin
    this._roundRect(ctx, ox + 11, oy + 4 + bob, 10, 10, '#ffcca0');
    // Hair (silver-white, ancient guardian)
    ctx.fillStyle = '#c8c8d8';
    ctx.fillRect(ox + 10, oy + 3 + bob, 12, 4);
    ctx.fillRect(ox + 10, oy + 4 + bob, 2, 6);
    ctx.fillRect(ox + 20, oy + 4 + bob, 2, 6);
    // Hair highlight
    ctx.fillStyle = '#e0e0f0';
    ctx.fillRect(ox + 12, oy + 3 + bob, 3, 2);

    // Face based on direction
    if (dir === 0) { // down
      // Eyes
      ctx.fillStyle = '#1a1a3a';
      ctx.fillRect(ox + 13, oy + 8 + bob, 2, 3);
      ctx.fillRect(ox + 18, oy + 8 + bob, 2, 3);
      // Eye shine
      ctx.fillStyle = '#66ccff';
      ctx.fillRect(ox + 13, oy + 8 + bob, 1, 1);
      ctx.fillRect(ox + 18, oy + 8 + bob, 1, 1);
      // Mouth
      ctx.fillStyle = '#cc8870';
      ctx.fillRect(ox + 15, oy + 12 + bob, 2, 1);
    } else if (dir === 3) { // up
      // Just hair back
      ctx.fillStyle = '#b0b0c0';
      ctx.fillRect(ox + 11, oy + 5 + bob, 10, 7);
    } else { // left/right
      const ex = dir === 1 ? 12 : 18;
      ctx.fillStyle = '#1a1a3a';
      ctx.fillRect(ox + ex, oy + 8 + bob, 2, 3);
      ctx.fillStyle = '#66ccff';
      ctx.fillRect(ox + ex, oy + 8 + bob, 1, 1);
      ctx.fillStyle = '#cc8870';
      ctx.fillRect(ox + (dir === 1 ? 13 : 17), oy + 12 + bob, 2, 1);
    }

    // Guardian glow rune on chest
    ctx.fillStyle = '#44ffcc';
    ctx.fillRect(ox + 15, oy + 17 + bob, 2, 2);
    ctx.fillStyle = '#22cc99';
    ctx.fillRect(ox + 14, oy + 18 + bob, 1, 1);
    ctx.fillRect(ox + 17, oy + 18 + bob, 1, 1);

    // Chrono amulet glow (subtle)
    if (frame === 1 || frame === 3) {
      ctx.fillStyle = '#44ffcc40';
      this._ellipse(ctx, ox + 16, oy + 18 + bob, 4, 4, '#44ffcc20');
    }
  }

  // ── ENEMIES ──
  generateEnemySheets() {
    // Egypt enemy (corrupted guard) - 32x32
    this._generateEnemySprite('enemy-egypt', (ctx, ox, oy) => {
      this._ellipse(ctx, ox + 16, oy + 30, 8, 3, '#00000040');
      // Body (dark gold corrupted armor)
      ctx.fillStyle = '#8a6a20';
      ctx.fillRect(ox + 10, oy + 12, 12, 14);
      ctx.fillStyle = '#6a4a10';
      ctx.fillRect(ox + 11, oy + 13, 10, 12);
      // Corruption veins
      ctx.fillStyle = '#cc33ff';
      ctx.fillRect(ox + 12, oy + 15, 1, 8);
      ctx.fillRect(ox + 19, oy + 14, 1, 6);
      ctx.fillRect(ox + 15, oy + 20, 3, 1);
      // Head
      ctx.fillStyle = '#aa8844';
      ctx.fillRect(ox + 12, oy + 4, 8, 8);
      // Headdress
      ctx.fillStyle = '#ccaa33';
      ctx.fillRect(ox + 10, oy + 3, 12, 4);
      ctx.fillStyle = '#eedd44';
      ctx.fillRect(ox + 14, oy + 2, 4, 2);
      // Glowing eyes
      ctx.fillStyle = '#ff44ff';
      ctx.fillRect(ox + 13, oy + 7, 2, 2);
      ctx.fillRect(ox + 17, oy + 7, 2, 2);
      // Legs
      ctx.fillStyle = '#5a3a10';
      ctx.fillRect(ox + 12, oy + 26, 3, 4);
      ctx.fillRect(ox + 17, oy + 26, 3, 4);
    });

    // Rome enemy (temporal legionary) - 32x32
    this._generateEnemySprite('enemy-rome', (ctx, ox, oy) => {
      this._ellipse(ctx, ox + 16, oy + 30, 8, 3, '#00000040');
      // Armor (ghostly blue-silver)
      ctx.fillStyle = '#6677aa';
      ctx.fillRect(ox + 10, oy + 12, 12, 14);
      ctx.fillStyle = '#8899cc';
      ctx.fillRect(ox + 11, oy + 13, 10, 4);
      // Temporal distortion lines
      ctx.fillStyle = '#aabbff';
      ctx.fillRect(ox + 10, oy + 18, 12, 1);
      ctx.fillRect(ox + 10, oy + 22, 12, 1);
      // Head with helmet
      ctx.fillStyle = '#eecc99';
      ctx.fillRect(ox + 12, oy + 5, 8, 7);
      ctx.fillStyle = '#778899';
      ctx.fillRect(ox + 11, oy + 3, 10, 4);
      // Helmet crest
      ctx.fillStyle = '#cc3333';
      ctx.fillRect(ox + 14, oy + 1, 4, 3);
      // Eyes
      ctx.fillStyle = '#4488ff';
      ctx.fillRect(ox + 13, oy + 7, 2, 2);
      ctx.fillRect(ox + 17, oy + 7, 2, 2);
      // Legs
      ctx.fillStyle = '#556688';
      ctx.fillRect(ox + 12, oy + 26, 3, 4);
      ctx.fillRect(ox + 17, oy + 26, 3, 4);
      // Shield
      ctx.fillStyle = '#8899aa';
      ctx.fillRect(ox + 6, oy + 14, 4, 8);
      ctx.fillStyle = '#aabbcc';
      ctx.fillRect(ox + 7, oy + 15, 2, 6);
    });

    // Modern enemy (void fragment) - 32x32
    this._generateEnemySprite('enemy-modern', (ctx, ox, oy) => {
      this._ellipse(ctx, ox + 16, oy + 30, 7, 2, '#33005540');
      // Amorphous void body
      ctx.fillStyle = '#220044';
      this._ellipse(ctx, ox + 16, oy + 18, 10, 12, '#330066');
      ctx.fillStyle = '#440088';
      this._ellipse(ctx, ox + 16, oy + 16, 7, 8, '#440088');
      // Void tendrils
      ctx.fillStyle = '#6600cc';
      ctx.fillRect(ox + 8, oy + 20, 2, 8);
      ctx.fillRect(ox + 22, oy + 20, 2, 8);
      ctx.fillRect(ox + 11, oy + 24, 2, 6);
      ctx.fillRect(ox + 19, oy + 24, 2, 6);
      // Eye
      ctx.fillStyle = '#ff00ff';
      this._ellipse(ctx, ox + 16, oy + 14, 4, 3, '#ff44ff');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox + 15, oy + 13, 2, 2);
      // Particles
      ctx.fillStyle = '#aa44ff';
      ctx.fillRect(ox + 10, oy + 8, 2, 2);
      ctx.fillRect(ox + 20, oy + 10, 2, 2);
      ctx.fillRect(ox + 14, oy + 6, 1, 1);
    });

    // Bosses — unique detailed sprites per zone
    this._generateEgyptBoss();
    this._generateRomeBoss();
    this._generateModernBoss();
  }

  _generateEnemySprite(key, drawFn) {
    const c = this._canvas(32, 32);
    drawFn(c.getContext('2d'), 0, 0);
    this.scene.textures.addImage(key, c);
  }

  _generateEgyptBoss() {
    const c = this._canvas(48, 48);
    const ctx = c.getContext('2d');
    // Shadow
    this._ellipse(ctx, 24, 44, 14, 4, '#00000050');
    // Body — golden armored medjay captain
    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(14, 14, 20, 24);
    // Gold chest plate
    ctx.fillStyle = '#daa520';
    ctx.fillRect(16, 16, 16, 12);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(18, 18, 12, 8);
    // Gold trim
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(14, 28, 20, 3);
    // Nemes headdress (pharaoh-style)
    ctx.fillStyle = '#1a4488';
    ctx.fillRect(12, 4, 24, 12);
    ctx.fillStyle = '#2255aa';
    ctx.fillRect(14, 6, 20, 8);
    // Gold cobra on forehead
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(22, 4, 4, 4);
    ctx.fillRect(21, 2, 6, 2);
    // Face
    ctx.fillStyle = '#c08050';
    ctx.fillRect(16, 10, 16, 8);
    // Glowing eyes
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(19, 12, 3, 3);
    ctx.fillRect(26, 12, 3, 3);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(20, 12, 1, 1);
    ctx.fillRect(27, 12, 1, 1);
    // Khopesh sword
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(36, 18, 2, 14);
    ctx.fillRect(34, 16, 6, 2);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(35, 30, 4, 3);
    // Legs / kilt
    ctx.fillStyle = '#f0e8c8';
    ctx.fillRect(16, 32, 7, 8);
    ctx.fillRect(25, 32, 7, 8);
    // Sandals
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(16, 40, 7, 2);
    ctx.fillRect(25, 40, 7, 2);
    // Aura particles
    ctx.fillStyle = '#ff880060';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(6 + Math.random() * 36, 2 + Math.random() * 40, 2, 2);
    }
    this.scene.textures.addImage('boss-egypt', c);
  }

  _generateRomeBoss() {
    const c = this._canvas(48, 48);
    const ctx = c.getContext('2d');
    // Shadow
    this._ellipse(ctx, 24, 44, 14, 4, '#00000050');
    // Temporal Anomaly — ghostly translucent centurion
    // Swirling temporal body
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#4a3a8a';
    ctx.fillRect(14, 12, 20, 26);
    ctx.fillStyle = '#6a5acd';
    ctx.fillRect(16, 14, 16, 22);
    ctx.globalAlpha = 1.0;
    // Ornate lorica segmentata (Roman armor)
    ctx.fillStyle = '#8888cc';
    ctx.fillRect(15, 16, 18, 4);
    ctx.fillRect(15, 22, 18, 4);
    ctx.fillRect(15, 28, 18, 4);
    // Centurion helmet with crest
    ctx.fillStyle = '#6666aa';
    ctx.fillRect(14, 4, 20, 10);
    ctx.fillStyle = '#cc2222';
    ctx.fillRect(20, 0, 8, 6);
    ctx.fillRect(22, 0, 4, 8);
    // Face
    ctx.fillStyle = '#9988cc';
    ctx.fillRect(18, 8, 12, 6);
    // Glowing temporal eyes
    ctx.fillStyle = '#44ccff';
    ctx.fillRect(20, 10, 3, 2);
    ctx.fillRect(26, 10, 3, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, 10, 1, 1);
    ctx.fillRect(27, 10, 1, 1);
    // Gladius
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(36, 14, 2, 16);
    ctx.fillStyle = '#8888cc';
    ctx.fillRect(35, 28, 4, 3);
    // Shield (scutum)
    ctx.fillStyle = '#882222';
    ctx.fillRect(6, 16, 8, 14);
    ctx.fillStyle = '#cc8833';
    ctx.fillRect(7, 17, 6, 12);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(9, 21, 2, 4);
    // Legs
    ctx.fillStyle = '#5555aa';
    ctx.fillRect(16, 34, 7, 8);
    ctx.fillRect(25, 34, 7, 8);
    // Temporal particles
    ctx.fillStyle = '#44ccff80';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(4 + Math.random() * 40, 2 + Math.random() * 42, 2, 2);
    }
    this.scene.textures.addImage('boss-rome', c);
  }

  _generateModernBoss() {
    const c = this._canvas(48, 48);
    const ctx = c.getContext('2d');
    // The Eraser — void entity with reality-warping appearance
    // Shadow
    this._ellipse(ctx, 24, 44, 16, 4, '#33006680');
    // Void body — dark amorphous shape
    ctx.fillStyle = '#0a0020';
    this._ellipse(ctx, 24, 24, 18, 20, '#110033');
    ctx.fillStyle = '#1a0044';
    this._ellipse(ctx, 24, 22, 14, 16, '#220055');
    // Inner void core
    ctx.fillStyle = '#330077';
    this._ellipse(ctx, 24, 20, 8, 10, '#440088');
    // Glitch lines (reality tearing)
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(8, 14, 32, 1);
    ctx.fillRect(6, 22, 36, 1);
    ctx.fillRect(10, 30, 28, 1);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(12, 18, 24, 1);
    ctx.fillRect(8, 26, 32, 1);
    // Central eye — massive and menacing
    ctx.fillStyle = '#ff00ff';
    this._ellipse(ctx, 24, 18, 8, 5, '#ff44ff');
    ctx.fillStyle = '#cc00cc';
    this._ellipse(ctx, 24, 18, 5, 3, '#dd22dd');
    // Pupil
    ctx.fillStyle = '#000000';
    ctx.fillRect(22, 16, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(23, 16, 2, 2);
    // Void tendrils extending outward
    ctx.fillStyle = '#6600cc';
    ctx.fillRect(4, 20, 3, 12);
    ctx.fillRect(41, 20, 3, 12);
    ctx.fillRect(8, 32, 3, 8);
    ctx.fillRect(37, 32, 3, 8);
    ctx.fillRect(14, 36, 2, 6);
    ctx.fillRect(32, 36, 2, 6);
    // Floating fragments
    ctx.fillStyle = '#aa44ff';
    ctx.fillRect(6, 8, 3, 3);
    ctx.fillRect(38, 6, 3, 3);
    ctx.fillRect(10, 4, 2, 2);
    ctx.fillRect(34, 10, 2, 2);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(16, 2, 2, 2);
    ctx.fillRect(30, 4, 2, 2);
    // Void aura particles
    ctx.fillStyle = '#ff00ff40';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(2 + Math.random() * 44, 2 + Math.random() * 44, 2, 2);
    }
    this.scene.textures.addImage('boss-modern', c);
  }

  // ── NPCs ──
  generateNPCSheets() {
    // Dr. Voss (modern scientist)
    this._generateNPCSprite('npc-voss', {
      hair: '#2a1a0a', hairStyle: 'long', skin: '#f5c9a0',
      outfit: '#ffffff', outfitAccent: '#3388cc', labcoat: true
    });
    // Imhotep
    this._generateNPCSprite('npc-imhotep', {
      hair: '#1a1a1a', hairStyle: 'bald', skin: '#c08050',
      outfit: '#f0e8c8', outfitAccent: '#ccaa33', crown: true
    });
    // Worker
    this._generateNPCSprite('npc-worker', {
      hair: '#2a1a0a', hairStyle: 'short', skin: '#c08050',
      outfit: '#ccaa77', outfitAccent: '#998855'
    });
    // Brutus
    this._generateNPCSprite('npc-brutus', {
      hair: '#3a2a1a', hairStyle: 'short', skin: '#e8c0a0',
      outfit: '#ffffff', outfitAccent: '#cc2222', toga: true
    });
    // Senator
    this._generateNPCSprite('npc-senator', {
      hair: '#888888', hairStyle: 'short', skin: '#e8c0a0',
      outfit: '#e8e0d0', outfitAccent: '#8844aa', toga: true
    });
    // Generic NPC fallback
    this._generateNPCSprite('npc', {
      hair: '#4a3a2a', hairStyle: 'short', skin: '#f0c8a0',
      outfit: '#668844', outfitAccent: '#446622'
    });
  }

  _generateNPCSprite(key, cfg) {
    const c = this._canvas(32, 32);
    const ctx = c.getContext('2d');

    this._ellipse(ctx, 16, 30, 8, 3, '#00000040');

    // Body
    ctx.fillStyle = cfg.outfit;
    ctx.fillRect(10, 14, 12, 12);
    ctx.fillStyle = cfg.outfitAccent;
    ctx.fillRect(11, 15, 10, 3);

    if (cfg.labcoat) {
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(8, 14, 3, 14);
      ctx.fillRect(21, 14, 3, 14);
    }
    if (cfg.toga) {
      ctx.fillStyle = cfg.outfit;
      ctx.fillRect(8, 16, 16, 10);
      ctx.fillStyle = cfg.outfitAccent;
      ctx.fillRect(9, 17, 2, 8);
    }

    // Legs
    ctx.fillStyle = cfg.outfit === '#ffffff' ? '#334455' : cfg.outfitAccent;
    ctx.fillRect(12, 26, 3, 4);
    ctx.fillRect(17, 26, 3, 4);

    // Head
    ctx.fillStyle = cfg.skin;
    this._roundRect(ctx, 11, 4, 10, 10, cfg.skin);

    // Hair
    ctx.fillStyle = cfg.hair;
    if (cfg.hairStyle === 'long') {
      ctx.fillRect(10, 3, 12, 5);
      ctx.fillRect(10, 4, 2, 8);
      ctx.fillRect(20, 4, 2, 8);
    } else if (cfg.hairStyle === 'short') {
      ctx.fillRect(10, 3, 12, 4);
    }
    // Crown for Imhotep
    if (cfg.crown) {
      ctx.fillStyle = '#ccaa33';
      ctx.fillRect(11, 1, 10, 3);
      ctx.fillStyle = '#eedd44';
      ctx.fillRect(14, 0, 4, 2);
    }

    // Eyes (friendly)
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(13, 8, 2, 2);
    ctx.fillRect(18, 8, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(13, 8, 1, 1);
    ctx.fillRect(18, 8, 1, 1);
    // Smile
    ctx.fillStyle = '#cc9980';
    ctx.fillRect(15, 11, 3, 1);

    // Arms
    ctx.fillStyle = cfg.skin;
    ctx.fillRect(7, 16, 3, 6);
    ctx.fillRect(22, 16, 3, 6);

    this.scene.textures.addImage(key, c);
  }

  // ── TILESETS (16x16) ──
  generateTilesets() {
    // Hub (modern lab)
    this._generateTile('tile-floor', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#4a5568');
      this._fill(ctx, 0, 0, 16, 1, '#3d4655');
      this._fill(ctx, 0, 0, 1, 16, '#3d4655');
      // Tile grid lines
      this._fill(ctx, 7, 0, 1, 16, '#42505f');
      this._fill(ctx, 0, 7, 16, 1, '#42505f');
      // Specular highlights
      this._fill(ctx, 2, 2, 2, 1, '#57647a');
      this._fill(ctx, 10, 10, 2, 1, '#57647a');
    });
    this._generateTile('tile-wall', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#2d3748');
      // Metal panel look
      this._fill(ctx, 1, 1, 14, 14, '#374357');
      this._fill(ctx, 2, 2, 12, 1, '#4a5a72');
      this._fill(ctx, 2, 13, 12, 1, '#252e3d');
      // Rivets
      this._fill(ctx, 2, 2, 1, 1, '#6a7a92');
      this._fill(ctx, 13, 2, 1, 1, '#6a7a92');
      this._fill(ctx, 2, 13, 1, 1, '#6a7a92');
      this._fill(ctx, 13, 13, 1, 1, '#6a7a92');
    });

    // Egypt (warm sand/stone)
    this._generateTile('tile-floor-egypt', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#d4a84e');
      // Sand variation
      const sandColors = ['#c89a42', '#dab456', '#c49038', '#d8b050'];
      for (let i = 0; i < 12; i++) {
        const c = sandColors[Math.floor(Math.random() * sandColors.length)];
        this._fill(ctx, Math.floor(Math.random() * 14), Math.floor(Math.random() * 14), 2, 1, c);
      }
      // Occasional pebble
      if (Math.random() > 0.7) {
        this._fill(ctx, 5 + Math.floor(Math.random() * 6), 5 + Math.floor(Math.random() * 6), 1, 1, '#b08830');
      }
    });
    this._generateTile('tile-wall-egypt', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#9a7a34');
      // Sandstone block look
      this._fill(ctx, 1, 1, 14, 6, '#b08a3e');
      this._fill(ctx, 1, 9, 14, 6, '#b08a3e');
      // Mortar lines
      this._fill(ctx, 0, 7, 16, 2, '#8a6a28');
      this._fill(ctx, 7, 0, 2, 7, '#8a6a28');
      // Hieroglyph hint
      this._fill(ctx, 4, 3, 1, 3, '#c8a44e');
      this._fill(ctx, 10, 10, 2, 2, '#c8a44e');
    });

    // Rome (marble/stone)
    this._generateTile('tile-floor-rome', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#c8bca8');
      // Marble pattern
      this._fill(ctx, 0, 0, 16, 1, '#b8ac98');
      this._fill(ctx, 0, 0, 1, 16, '#b8ac98');
      const marbleColors = ['#d0c4b0', '#beb2a0', '#c8bcaa', '#d4c8b8'];
      for (let i = 0; i < 6; i++) {
        const mc = marbleColors[Math.floor(Math.random() * marbleColors.length)];
        this._fill(ctx, Math.floor(Math.random() * 12) + 2, Math.floor(Math.random() * 12) + 2, 3, 1, mc);
      }
    });
    this._generateTile('tile-wall-rome', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#8a8272');
      this._fill(ctx, 1, 1, 14, 14, '#a09888');
      // Column lines
      this._fill(ctx, 3, 0, 2, 16, '#b0a898');
      this._fill(ctx, 11, 0, 2, 16, '#b0a898');
      // Capital detail
      this._fill(ctx, 2, 0, 4, 2, '#c0b8a8');
      this._fill(ctx, 10, 0, 4, 2, '#c0b8a8');
    });

    // Modern (tech/lab)
    this._generateTile('tile-floor-modern', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#3a4252');
      this._fill(ctx, 0, 0, 16, 1, '#323a48');
      this._fill(ctx, 0, 0, 1, 16, '#323a48');
      this._fill(ctx, 7, 0, 1, 16, '#353d4c');
      this._fill(ctx, 0, 7, 16, 1, '#353d4c');
      // LED strip hint
      this._fill(ctx, 3, 3, 1, 1, '#44aaff20');
      this._fill(ctx, 12, 12, 1, 1, '#44aaff20');
    });
    this._generateTile('tile-wall-modern', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#252d3a');
      this._fill(ctx, 1, 1, 14, 14, '#2e3848');
      // Tech panel
      this._fill(ctx, 3, 3, 10, 10, '#343e50');
      this._fill(ctx, 4, 4, 8, 1, '#4a5a72');
      this._fill(ctx, 4, 11, 8, 1, '#1e2530');
      // LED indicator
      this._fill(ctx, 12, 4, 1, 1, '#44ff88');
    });

    // Portal tile
    this._generateTile('tile-portal', (ctx) => {
      this._fill(ctx, 0, 0, 16, 16, '#1a1030');
      // Swirl
      this._ellipse(ctx, 8, 8, 7, 7, '#4400aa');
      this._ellipse(ctx, 8, 8, 5, 5, '#6622cc');
      this._ellipse(ctx, 8, 8, 3, 3, '#8844ff');
      this._fill(ctx, 7, 7, 2, 2, '#cc88ff');
      // Sparkles
      this._fill(ctx, 3, 3, 1, 1, '#aa66ff');
      this._fill(ctx, 12, 5, 1, 1, '#cc88ff');
      this._fill(ctx, 5, 11, 1, 1, '#aa66ff');
      this._fill(ctx, 11, 10, 1, 1, '#cc88ff');
    });
  }

  // ── DECORATIONS ──
  generateDecorations() {
    // Tree (32x32)
    this._generateDecoration('deco-tree', 32, 32, (ctx) => {
      // Trunk
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(13, 18, 6, 14);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(14, 19, 4, 12);
      // Canopy
      this._ellipse(ctx, 16, 12, 12, 10, '#2a6a22');
      this._ellipse(ctx, 14, 10, 8, 7, '#3a8a32');
      this._ellipse(ctx, 19, 11, 7, 6, '#348a2e');
      // Highlights
      this._ellipse(ctx, 13, 8, 4, 3, '#4aaa42');
      ctx.fillStyle = '#55bb55';
      ctx.fillRect(11, 7, 2, 2);
      ctx.fillRect(18, 6, 2, 2);
    });

    // Palm tree (egypt, 32x48)
    this._generateDecoration('deco-palm', 32, 48, (ctx) => {
      // Trunk (curved)
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(14, 20, 5, 28);
      ctx.fillStyle = '#9a7a4a';
      ctx.fillRect(15, 22, 3, 24);
      // Trunk rings
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = '#7a5a2a';
        ctx.fillRect(14, 22 + i * 4, 5, 1);
      }
      // Fronds
      const frondColor = '#2a8a22';
      const lightFrond = '#3aaa32';
      ctx.fillStyle = frondColor;
      // Left frond
      ctx.fillRect(2, 14, 14, 3);
      ctx.fillRect(0, 12, 8, 2);
      ctx.fillRect(4, 16, 8, 2);
      // Right frond
      ctx.fillRect(16, 14, 14, 3);
      ctx.fillRect(24, 12, 8, 2);
      ctx.fillRect(20, 16, 8, 2);
      // Top fronds
      ctx.fillRect(10, 8, 12, 3);
      ctx.fillStyle = lightFrond;
      ctx.fillRect(12, 9, 8, 2);
      // Coconuts
      ctx.fillStyle = '#6a4a1a';
      ctx.fillRect(13, 18, 3, 3);
      ctx.fillRect(17, 19, 2, 2);
    });

    // Pillar (rome, 16x32)
    this._generateDecoration('deco-pillar', 16, 32, (ctx) => {
      ctx.fillStyle = '#c0b8a8';
      ctx.fillRect(4, 4, 8, 24);
      ctx.fillStyle = '#d0c8b8';
      ctx.fillRect(5, 5, 6, 22);
      // Capital
      ctx.fillStyle = '#d8d0c0';
      ctx.fillRect(2, 2, 12, 4);
      ctx.fillRect(3, 0, 10, 3);
      // Base
      ctx.fillStyle = '#b0a898';
      ctx.fillRect(2, 26, 12, 4);
      ctx.fillRect(3, 29, 10, 3);
      // Fluting
      ctx.fillStyle = '#b8b0a0';
      ctx.fillRect(6, 6, 1, 20);
      ctx.fillRect(9, 6, 1, 20);
    });

    // Console/computer (modern, 16x16)
    this._generateDecoration('deco-console', 16, 16, (ctx) => {
      ctx.fillStyle = '#2a3040';
      ctx.fillRect(2, 4, 12, 10);
      ctx.fillStyle = '#1a2030';
      ctx.fillRect(3, 5, 10, 7);
      // Screen
      ctx.fillStyle = '#113322';
      ctx.fillRect(3, 5, 10, 6);
      // Text lines
      ctx.fillStyle = '#33ff66';
      ctx.fillRect(4, 6, 6, 1);
      ctx.fillStyle = '#22cc55';
      ctx.fillRect(4, 8, 8, 1);
      ctx.fillStyle = '#33ff66';
      ctx.fillRect(4, 10, 4, 1);
      // Keyboard
      ctx.fillStyle = '#3a4252';
      ctx.fillRect(3, 12, 10, 2);
      // LED
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(12, 5, 1, 1);
    });

    // Crate/pot
    this._generateDecoration('deco-pot', 16, 16, (ctx) => {
      ctx.fillStyle = '#8a5a2a';
      ctx.fillRect(4, 4, 8, 10);
      ctx.fillStyle = '#9a6a3a';
      ctx.fillRect(5, 5, 6, 8);
      ctx.fillStyle = '#7a4a1a';
      ctx.fillRect(3, 4, 10, 2);
      ctx.fillRect(3, 12, 10, 2);
      ctx.fillStyle = '#aa7a4a';
      ctx.fillRect(6, 6, 2, 1);
    });

    // Water (animated will be handled separately, static for now)
    this._generateDecoration('deco-water', 16, 16, (ctx) => {
      ctx.fillStyle = '#2244aa';
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = '#3355bb';
      ctx.fillRect(2, 4, 6, 2);
      ctx.fillRect(8, 10, 6, 2);
      ctx.fillStyle = '#4466cc';
      ctx.fillRect(4, 6, 3, 1);
      ctx.fillRect(10, 12, 3, 1);
    });

    // Torch/lamp
    this._generateDecoration('deco-torch', 16, 24, (ctx) => {
      // Stick
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(7, 8, 2, 16);
      // Bracket
      ctx.fillStyle = '#6a5a4a';
      ctx.fillRect(5, 8, 6, 2);
      // Flame
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(6, 2, 4, 6);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(7, 3, 2, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 4, 1, 2);
      // Glow
      this._ellipse(ctx, 8, 5, 6, 5, '#ff880030');
    });

    // Flower patches
    this._generateDecoration('deco-flowers', 16, 16, (ctx) => {
      // Grass base
      ctx.fillStyle = '#4a8a3a';
      ctx.fillRect(0, 12, 16, 4);
      ctx.fillStyle = '#5a9a4a';
      ctx.fillRect(1, 11, 4, 2);
      ctx.fillRect(8, 10, 5, 3);
      // Flowers
      const colors = ['#ff6666', '#ffaa44', '#ff66cc', '#ffff44', '#66aaff'];
      for (let i = 0; i < 4; i++) {
        const fx = 2 + i * 3 + Math.floor(Math.random() * 2);
        const fy = 6 + Math.floor(Math.random() * 4);
        ctx.fillStyle = '#3a7a2a';
        ctx.fillRect(fx, fy + 2, 1, 4);
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(fx - 1, fy, 3, 2);
        ctx.fillStyle = '#ffff88';
        ctx.fillRect(fx, fy, 1, 1);
      }
    });
  }

  // ── UI ELEMENTS ──
  generateUIElements() {
    // Card frame (28x38)
    this._generateDecoration('ui-card-frame', 28, 38, (ctx) => {
      // Outer border (gold)
      ctx.fillStyle = '#8a7a3a';
      ctx.fillRect(0, 0, 28, 38);
      // Inner
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(2, 2, 24, 34);
      // Gold trim
      ctx.fillStyle = '#c8a84e';
      ctx.fillRect(1, 1, 26, 1);
      ctx.fillRect(1, 36, 26, 1);
      ctx.fillRect(1, 1, 1, 36);
      ctx.fillRect(26, 1, 1, 36);
      // Corner accents
      ctx.fillStyle = '#e8c86e';
      ctx.fillRect(2, 2, 2, 2);
      ctx.fillRect(24, 2, 2, 2);
      ctx.fillRect(2, 34, 2, 2);
      ctx.fillRect(24, 34, 2, 2);
    });

    // HP bar frame
    this._generateDecoration('ui-hp-frame', 72, 14, (ctx) => {
      // Wooden frame
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(0, 0, 72, 14);
      ctx.fillStyle = '#6a5a3a';
      ctx.fillRect(1, 1, 70, 12);
      ctx.fillStyle = '#4a3a1a';
      ctx.fillRect(2, 2, 68, 10);
      // Wood grain
      ctx.fillStyle = '#5a4a2a';
      ctx.fillRect(3, 5, 66, 1);
    });

    // Card icons for each type
    this._generateCardIcon('card-icon-attack', '#cc3333', '#ff5555');
    this._generateCardIcon('card-icon-defense', '#3355cc', '#5577ee');
    this._generateCardIcon('card-icon-utility', '#33aa44', '#55cc66');
    this._generateCardIcon('card-icon-chrono', '#8833cc', '#aa55ee');
  }

  _generateCardIcon(key, dark, light) {
    const c = this._canvas(24, 24);
    const ctx = c.getContext('2d');
    // Card background
    ctx.fillStyle = '#111122';
    ctx.fillRect(0, 0, 24, 24);
    ctx.fillStyle = dark;
    ctx.fillRect(1, 1, 22, 22);
    ctx.fillStyle = light;
    this._ellipse(ctx, 12, 12, 7, 7, light);
    ctx.fillStyle = '#ffffff';
    this._ellipse(ctx, 12, 10, 3, 3, '#ffffff');
    // Border
    ctx.fillStyle = '#c8a84e';
    ctx.fillRect(0, 0, 24, 1);
    ctx.fillRect(0, 23, 24, 1);
    ctx.fillRect(0, 0, 1, 24);
    ctx.fillRect(23, 0, 1, 24);
    this.scene.textures.addImage(key, c);
  }

  // ── EFFECTS ──
  generateEffects() {
    // Projectile
    const proj = this._canvas(8, 8);
    const pCtx = proj.getContext('2d');
    this._ellipse(pCtx, 4, 4, 3, 3, '#ffcc44');
    this._ellipse(pCtx, 4, 3, 2, 2, '#ffee88');
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(3, 3, 1, 1);
    this.scene.textures.addImage('projectile', proj);

    // Particle
    const part = this._canvas(4, 4);
    const paCtx = part.getContext('2d');
    paCtx.fillStyle = '#ffffff';
    paCtx.fillRect(1, 0, 2, 4);
    paCtx.fillRect(0, 1, 4, 2);
    this.scene.textures.addImage('particle', part);

    // Warp point
    const warp = this._canvas(16, 16);
    const wCtx = warp.getContext('2d');
    this._ellipse(wCtx, 8, 8, 7, 7, '#2244aa60');
    this._ellipse(wCtx, 8, 8, 5, 5, '#4488ff80');
    this._ellipse(wCtx, 8, 8, 3, 3, '#88ccff');
    wCtx.fillStyle = '#ffffff';
    wCtx.fillRect(7, 7, 2, 2);
    this.scene.textures.addImage('warp-point', warp);
  }

  // ── ITEMS ──
  generateItems() {
    // Lore scroll (16x16)
    const scroll = this._canvas(16, 16);
    const sCtx = scroll.getContext('2d');
    // Paper
    sCtx.fillStyle = '#e8d8a8';
    sCtx.fillRect(4, 3, 8, 11);
    sCtx.fillStyle = '#d8c898';
    sCtx.fillRect(5, 4, 6, 9);
    // Rolled ends
    sCtx.fillStyle = '#c8a84e';
    sCtx.fillRect(3, 2, 10, 2);
    sCtx.fillRect(3, 13, 10, 2);
    sCtx.fillStyle = '#b89840';
    sCtx.fillRect(4, 3, 8, 1);
    sCtx.fillRect(4, 13, 8, 1);
    // Text hints
    sCtx.fillStyle = '#5a4a2a';
    sCtx.fillRect(6, 5, 4, 1);
    sCtx.fillRect(6, 7, 5, 1);
    sCtx.fillRect(6, 9, 3, 1);
    sCtx.fillRect(6, 11, 4, 1);
    // Seal
    sCtx.fillStyle = '#cc3333';
    sCtx.fillRect(7, 10, 2, 2);
    this.scene.textures.addImage('lore-scroll', scroll);

    // Card pickup glow
    const cardPickup = this._canvas(16, 16);
    const cpCtx = cardPickup.getContext('2d');
    this._ellipse(cpCtx, 8, 8, 7, 7, '#44ffcc30');
    this._ellipse(cpCtx, 8, 8, 5, 5, '#44ffcc50');
    cpCtx.fillStyle = '#44ffcc';
    cpCtx.fillRect(6, 3, 4, 10);
    cpCtx.fillRect(3, 6, 10, 4);
    cpCtx.fillStyle = '#88ffdd';
    cpCtx.fillRect(7, 4, 2, 8);
    cpCtx.fillRect(4, 7, 8, 2);
    this.scene.textures.addImage('card-pickup', cardPickup);
  }

  // ── HELPERS ──
  _canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  _fill(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  _ellipse(ctx, cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _roundRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y, w - 2, h);
    ctx.fillRect(x, y + 1, w, h - 2);
  }

  _generateTile(key, drawFn) {
    const c = this._canvas(16, 16);
    drawFn(c.getContext('2d'));
    this.scene.textures.addImage(key, c);
  }

  _generateDecoration(key, w, h, drawFn) {
    const c = this._canvas(w, h);
    drawFn(c.getContext('2d'));
    this.scene.textures.addImage(key, c);
  }
}

import Phaser from 'phaser';

/**
 * Builds tile-based maps procedurally from layout definitions.
 * Each layout is a 2D array of characters:
 *   '.' = floor, '#' = wall, 'P' = portal, 'S' = player spawn,
 *   'E' = enemy spawn, 'N' = NPC, 'L' = lore scroll, 'W' = warp,
 *   'C' = card pickup, 'B' = boss spawn
 */
export class MapBuilder {
  constructor(scene, tileSize = 16) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.walls = null;
    this.spawnPoints = { enemies: [], npcs: [], lore: [], warps: [], cards: [], portals: [], boss: null, player: null, deckStation: null, arrows: [] };
  }

  build(layout, floorKey, wallKey) {
    const ts = this.tileSize;
    this.walls = this.scene.physics.add.staticGroup();
    this.spawnPoints = { enemies: [], npcs: [], lore: [], warps: [], cards: [], portals: [], boss: null, player: null, deckStation: null, arrows: [] };

    const rows = layout.length;
    const cols = layout[0].length;

    this.scene.physics.world.setBounds(0, 0, cols * ts, rows * ts);
    this.scene.cameras.main.setBounds(0, 0, cols * ts, rows * ts);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * ts + ts / 2;
        const y = r * ts + ts / 2;
        const char = layout[r][c];

        if (char === '#') {
          const wall = this.scene.add.image(x, y, wallKey).setDepth(1);
          const wallPhys = this.scene.physics.add.staticImage(x, y, wallKey);
          wallPhys.setVisible(false);
          this.walls.add(wallPhys);
        } else {
          this.scene.add.image(x, y, floorKey).setDepth(0);

          switch (char) {
            case 'S':
              this.spawnPoints.player = { x, y };
              break;
            case 'E':
              this.spawnPoints.enemies.push({ x, y });
              break;
            case 'N':
              this.spawnPoints.npcs.push({ x, y });
              break;
            case 'L':
              this.spawnPoints.lore.push({ x, y });
              break;
            case 'W':
              this.spawnPoints.warps.push({ x, y });
              break;
            case 'C':
              this.spawnPoints.cards.push({ x, y });
              break;
            case 'P':
              this.scene.add.image(x, y, 'tile-portal').setDepth(0);
              this.spawnPoints.portals.push({ x, y });
              break;
            case 'B':
              this.spawnPoints.boss = { x, y };
              break;
            case 'D':
              this.spawnPoints.deckStation = { x, y };
              break;
            case '>':
              this.spawnPoints.arrows.push({ x, y, dir: 'right' });
              break;
            case '<':
              this.spawnPoints.arrows.push({ x, y, dir: 'left' });
              break;
            case 'v':
              this.spawnPoints.arrows.push({ x, y, dir: 'down' });
              break;
            case '^':
              this.spawnPoints.arrows.push({ x, y, dir: 'up' });
              break;
          }
        }
      }
    }

    return this;
  }
}

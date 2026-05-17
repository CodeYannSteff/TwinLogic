import Phaser from 'phaser';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = scene.physics.add.group();
  }

  executeCard(card, player, enemies) {
    const fn = this['_' + card.effect];
    if (fn) {
      fn.call(this, card, player, enemies);
    } else {
      console.warn('Unknown card effect:', card.effect);
    }
    // Cast flash on player
    this._castFlash(player, card.color);
  }

  // ── HELPERS ──────────────────────────────────────────

  _col(hex) { return Phaser.Display.Color.HexStringToColor(hex).color; }

  _castFlash(player, color) {
    const ring = this.scene.add.circle(player.x, player.y, 14, this._col(color), 0.4).setDepth(12);
    this.scene.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 250, onComplete: () => ring.destroy() });
  }

  _spawnTrail(obj, color, dur, interval = 40) {
    return this.scene.time.addEvent({
      delay: interval, repeat: Math.floor(dur / interval),
      callback: () => {
        if (!obj.active) return;
        const t = this.scene.add.circle(obj.x, obj.y, 1.5, this._col(color), 0.7).setDepth(10);
        this.scene.tweens.add({ targets: t, alpha: 0, scale: 0.2, duration: 200, onComplete: () => t.destroy() });
      }
    });
  }

  _hitFX(x, y, color, count = 5) {
    const c = this._col(color);
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.circle(x + Phaser.Math.Between(-4, 4), y + Phaser.Math.Between(-4, 4), 1.5, c, 0.9).setDepth(15);
      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-12, 12), y: p.y + Phaser.Math.Between(-12, 12),
        alpha: 0, duration: 300, onComplete: () => p.destroy()
      });
    }
  }

  _makeProjectile(x, y, vx, vy, card, enemies, pierce = false) {
    const proj = this.scene.add.circle(x, y, 3, this._col(card.color)).setDepth(11);
    this.scene.physics.add.existing(proj);
    proj.body.setVelocity(vx, vy);
    proj.damage = card.damage;
    this.projectiles.add(proj);

    const lifetime = (card.range || 120) / (card.speed || 200) * 1000;
    const trail = this._spawnTrail(proj, card.color, lifetime);

    if (enemies) {
      this.scene.physics.add.overlap(proj, enemies, (p, enemy) => {
        if (!enemy.active) return;
        const angle = Phaser.Math.Angle.Between(p.x, p.y, enemy.x, enemy.y);
        enemy.takeDamage(p.damage, angle);
        this._hitFX(enemy.x, enemy.y, card.color);
        if (!pierce) p.destroy();
      });
    }

    this.scene.time.delayedCall(lifetime, () => { if (proj.active) proj.destroy(); trail.remove(); });
    return proj;
  }

  // ── SPREAD SHOT ──────────────────────────────────────
  _spread_shot(card, player, enemies) {
    const facing = player.getFacingVector();
    const baseAngle = Math.atan2(facing.y, facing.x);
    const count = card.projectiles || 3;
    const spread = card.spreadAngle || 0.3;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - (count - 1) / 2) * spread;
      const vx = Math.cos(angle) * card.speed;
      const vy = Math.sin(angle) * card.speed;
      const ox = player.x + Math.cos(angle) * 8;
      const oy = player.y + Math.sin(angle) * 8;
      this._makeProjectile(ox, oy, vx, vy, card, enemies, card.pierce);
    }
  }

  // ── METEOR RAIN ──────────────────────────────────────
  _meteor_rain(card, player, enemies) {
    const facing = player.getFacingVector();
    const cx = player.x + facing.x * 40;
    const cy = player.y + facing.y * 40;
    const count = card.count || 5;
    const spreadArea = card.spread || 40;

    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const tx = cx + Phaser.Math.Between(-spreadArea, spreadArea);
        const ty = cy + Phaser.Math.Between(-spreadArea, spreadArea);

        // Shadow telegraph
        const shadow = this.scene.add.circle(tx, ty, card.radius || 14, 0x000000, 0.3).setDepth(7);
        this.scene.tweens.add({ targets: shadow, scale: 1.2, duration: 200 });

        this.scene.time.delayedCall(250, () => {
          shadow.destroy();
          // Impact
          const blast = this.scene.add.circle(tx, ty, card.radius || 14, this._col(card.color), 0.7).setDepth(9);
          this.scene.tweens.add({ targets: blast, scale: 2, alpha: 0, duration: 350, onComplete: () => blast.destroy() });

          // Inner flash
          const flash = this.scene.add.circle(tx, ty, 4, 0xffffff, 0.9).setDepth(10);
          this.scene.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

          // Screen shake on first impact
          if (i === 0) this.scene.cameras.main.shake(100, 0.005);

          if (enemies) {
            enemies.getChildren().forEach(enemy => {
              if (!enemy.active) return;
              if (Phaser.Math.Distance.Between(tx, ty, enemy.x, enemy.y) <= (card.radius || 14) + 8) {
                const angle = Phaser.Math.Angle.Between(tx, ty, enemy.x, enemy.y);
                enemy.takeDamage(card.damage, angle);
                this._hitFX(enemy.x, enemy.y, card.color);
              }
            });
          }
        });
      });
    }
  }

  // ── BEAM ─────────────────────────────────────────────
  _beam(card, player, enemies) {
    const facing = player.getFacingVector();
    const range = card.range || 140;
    const ex = player.x + facing.x * range;
    const ey = player.y + facing.y * range;
    const width = card.beamWidth || 6;

    // Draw beam line
    const beam = this.scene.add.graphics().setDepth(11);
    beam.lineStyle(width, this._col(card.color), 0.8);
    beam.lineBetween(player.x, player.y, ex, ey);
    // Inner bright core
    beam.lineStyle(width / 3, 0xffffff, 0.6);
    beam.lineBetween(player.x, player.y, ex, ey);

    // Edge sparks
    for (let i = 0; i < 8; i++) {
      const t = Math.random();
      const sx = player.x + (ex - player.x) * t + Phaser.Math.Between(-4, 4);
      const sy = player.y + (ey - player.y) * t + Phaser.Math.Between(-4, 4);
      const spark = this.scene.add.circle(sx, sy, 2, 0xffffff, 0.8).setDepth(12);
      this.scene.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-8, 8), y: spark.y + Phaser.Math.Between(-8, 8),
        alpha: 0, scale: 0, duration: 300, onComplete: () => spark.destroy()
      });
    }

    this.scene.cameras.main.shake(80, 0.004);

    // Fade beam
    this.scene.tweens.add({ targets: beam, alpha: 0, duration: card.duration || 350, onComplete: () => beam.destroy() });

    // Damage all enemies along the line
    if (enemies) {
      enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const dist = Phaser.Math.Distance.BetweenPointsSquared(
          { x: enemy.x, y: enemy.y },
          Phaser.Geom.Line.GetNearestPoint(new Phaser.Geom.Line(player.x, player.y, ex, ey), { x: enemy.x, y: enemy.y })
        );
        if (dist <= (width * 3) * (width * 3)) {
          const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
          enemy.takeDamage(card.damage, angle);
          this._hitFX(enemy.x, enemy.y, card.color, 8);
        }
      });
    }
  }

  // ── CHAIN LIGHTNING ──────────────────────────────────
  _chain_lightning(card, player, enemies) {
    if (!enemies) return;
    const facing = player.getFacingVector();
    const maxChains = card.chainCount || 4;
    const chainRange = card.chainRange || 50;
    const hit = new Set();
    let current = { x: player.x + facing.x * 10, y: player.y + facing.y * 10 };

    // Find first target in facing direction
    let closest = null;
    let closestDist = card.range || 100;
    enemies.getChildren().forEach(e => {
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y);
      if (d < closestDist) { closestDist = d; closest = e; }
    });
    if (!closest) return;

    const chain = [{ x: player.x, y: player.y }];
    let target = closest;

    for (let i = 0; i < maxChains && target; i++) {
      hit.add(target);
      chain.push({ x: target.x, y: target.y });
      const angle = Phaser.Math.Angle.Between(current.x, current.y, target.x, target.y);
      target.takeDamage(card.damage * (1 - i * 0.15), angle);
      this._hitFX(target.x, target.y, card.color, 6);
      current = { x: target.x, y: target.y };

      // Find next target
      target = null;
      let nextDist = chainRange;
      enemies.getChildren().forEach(e => {
        if (!e.active || hit.has(e)) return;
        const d = Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y);
        if (d < nextDist) { nextDist = d; target = e; }
      });
    }

    // Draw lightning bolts between chain points
    for (let i = 0; i < chain.length - 1; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        const a = chain[i], b = chain[i + 1];
        this._drawLightning(a.x, a.y, b.x, b.y, card.color);
      });
    }
    this.scene.cameras.main.flash(80, 136, 204, 255, false);
  }

  _drawLightning(x1, y1, x2, y2, color) {
    const g = this.scene.add.graphics().setDepth(13);
    const segments = 6;
    const points = [{ x: x1, y: y1 }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      points.push({
        x: x1 + (x2 - x1) * t + Phaser.Math.Between(-6, 6),
        y: y1 + (y2 - y1) * t + Phaser.Math.Between(-6, 6)
      });
    }
    points.push({ x: x2, y: y2 });

    g.lineStyle(3, this._col(color), 0.8);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.strokePath();
    g.lineStyle(1, 0xffffff, 0.9);
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.strokePath();

    this.scene.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
  }

  // ── HOMING SWARM ─────────────────────────────────────
  _homing_swarm(card, player, enemies) {
    if (!enemies) return;
    const count = card.count || 6;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 80, () => {
        const angle = Math.random() * Math.PI * 2;
        const bx = player.x + Math.cos(angle) * 6;
        const by = player.y + Math.sin(angle) * 6;
        const bug = this.scene.add.circle(bx, by, 2, this._col(card.color)).setDepth(11);
        this.scene.physics.add.existing(bug);
        bug.body.setCircle(2);
        this.projectiles.add(bug);

        const trail = this._spawnTrail(bug, card.color, 2000, 60);
        let life = 0;

        const update = () => {
          if (!bug.active) { this.scene.events.off('update', update); trail.remove(); return; }
          life += 16;
          // Find nearest enemy
          let nearest = null, nearDist = card.range || 80;
          enemies.getChildren().forEach(e => {
            if (!e.active) return;
            const d = Phaser.Math.Distance.Between(bug.x, bug.y, e.x, e.y);
            if (d < nearDist) { nearDist = d; nearest = e; }
          });
          if (nearest) {
            const a = Phaser.Math.Angle.Between(bug.x, bug.y, nearest.x, nearest.y);
            bug.body.setVelocity(Math.cos(a) * card.speed, Math.sin(a) * card.speed);
            if (nearDist < 8) {
              nearest.takeDamage(card.damage, a);
              this._hitFX(nearest.x, nearest.y, card.color, 3);
              bug.destroy();
            }
          } else {
            bug.body.setVelocity(Math.cos(angle) * card.speed * 0.5, Math.sin(angle) * card.speed * 0.5);
          }
          if (life > 2000) { bug.destroy(); trail.remove(); this.scene.events.off('update', update); }
        };
        this.scene.events.on('update', update);
      });
    }
  }

  // ── ORBITING SHIELD ──────────────────────────────────
  _orbiting_shield(card, player, enemies) {
    player.isInvulnerable = true;
    const orbs = [];
    const orbCount = 3;
    const radius = card.radius || 20;

    for (let i = 0; i < orbCount; i++) {
      const orb = this.scene.add.circle(0, 0, 4, this._col(card.color), 0.8).setDepth(12);
      orbs.push(orb);
    }

    // Shield ring
    const ring = this.scene.add.circle(player.x, player.y, radius).setDepth(11);
    ring.setStrokeStyle(1, this._col(card.color), 0.3);

    let elapsed = 0;
    const updateShield = (t, dt) => {
      elapsed += dt;
      ring.setPosition(player.x, player.y);
      for (let i = 0; i < orbCount; i++) {
        const a = elapsed * 0.004 + (i * Math.PI * 2 / orbCount);
        orbs[i].setPosition(player.x + Math.cos(a) * radius, player.y + Math.sin(a) * radius);
      }
      // Damage nearby enemies
      if (enemies && Math.floor(elapsed) % 300 < 20) {
        enemies.getChildren().forEach(enemy => {
          if (!enemy.active) return;
          const d = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
          if (d <= radius + 6) {
            const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
            enemy.takeDamage(card.damage * 0.3, angle);
          }
        });
      }
    };
    this.scene.events.on('update', updateShield);

    this.scene.time.delayedCall(card.duration, () => {
      player.isInvulnerable = false;
      orbs.forEach(o => o.destroy());
      ring.destroy();
      this.scene.events.off('update', updateShield);
    });
  }

  // ── TORNADO ──────────────────────────────────────────
  _tornado(card, player, enemies) {
    player.isInvulnerable = true;
    player.setAlpha(0.5);

    const particles = [];
    let elapsed = 0;

    const updateTornado = (t, dt) => {
      elapsed += dt;
      // Swirling sand particles
      if (Math.random() < 0.4) {
        const a = Math.random() * Math.PI * 2;
        const r = Phaser.Math.Between(4, card.pushRadius || 30);
        const p = this.scene.add.circle(
          player.x + Math.cos(a) * r, player.y + Math.sin(a) * r,
          1.5, this._col(card.color), 0.6
        ).setDepth(13);
        this.scene.tweens.add({
          targets: p,
          x: player.x + Math.cos(a + 1.5) * r * 0.5,
          y: player.y + Math.sin(a + 1.5) * r * 0.5 - 8,
          alpha: 0, scale: 0, duration: 400, onComplete: () => p.destroy()
        });
      }
      // Push enemies
      if (enemies) {
        enemies.getChildren().forEach(enemy => {
          if (!enemy.active) return;
          const d = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
          if (d <= (card.pushRadius || 30)) {
            const a = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
            enemy.body.setVelocity(Math.cos(a) * (card.pushForce || 150), Math.sin(a) * (card.pushForce || 150));
            if (Math.floor(elapsed) % 500 < 20) enemy.takeDamage(card.damage, a);
          }
        });
      }
    };
    this.scene.events.on('update', updateTornado);

    this.scene.time.delayedCall(card.duration, () => {
      player.isInvulnerable = false;
      player.setAlpha(1);
      this.scene.events.off('update', updateTornado);
    });
  }

  // ── DASH STRIKE ──────────────────────────────────────
  _dash_strike(card, player, enemies) {
    const facing = player.getFacingVector();
    const dist = card.dashDistance || 60;
    const startX = player.x, startY = player.y;
    const endX = player.x + facing.x * dist;
    const endY = player.y + facing.y * dist;

    player.isInvulnerable = true;
    player.setAlpha(0.3);

    // Afterimage trail
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 30, () => {
        const ghost = this.scene.add.circle(
          startX + (endX - startX) * (i / 5),
          startY + (endY - startY) * (i / 5),
          6, this._col(card.color), 0.4
        ).setDepth(9);
        this.scene.tweens.add({ targets: ghost, alpha: 0, scale: 0.2, duration: 300, onComplete: () => ghost.destroy() });
      });
    }

    // Move player
    this.scene.tweens.add({
      targets: player, x: endX, y: endY, duration: card.duration || 150,
      onComplete: () => {
        player.isInvulnerable = false;
        player.setAlpha(1);
        this.scene.cameras.main.shake(60, 0.003);
      }
    });

    // Damage enemies along path
    if (enemies) {
      enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const nearest = Phaser.Geom.Line.GetNearestPoint(
          new Phaser.Geom.Line(startX, startY, endX, endY),
          { x: enemy.x, y: enemy.y }
        );
        const d = Phaser.Math.Distance.Between(nearest.x, nearest.y, enemy.x, enemy.y);
        if (d <= 14) {
          const angle = Phaser.Math.Angle.Between(startX, startY, enemy.x, enemy.y);
          enemy.takeDamage(card.damage, angle);
          this._hitFX(enemy.x, enemy.y, card.color, 6);
        }
      });
    }
  }

  // ── HEAL WAVE ────────────────────────────────────────
  _heal_wave(card, player, enemies) {
    player.heal(card.healAmount);
    const facing = player.getFacingVector();

    // Expanding healing ring
    const ring = this.scene.add.circle(player.x, player.y, 4, this._col(card.color), 0.5).setDepth(9);
    this.scene.tweens.add({
      targets: ring, scale: 6, alpha: 0, duration: 600,
      onComplete: () => ring.destroy()
    });

    // Healing sparkles on player
    for (let i = 0; i < 10; i++) {
      const p = this.scene.add.circle(
        player.x + Phaser.Math.Between(-10, 10),
        player.y + Phaser.Math.Between(-10, 10),
        2, 0x44ffcc, 0.8
      ).setDepth(13);
      this.scene.tweens.add({
        targets: p, y: p.y - 14, alpha: 0, duration: 500 + i * 50,
        onComplete: () => p.destroy()
      });
    }

    // Damage wave projectile
    const wave = this.scene.add.circle(player.x, player.y, 6, this._col(card.color), 0.6).setDepth(11);
    this.scene.physics.add.existing(wave);
    wave.body.setVelocity(facing.x * card.speed, facing.y * card.speed);
    this.projectiles.add(wave);

    const trail = this._spawnTrail(wave, card.color, 1200, 30);

    if (enemies) {
      this.scene.physics.add.overlap(wave, enemies, (w, enemy) => {
        if (!enemy.active) return;
        const angle = Phaser.Math.Angle.Between(w.x, w.y, enemy.x, enemy.y);
        enemy.takeDamage(card.damage, angle);
        this._hitFX(enemy.x, enemy.y, card.color, 4);
      });
    }
    this.scene.time.delayedCall(1200, () => { if (wave.active) wave.destroy(); trail.remove(); });
  }

  // ── GRAVITY WELL ─────────────────────────────────────
  _gravity_well(card, player, enemies) {
    const facing = player.getFacingVector();
    const cx = player.x + facing.x * 40;
    const cy = player.y + facing.y * 40;
    const radius = card.radius || 48;

    // Rift visual
    const rift = this.scene.add.circle(cx, cy, 4, this._col(card.color), 0.9).setDepth(9);
    const ring1 = this.scene.add.circle(cx, cy, radius).setDepth(8);
    ring1.setStrokeStyle(2, this._col(card.color), 0.4);
    const ring2 = this.scene.add.circle(cx, cy, radius * 0.6).setDepth(8);
    ring2.setStrokeStyle(1, 0xffffff, 0.2);

    this.scene.tweens.add({ targets: rift, scale: 3, duration: 300, yoyo: true, repeat: -1 });
    this.scene.tweens.add({ targets: ring1, scale: 0.8, duration: 500, yoyo: true, repeat: -1 });
    this.scene.tweens.add({ targets: ring2, angle: 360, duration: 1000, repeat: -1 });

    // Swirl particles
    const particleTimer = this.scene.time.addEvent({
      delay: 60, repeat: Math.floor(card.duration / 60),
      callback: () => {
        const a = Math.random() * Math.PI * 2;
        const r = Phaser.Math.Between(radius * 0.3, radius);
        const p = this.scene.add.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, this._col(card.color), 0.7).setDepth(10);
        this.scene.tweens.add({
          targets: p, x: cx, y: cy, alpha: 0, duration: 400, onComplete: () => p.destroy()
        });
      }
    });

    // Pull + damage enemies
    const pullUpdate = () => {
      if (!enemies) return;
      enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        const d = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
        if (d <= radius) {
          const a = Phaser.Math.Angle.Between(enemy.x, enemy.y, cx, cy);
          const force = card.pullForce || 80;
          enemy.body.setVelocity(Math.cos(a) * force, Math.sin(a) * force);
        }
      });
    };
    this.scene.events.on('update', pullUpdate);

    // Explode at end
    this.scene.time.delayedCall(card.duration, () => {
      this.scene.events.off('update', pullUpdate);
      particleTimer.remove();

      // Explosion
      const boom = this.scene.add.circle(cx, cy, 6, 0xffffff, 0.9).setDepth(14);
      this.scene.tweens.add({ targets: boom, scale: 8, alpha: 0, duration: 400, onComplete: () => boom.destroy() });
      this.scene.cameras.main.shake(200, 0.01);
      this.scene.cameras.main.flash(100, 180, 50, 255, false);

      if (enemies) {
        enemies.getChildren().forEach(enemy => {
          if (!enemy.active) return;
          if (Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y) <= radius) {
            const angle = Phaser.Math.Angle.Between(cx, cy, enemy.x, enemy.y);
            enemy.takeDamage(card.damage, angle);
            this._hitFX(enemy.x, enemy.y, card.color, 8);
          }
        });
      }
      rift.destroy(); ring1.destroy(); ring2.destroy();
    });
  }

  // ── FREEZE SHATTER ───────────────────────────────────
  _freeze_shatter(card, player, enemies) {
    const radius = card.radius || 56;

    // Freeze ring
    const ring = this.scene.add.circle(player.x, player.y, radius, this._col(card.color), 0.15).setDepth(8);
    const border = this.scene.add.circle(player.x, player.y, radius).setDepth(8);
    border.setStrokeStyle(2, this._col(card.color), 0.5);

    // Ice crystals
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = radius * 0.8;
      const crystal = this.scene.add.rectangle(
        player.x + Math.cos(a) * r, player.y + Math.sin(a) * r,
        2, 6, 0xaaddff, 0.6
      ).setDepth(9).setRotation(a);
      this.scene.tweens.add({ targets: crystal, alpha: 0, duration: card.duration + 400, onComplete: () => crystal.destroy() });
    }

    const frozen = [];
    if (enemies) {
      enemies.getChildren().forEach(enemy => {
        if (!enemy.active) return;
        if (Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y) <= radius) {
          const origSpeed = enemy.speed;
          enemy.speed = 0;
          enemy.body.setVelocity(0, 0);
          enemy.setTint(0x8888ff);
          frozen.push({ enemy, origSpeed });

          // Freeze damage
          enemy.takeDamage(card.damage * 0.3, 0);
        }
      });
    }

    // Shatter after duration
    this.scene.time.delayedCall(card.duration, () => {
      ring.destroy(); border.destroy();
      this.scene.cameras.main.shake(150, 0.008);
      this.scene.cameras.main.flash(60, 130, 170, 255, false);

      frozen.forEach(({ enemy, origSpeed }) => {
        if (enemy.active) {
          enemy.speed = origSpeed;
          enemy.clearTint();
          enemy.takeDamage(card.shatterDamage || 15, 0);
          this._hitFX(enemy.x, enemy.y, '#aaddff', 8);

          // Shatter crystal fragments
          for (let i = 0; i < 4; i++) {
            const shard = this.scene.add.rectangle(
              enemy.x + Phaser.Math.Between(-4, 4), enemy.y + Phaser.Math.Between(-4, 4),
              2, 3, 0xaaddff, 0.8
            ).setDepth(14).setRotation(Math.random() * 3);
            this.scene.tweens.add({
              targets: shard,
              x: shard.x + Phaser.Math.Between(-16, 16), y: shard.y + Phaser.Math.Between(-16, 16),
              alpha: 0, rotation: shard.rotation + 3, duration: 400, onComplete: () => shard.destroy()
            });
          }
        }
      });
    });
  }

  // ── EXPLODING ORB ────────────────────────────────────
  _exploding_orb(card, player, enemies) {
    const facing = player.getFacingVector();
    const ox = player.x + facing.x * 8;
    const oy = player.y + facing.y * 8;

    const orb = this.scene.add.circle(ox, oy, 5, this._col(card.color), 0.9).setDepth(11);
    const glow = this.scene.add.circle(ox, oy, 10, this._col(card.color), 0.2).setDepth(10);
    this.scene.physics.add.existing(orb);
    orb.body.setVelocity(facing.x * card.speed, facing.y * card.speed);
    this.projectiles.add(orb);

    // Pulsing glow
    this.scene.tweens.add({ targets: glow, scale: 1.5, alpha: 0.4, duration: 300, yoyo: true, repeat: -1 });
    const trail = this._spawnTrail(orb, card.color, 3000, 30);

    const lifetime = (card.range || 90) / (card.speed || 80) * 1000;
    let exploded = false;

    const explode = (ex, ey) => {
      if (exploded) return;
      exploded = true;
      orb.destroy(); glow.destroy(); trail.remove();

      const expRadius = card.explosionRadius || 36;
      // Multi-ring explosion
      for (let r = 0; r < 3; r++) {
        this.scene.time.delayedCall(r * 50, () => {
          const ring = this.scene.add.circle(ex, ey, expRadius * (0.3 + r * 0.35), this._col(card.color), 0.5 - r * 0.15).setDepth(13);
          this.scene.tweens.add({ targets: ring, scale: 1.5, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
        });
      }
      const flash = this.scene.add.circle(ex, ey, 6, 0xffffff, 1).setDepth(14);
      this.scene.tweens.add({ targets: flash, scale: 4, alpha: 0, duration: 250, onComplete: () => flash.destroy() });

      this.scene.cameras.main.shake(200, 0.012);

      if (enemies) {
        enemies.getChildren().forEach(enemy => {
          if (!enemy.active) return;
          if (Phaser.Math.Distance.Between(ex, ey, enemy.x, enemy.y) <= expRadius) {
            const angle = Phaser.Math.Angle.Between(ex, ey, enemy.x, enemy.y);
            enemy.takeDamage(card.damage, angle);
            this._hitFX(enemy.x, enemy.y, card.color, 6);
          }
        });
      }
    };

    if (enemies) {
      this.scene.physics.add.overlap(orb, enemies, (o, enemy) => {
        explode(o.x, o.y);
      });
    }

    // Track glow position
    const glowUpdate = () => {
      if (!orb.active) { this.scene.events.off('update', glowUpdate); return; }
      glow.setPosition(orb.x, orb.y);
    };
    this.scene.events.on('update', glowUpdate);

    this.scene.time.delayedCall(lifetime, () => {
      if (orb.active) explode(orb.x, orb.y);
    });
  }

  cleanup() {
    this.projectiles.clear(true, true);
  }
}

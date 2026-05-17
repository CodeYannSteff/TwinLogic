import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config = {}) {
    super(scene, x, y, config.texture || 'enemy');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(16, 18);
    this.body.setOffset(8, 12);
    this.body.setImmovable(false);
    this.setDepth(9);

    this.hp = config.hp || 30;
    this.maxHp = this.hp;
    this.damage = config.damage || 10;
    this.speed = config.speed || 40;
    this.aggroRange = config.aggroRange || 80;
    this.attackRange = config.attackRange || 16;
    this.attackCooldown = config.attackCooldown || 1000;
    this.lastAttackTime = 0;
    this.state = 'patrol'; // patrol, chase, attack
    this.patrolDir = { x: 1, y: 0 };
    this.patrolTimer = 0;
    this.patrolFlipTime = Phaser.Math.Between(1500, 3000);
    this.knockbackResist = config.knockbackResist || 0;
    this.name = config.name || 'Enemy';
    this.xpReward = config.xpReward || 10;

    this.behavior = config.behavior || 'normal';
    this.chargeSpeed = config.chargeSpeed || this.speed * 3;
    this.isCharging = false;
    this.chargeTimer = 0;
    this.chargeCooldown = config.chargeCooldown || 3000;
    this.lastChargeTime = -9999;
    this.rangedRange = config.rangedRange || 100;
    this.projectileSpeed = config.projectileSpeed || 120;
    this.shieldHp = config.shieldHp || 0;
    this.maxShieldHp = this.shieldHp;
    this.shieldActive = this.shieldHp > 0;
    this.strafeDir = 1;
    this.strafeTimer = 0;

    this.hpBar = scene.add.rectangle(x, y - 18, 24, 4, 0x00ff00);
    this.hpBar.setDepth(15);
    this.hpBarBg = scene.add.rectangle(x, y - 18, 24, 4, 0x330000);
    this.hpBarBg.setDepth(14);

    if (this.shieldActive) {
      this.shieldGfx = scene.add.circle(x, y, 18, 0x4488ff, 0.2).setDepth(8);
    }
  }

  update(time, player) {
    if (this.hp <= 0 || !this.active || !this.body) return;
    if (!player || !player.active) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

    if (dist <= this.aggroRange) {
      this.state = 'chase';

      switch (this.behavior) {
        case 'charger':
          this._updateCharger(time, player, dist, angle);
          break;
        case 'ranged':
          this._updateRanged(time, player, dist, angle);
          break;
        case 'shielded':
          this._updateShielded(time, player, dist, angle);
          break;
        default:
          this._updateNormal(time, player, dist, angle);
          break;
      }
    } else {
      this.state = 'patrol';
      this.isCharging = false;
      this.patrolTimer += 16;
      if (this.patrolTimer >= this.patrolFlipTime) {
        this.patrolTimer = 0;
        this.patrolFlipTime = Phaser.Math.Between(1500, 3000);
        this.patrolDir.x = Phaser.Math.Between(-1, 1);
        this.patrolDir.y = Phaser.Math.Between(-1, 1);
      }
      this.body.setVelocity(
        this.patrolDir.x * this.speed * 0.3,
        this.patrolDir.y * this.speed * 0.3
      );
    }

    // Maintain HP bar position, width, and dynamic coloration
    this.hpBar.setPosition(this.x, this.y - 18);
    this.hpBarBg.setPosition(this.x, this.y - 18);
    const hpPercent = this.hp / this.maxHp;
    this.hpBar.width = 24 * hpPercent;
    this.hpBar.fillColor = hpPercent > 0.5 ? 0x00ff00 : hpPercent > 0.25 ? 0xffaa00 : 0xff0000;

    if (this.shieldGfx) {
      this.shieldGfx.setPosition(this.x, this.y);
      this.shieldGfx.setVisible(this.shieldActive);
      if (this.shieldActive) {
        this.shieldGfx.alpha = 0.15 + Math.sin(time * 0.005) * 0.1;
      }
    }
  }

  _updateNormal(time, player, dist, angle) {
    this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    if (dist <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
      this.lastAttackTime = time;
      this.attack(player);
    }
  }

  _updateCharger(time, player, dist, angle) {
    if (this.isCharging) {
      this.chargeTimer -= 16;
      if (this.chargeTimer <= 0) {
        this.isCharging = false;
        if (this.body) this.body.setVelocity(0, 0);
        if (this.active) this.clearTint();
      }
      if (dist <= this.attackRange + 4 && player.active) {
        player.takeDamage(this.damage * 1.5);
        this.isCharging = false;
        if (this.body) this.body.setVelocity(0, 0);
        if (this.active) this.clearTint();
      }
      return;
    }

    if (dist > 60) {
      this.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else if (time > this.lastChargeTime + this.chargeCooldown) {
      // Launch a rapid, telegraphed charge toward the player
      this.lastChargeTime = time;
      this.isCharging = true;
      this.chargeTimer = 400;
      this.setTint(0xff4444);
      this.body.setVelocity(Math.cos(angle) * this.chargeSpeed, Math.sin(angle) * this.chargeSpeed);
    } else {
      // Circle around the player while waiting for the cooldown to expire
      const perpAngle = angle + Math.PI / 2;
      this.body.setVelocity(Math.cos(perpAngle) * this.speed * 0.6, Math.sin(perpAngle) * this.speed * 0.6);
    }
  }

  _updateRanged(time, player, dist, angle) {
    // Maintain a safe shooting distance, strafe side-to-side, and attack
    this.strafeTimer += 16;
    if (this.strafeTimer > 2000) {
      this.strafeTimer = 0;
      this.strafeDir *= -1;
    }
    const perpAngle = angle + (Math.PI / 2) * this.strafeDir;

    if (dist < 50) {
      this.body.setVelocity(Math.cos(angle + Math.PI) * this.speed, Math.sin(angle + Math.PI) * this.speed);
    } else if (dist > this.rangedRange) {
      this.body.setVelocity(Math.cos(angle) * this.speed * 0.5, Math.sin(angle) * this.speed * 0.5);
    } else {
      this.body.setVelocity(Math.cos(perpAngle) * this.speed * 0.5, Math.sin(perpAngle) * this.speed * 0.5);
    }

    if (time > this.lastAttackTime + this.attackCooldown && dist <= this.rangedRange) {
      this.lastAttackTime = time;
      this._fireProjectile(angle);
    }
  }

  _fireProjectile(angle) {
    if (!this.scene || !this.active) return;
    const scene = this.scene;
    const dmg = this.damage;
    const proj = scene.add.circle(this.x, this.y, 3, 0xff4466, 1).setDepth(12);
    const vx = Math.cos(angle) * this.projectileSpeed;
    const vy = Math.sin(angle) * this.projectileSpeed;
    const startTime = scene.time.now;

    const timer = scene.time.addEvent({
      delay: 16, repeat: 120,
      callback: () => {
        if (!proj || !proj.active) { timer.remove(); return; }
        if (!scene || !scene.player) { proj.destroy(); timer.remove(); return; }
        proj.x += vx * 0.016;
        proj.y += vy * 0.016;
        // Hit player
        const player = scene.player;
        if (player && player.active && Phaser.Math.Distance.Between(proj.x, proj.y, player.x, player.y) < 12) {
          player.takeDamage(dmg);
          proj.destroy();
          timer.remove();
          return;
        }
        if (scene.time.now - startTime > 2000) {
          proj.destroy();
          timer.remove();
        }
      }
    });
  }

  _updateShielded(time, player, dist, angle) {
    // Follow target, attack, and occasionally regenerate defensive shields
    this.body.setVelocity(Math.cos(angle) * this.speed * 0.7, Math.sin(angle) * this.speed * 0.7);
    if (dist <= this.attackRange && time > this.lastAttackTime + this.attackCooldown) {
      this.lastAttackTime = time;
      this.attack(player);
      if (!this.shieldActive && Math.random() < 0.3) {
        this.shieldHp = this.maxShieldHp;
        this.shieldActive = true;
      }
    }
  }

  attack(player) {
    if (player && player.active) player.takeDamage(this.damage);
  }

  takeDamage(amount, knockbackAngle = 0) {
    if (!this.active || !this.scene) return;
    
    // Shield absorbs damage first
    if (this.shieldActive && this.shieldHp > 0) {
      this.shieldHp -= amount;
      if (this.shieldHp <= 0) {
        this.shieldActive = false;
        this.shieldHp = 0;
        if (this.shieldGfx && this.scene) {
          this.scene.tweens.add({ targets: this.shieldGfx, alpha: 0.6, scale: 2, duration: 200, onComplete: () => { if (this.shieldGfx) this.shieldGfx.setScale(1); } });
        }
      }
      return;
    }
    this.hp -= amount;

    // Provide visual impact feedback via a white flash
    if (this.active) this.setTintFill(0xffffff);
    if (this.scene) this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });

    // Apply knockback force scaling with enemy resistance
    if (this.knockbackResist < 1 && this.body) {
      const kb = 120 * (1 - this.knockbackResist);
      this.body.setVelocity(
        Math.cos(knockbackAngle) * kb,
        Math.sin(knockbackAngle) * kb
      );
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.scene) return;
    
    // Spawn red pixel debris falling outward on death
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-4, 4),
        this.y + Phaser.Math.Between(-4, 4),
        2, 2, 0xff4444
      ).setDepth(20);
      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-16, 16),
        y: p.y + Phaser.Math.Between(-16, 16),
        alpha: 0,
        duration: 400,
        onComplete: () => p.destroy()
      });
    }

    this.scene.events.emit('enemy-killed', this);
    this.hpBar.destroy();
    this.hpBarBg.destroy();
    if (this.shieldGfx) this.shieldGfx.destroy();
    this.destroy();
  }
}

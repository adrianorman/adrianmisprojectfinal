// Sound manager
const SoundManager = {
    shoot: () => document.getElementById('shootSound').play().catch(e => console.log('Sound error:', e)),
    hit: () => document.getElementById('hitSound').play().catch(e => console.log('Sound error:', e)),
    pickup: () => document.getElementById('pickupSound').play().catch(e => console.log('Sound error:', e)),
    hurt: () => document.getElementById('hurtSound').play().catch(e => console.log('Sound error:', e)),
    spawn: () => document.getElementById('enemySpawnSound').play().catch(e => console.log('Sound error:', e))
};

class Player {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.moveSpeed = 0.08;
        this.rotateSpeed = 0.003;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 50;
        this.maxAmmo = 100;
        this.lastShot = 0;
        this.shootDelay = 250; // Milliseconds between shots
        this.damage = 25; // Damage per shot
        this.kills = 0;
    }

    rotate(angle) {
        this.direction += angle;
    }

    move(distance, strafe = false) {
        let newX, newY;
        
        if (strafe) {
            // Strafe movement (perpendicular to direction)
            newX = this.x + Math.cos(this.direction + Math.PI / 2) * distance;
            newY = this.y + Math.sin(this.direction + Math.PI / 2) * distance;
        } else {
            // Forward/backward movement
            newX = this.x + Math.cos(this.direction) * distance;
            newY = this.y + Math.sin(this.direction) * distance;
        }
        
        // Collision detection with margin
        const margin = 0.2;
        if (!worldMap[Math.floor(newY)][Math.floor(newX)] &&
            !worldMap[Math.floor(newY + margin * Math.sign(newY - this.y))][Math.floor(newX + margin * Math.sign(newX - this.x))]) {
            this.x = newX;
            this.y = newY;
        }
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 50;
        this.speed = 0.03;
        this.damage = 10;
        this.lastAttack = 0;
        this.attackDelay = 1000; // Milliseconds between attacks
        this.isAlive = true;
    }

    update(player) {
        if (!this.isAlive) return;

        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.5) { // Don't get too close
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // Attack player if close enough
        if (distance < 1 && Date.now() - this.lastAttack > this.attackDelay) {
            player.health -= this.damage;
            this.lastAttack = Date.now();
            player.health = Math.max(0, player.health); // Prevent negative health
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.isAlive = false;
            player.kills++; // Increment kill count
            document.getElementById('kills').textContent = player.kills;
            
            // 30% chance to drop health, 30% chance to drop ammo
            const random = Math.random();
            if (random < 0.3) {
                pickups.push(new Pickup(this.x, this.y, 'health'));
            } else if (random < 0.6) {
                pickups.push(new Pickup(this.x, this.y, 'ammo'));
            }

            // Spawn new enemy in a random location
            spawnNewEnemy();
        }
        SoundManager.hit();
    }
}

class Pickup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health' or 'ammo'
        this.amount = type === 'health' ? 25 : 15; // Health gives 25, ammo gives 15
    }

    collect(player) {
        if (this.type === 'health') {
            player.health = Math.min(player.maxHealth, player.health + this.amount);
        } else {
            player.ammo = Math.min(player.maxAmmo, player.ammo + this.amount);
        }
        SoundManager.pickup();
        return true; // Signal that pickup was collected
    }
}

let enemies = [];
let pickups = [];
let projectiles = [];

class Projectile {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = 0.2;
        this.isActive = true;
    }

    update() {
        if (!this.isActive) return;

        // Move projectile
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Check wall collision
        if (worldMap[Math.floor(this.y)][Math.floor(this.x)] > 0) {
            this.isActive = false;
            return;
        }

        // Check enemy collision
        enemies.forEach(enemy => {
            if (enemy.isAlive) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 0.5) {
                    enemy.takeDamage(player.damage);
                    this.isActive = false;
                }
            }
        });
    }
}

// Doom-style map (1-4 = different wall types, 0 = empty)
const worldMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,2,2,2,0,0,0,0,3,3,3,0,0,1],
    [1,0,0,2,0,0,0,0,0,0,0,0,3,0,0,1],
    [1,0,0,2,0,0,0,0,0,0,0,0,3,0,0,1],
    [1,0,0,0,0,0,0,4,4,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,4,4,0,0,0,0,0,0,1],
    [1,0,0,3,0,0,0,0,0,0,0,0,2,0,0,1],
    [1,0,0,3,0,0,0,0,0,0,0,0,2,0,0,1],
    [1,0,0,3,3,3,0,0,0,0,2,2,2,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let player;
let canvas;
let ctx;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const FOV = Math.PI / 3; // 60 degrees field of view
const HALF_FOV = FOV / 2;

// Keyboard state
const keys = {};
let isRunning = false;

function getRandomSpawnPosition() {
    let x, y;
    do {
        // Keep enemies away from player spawn
        x = Math.floor(Math.random() * (worldMap[0].length - 2)) + 1;
        y = Math.floor(Math.random() * (worldMap.length - 2)) + 1;
    } while (
        worldMap[y][x] !== 0 || // Ensure spawn point is in empty space
        (Math.abs(x - player.x) < 3 && Math.abs(y - player.y) < 3) // Keep away from player
    );
    return { x, y };
}

function spawnNewEnemy() {
    const pos = getRandomSpawnPosition();
    const enemy = new Enemy(pos.x, pos.y);
    enemies.push(enemy);
    SoundManager.spawn();
}

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    player = new Player(2, 2, 0);
    
    // Initialize enemies at strategic positions
    enemies = [
        new Enemy(5, 5),
        new Enemy(12, 3),
        new Enemy(3, 10),
        new Enemy(10, 8),
        new Enemy(14, 11)
    ];
    
    // Pointer lock setup
    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

    canvas.onclick = function() {
        canvas.requestPointerLock();
        // Show title briefly
        const title = document.getElementById('title');
        title.classList.add('show');
        setTimeout(() => title.classList.remove('show'), 2000);
    };

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    
    // Start the game loop
    gameLoop();
}

function shoot() {
    if (player.ammo > 0 && Date.now() - player.lastShot > player.shootDelay) {
        projectiles.push(new Projectile(player.x, player.y, player.direction));
        player.ammo--;
        player.lastShot = Date.now();
        SoundManager.shoot();
    }
}

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Shift') {
        isRunning = true;
    }
    // Space bar to shoot
    if (e.code === 'Space') {
        shoot();
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
    if (e.key === 'Shift') {
        isRunning = false;
    }
}

function handleMouseMove(e) {
    if (document.pointerLockElement === canvas) {
        player.rotate(e.movementX * player.rotateSpeed);
    }
}

function updatePlayer() {
    const speed = player.moveSpeed * (isRunning ? 1.5 : 1);
    
    // Movement
    if (keys['w']) player.move(speed);
    if (keys['s']) player.move(-speed);
    if (keys['a']) player.move(-speed, true);  // Strafe left
    if (keys['d']) player.move(speed, true);   // Strafe right

    // Check for pickups
    pickups = pickups.filter(pickup => {
        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.5) {
            return !pickup.collect(player);
        }
        return true;
    });
    
    // Update HUD with colors based on health
    const healthElement = document.getElementById('health');
    const oldHealth = parseInt(healthElement.textContent);
    healthElement.textContent = player.health;
    
    if (player.health < oldHealth) {
        SoundManager.hurt();
    }
    
    if (player.health < 25) {
        healthElement.style.color = '#FF0000';
    } else if (player.health < 50) {
        healthElement.style.color = '#FFA500';
    } else {
        healthElement.style.color = '#00FF00';
    }

    // Update ammo count with color
    const ammoElement = document.getElementById('ammo');
    ammoElement.textContent = player.ammo;
    ammoElement.style.color = player.ammo < 10 ? '#FF0000' : '#00FF00';

    // Position display
    document.getElementById('posX').textContent = player.x.toFixed(1);
    document.getElementById('posY').textContent = player.y.toFixed(1);

    // Left mouse button to shoot
    if (keys['mouse0'] && Date.now() - player.lastShot > player.shootDelay) {
        shoot();
    }
}

function drawFloorAndCeiling() {
    // Draw ceiling (dark gray)
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    
    // Draw floor (darker)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
}

function getWallColor(wallType, side, distance) {
    // Base colors for different wall types
    const wallColors = {
        1: { light: '#8B0000', dark: '#5a0000' },  // Red brick
        2: { light: '#4a4a4a', dark: '#2a2a2a' },  // Gray stone
        3: { light: '#8B6914', dark: '#5a4509' },  // Brown wood
        4: { light: '#1a5490', dark: '#0a3460' }   // Blue metal
    };
    
    const colors = wallColors[wallType] || wallColors[1];
    let color = side === 0 ? colors.light : colors.dark;
    
    // Apply distance shading
    const brightness = Math.max(0.3, 1 - distance / 12);
    return shadeColor(color, brightness);
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function castRays() {
    drawFloorAndCeiling();
    
    const planeX = Math.cos(player.direction + Math.PI / 2) * Math.tan(HALF_FOV);
    const planeY = Math.sin(player.direction + Math.PI / 2) * Math.tan(HALF_FOV);

    for (let x = 0; x < SCREEN_WIDTH; x++) {
        // Calculate ray position and direction
        const cameraX = 2 * x / SCREEN_WIDTH - 1;
        const rayDirX = Math.cos(player.direction) + planeX * cameraX;
        const rayDirY = Math.sin(player.direction) + planeY * cameraX;
        
        // Which box of the map we're in
        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);
        
        // Length of ray from current position to next x or y-side
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        
        // Calculate step and initial sideDist
        let stepX, stepY, sideDistX, sideDistY;
        
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (player.x - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
        }
        
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (player.y - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
        }
        
        // Perform DDA
        let hit = 0;
        let side;
        let wallType = 1;
        
        while (hit === 0) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            
            if (mapY >= 0 && mapY < worldMap.length && 
                mapX >= 0 && mapX < worldMap[0].length && 
                worldMap[mapY][mapX] > 0) {
                hit = 1;
                wallType = worldMap[mapY][mapX];
            }
        }
        
        // Calculate distance to wall
        let perpWallDist;
        if (side === 0) {
            perpWallDist = Math.abs((mapX - player.x + (1 - stepX) / 2) / rayDirX);
        } else {
            perpWallDist = Math.abs((mapY - player.y + (1 - stepY) / 2) / rayDirY);
        }
        
        // Calculate height of line to draw
        const lineHeight = Math.abs(Math.floor(SCREEN_HEIGHT / perpWallDist));
        
        // Calculate lowest and highest pixel to fill in current stripe
        let drawStart = Math.max(0, -lineHeight / 2 + SCREEN_HEIGHT / 2);
        let drawEnd = Math.min(SCREEN_HEIGHT - 1, lineHeight / 2 + SCREEN_HEIGHT / 2);
        
        // Choose wall color with shading
        const color = getWallColor(wallType, side, perpWallDist);
        
        // Draw the vertical stripe
        ctx.fillStyle = color;
        ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
    }
    
    // Draw weapon/crosshair
    drawWeapon();
}

function drawEntities() {
    // Draw enemies in the 3D view
    enemies.forEach(enemy => {
        if (!enemy.isAlive) return;
        
        // Calculate enemy position relative to player
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle between player's direction and enemy
        const angle = Math.atan2(dy, dx) - player.direction;
        
        // Only draw if enemy is in front of player (within field of view)
        if (Math.abs(angle) < FOV / 2) {
            // Calculate screen position
            const screenX = (SCREEN_WIDTH / 2) * (1 + angle / (FOV / 2));
            const size = SCREEN_HEIGHT / distance;
            
            // Draw enemy sprite (simple rectangle for now)
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(screenX - size/2, SCREEN_HEIGHT/2 - size/2, size, size);
        }
    });

    // Draw projectiles
    projectiles.forEach(proj => {
        if (!proj.isActive) return;
        const dx = proj.x - player.x;
        const dy = proj.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) - player.direction;
        
        if (Math.abs(angle) < FOV / 2) {
            const screenX = (SCREEN_WIDTH / 2) * (1 + angle / (FOV / 2));
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(screenX, SCREEN_HEIGHT/2, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw pickups
    pickups.forEach(pickup => {
        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) - player.direction;
        
        if (Math.abs(angle) < FOV / 2) {
            const screenX = (SCREEN_WIDTH / 2) * (1 + angle / (FOV / 2));
            const size = SCREEN_HEIGHT / distance / 2;
            
            ctx.fillStyle = pickup.type === 'health' ? '#00FF00' : '#0000FF';
            ctx.fillRect(screenX - size/2, SCREEN_HEIGHT/2 - size/2, size, size);
        }
    });
}

function drawWeapon() {
    // Draw simple crosshair
    ctx.strokeStyle = player.ammo > 0 ? '#00FF00' : '#FF0000';
    ctx.lineWidth = 2;
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX, centerY + 10);
    ctx.stroke();
    
    // Weapon sprite (simple gun representation)
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(SCREEN_WIDTH / 2 - 40, SCREEN_HEIGHT - 120, 80, 40);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(SCREEN_WIDTH / 2 - 15, SCREEN_HEIGHT - 140, 30, 80);
    
    // Gun barrel
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(SCREEN_WIDTH / 2 - 8, SCREEN_HEIGHT - 160, 16, 30);
}

function updateGame() {
    updatePlayer();
    
    // Update enemies
    enemies.forEach(enemy => enemy.update(player));
    
    // Update projectiles
    projectiles = projectiles.filter(proj => {
        proj.update();
        return proj.isActive;
    });

    // Game over check
    if (player.health <= 0) {
        const title = document.getElementById('title');
        title.textContent = 'GAME OVER';
        title.style.color = '#FF0000';
        title.classList.add('show');
        setTimeout(() => {
            if (confirm('Game Over! Would you like to restart?')) {
                location.reload();
            }
        }, 1000);
    }
}

function gameLoop() {
    updateGame();
    castRays();
    drawEntities();
    requestAnimationFrame(gameLoop);
}

window.onload = init;

class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 300;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.MAX_SPEED = 200;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 20;
        this.SCALE = 2.0;
        this.spawnX = 16;
        this.spawnY = 200;
        this.dead = false;

        this.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.WKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.SPACE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    create() {
        // End level scene
        this.levelClearedText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Level Cleared!', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

        this.sfx = {
            death: this.sound.add('deathImpact', { volume: 1 }),      // Louder than normal
            walk: this.sound.add('walkConcrete', { loop: true, volume: 0.2 }) // Louder and loops
        };
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 16, 16, 80, 40);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("Platformer Asset All H", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Background-n-Details", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        
     
        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true,
            kills: true
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "coins",
            frame: 151
        });

        // Load the end zone object from Tiled
        const endZoneObj = this.map.findObject("Objects", obj => obj.name === "endZone");

        // Create a transparent zone for overlap detection
        this.endZone = this.add.zone(endZoneObj.x, endZoneObj.y, endZoneObj.width, endZoneObj.height);
        this.physics.world.enable(this.endZone, Phaser.Physics.Arcade.STATIC_BODY);


        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(16, 200, "knight", 0);
        my.sprite.player.body.setSize(15, 20); 
        my.sprite.player.body.setOffset(8, 8); 
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer, (player, tile) => {
            if (tile.properties.kills) {
                this.handlePlayerDeath(() => {
                    // Respawn after death animation and delay
                    player.setPosition(this.spawnX, this.spawnY);
                    player.body.enable = true;
                    this.dead = false;
                    player.setVelocity(0);
                    player.setAcceleration(0);
                    player.anims.play('idle');
                });
            }
        }, null, this);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        my.vfx.running = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.running.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

    }

    update() {
        if (this.AKey.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.setFlipX(true);
            my.sprite.player.anims.play('run', true);

            // Clamp velocity so player can't go faster than max speed
            if (my.sprite.player.body.velocity.x < -this.MAX_SPEED) {
                my.sprite.player.setVelocityX(-this.MAX_SPEED);
            }

            // Running particles etc...
            if (my.sprite.player.body.blocked.down) {
                my.vfx.running.start();
                my.vfx.running.startFollow(my.sprite.player, my.sprite.player.displayWidth/2 - 10, my.sprite.player.displayHeight/2 - 5, false);
                my.vfx.running.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            }

            if (!this.sfx.walk.isPlaying && my.sprite.player.body.blocked.down) {
                this.sfx.walk.play();
            }

        } else if (this.DKey.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlipX(false);
            my.sprite.player.anims.play('run', true);

            if (my.sprite.player.body.velocity.x > this.MAX_SPEED) {
                my.sprite.player.setVelocityX(this.MAX_SPEED);
            }

            if (my.sprite.player.body.blocked.down) {
                my.vfx.running.start();
                my.vfx.running.startFollow(my.sprite.player, my.sprite.player.displayWidth/2 - 10, my.sprite.player.displayHeight/2 - 5, false);
                my.vfx.running.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            }

            if (!this.sfx.walk.isPlaying && my.sprite.player.body.blocked.down) {
                this.sfx.walk.play();
            }

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.running.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if (!this.AKey.isDown && !this.DKey.isDown || !my.sprite.player.body.blocked.down) {
            if (this.sfx.walk.isPlaying) {
                this.sfx.walk.stop();
            }
        }

        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.SPACE)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        this.physics.overlap(my.sprite.player, this.endZone, () => {
            if (Phaser.Input.Keyboard.JustDown(this.WKey)) {
                this.levelClearedText.setVisible(true); // Show the message

                // Optional: transition after a short delay
                this.time.delayedCall(1500, () => {
                    this.scene.start("VictoryOverlay");
                });
            }
        });
    }

    handlePlayerDeath(onRespawnCallback) {
        if (this.dead) return;
        this.dead = true;

        const player = my.sprite.player;

        player.setVelocity(0);
        player.setAcceleration(0);
        player.body.enable = false;

        // Play death sound
        this.sfx.death.play();

        player.anims.play('death');

        this.time.delayedCall(1000, () => {
            if (onRespawnCallback) {
                onRespawnCallback();
            } else {
                this.scene.restart();
            }
        });
    }

}
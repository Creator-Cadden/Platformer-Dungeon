class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.spritesheet("knight", "knight.png", {
            frameWidth: 32,
            frameHeight: 32
        });
         this.load.spritesheet("coins", "Coin.png", {
            frameWidth: 10,
            frameHeight: 10
        });

        // Load tilemap information
        this.load.image("tilemap_tiles", "Platformer Asset All H.png");                         // Packed tilemap
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   // Tilemap in JSON

        // Load the tilemap as a spritesheet
        this.load.spritesheet("tilemap_sheet", "Platformer Asset All H.png", {
            frameWidth: 16,
            frameHeight: 16
        });

        // Loa Audio
        this.load.audio('deathImpact', 'death_impact.mp3');
        this.load.audio('walkConcrete', 'walk_concrete.mp3');
        // Oooh, fancy. A multi atlas is a texture atlas which has the textures spread
        // across multiple png files, so as to keep their size small for use with
        // lower resource devices (like mobile phones).
        // kenny-particles.json internally has a list of the png files
        // The multiatlas was created using TexturePacker and the Kenny
        // Particle Pack asset pack.
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('knight', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('knight', { start: 16, end: 23 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('knight', { start: 41, end: 48 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'death',
            frames: this.anims.generateFrameNumbers('knight', { start: 56, end: 59 }),
            frameRate: 10,
            repeat: 0
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}
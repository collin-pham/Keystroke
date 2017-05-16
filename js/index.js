
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

// Load the assets
function preload() {
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.image('background', 'assets/background.png');
    game.load.image('mushroom', 'assets/mushroom.png');
}
// define initial parameters
var player;
var obstacle;
var facing = 'idle';
var jumpTimer = 0;
var runTimer = 0;
var cursors;
var jumpButton;
var bg;

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, 1000, 600);
    // Define background
    bg = game.add.tileSprite(0, 0, 800, 600, 'background');

    // define the y gravity
    game.physics.arcade.gravity.y = 300;

    // Define player
    player = game.add.sprite(150, 320, 'dude');
    player.frame = 5;
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.collideWorldBounds = true;
    player.body.gravity.y = 1000;
    player.body.maxVelocity.y = 500;
    player.body.setSize(20, 32, 5, 16);
    player.body.immovable = true;

    // Define obstacle
    

    obstacle = game.add.sprite(900, 600, 'mushroom');
    obstacle.name = 'mushroom';
    
    game.physics.enable(obstacle, Phaser.Physics.ARCADE);
    
    obstacle.body.velocity.x = -100
    obstacle.body.collideWorldBounds = true;


    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

}

function update() {
    player.body.velocity.x = 0;
    game.physics.arcade.collide(player, obstacle, collisionHandler, null, this);

    if (jumpButton.isDown && player.body.onFloor() && game.time.now > jumpTimer)
    {
        player.frame = 6
        player.body.velocity.y = -500;
        jumpTimer = game.time.now + 750;
    }
    if (player.body.onFloor() && game.time.now > runTimer) 
    {
        runTimer = game.time.now + 250
        player.frame = (player.frame % 4 + 5)
    }
    if (obstacle.x == 0) {
        console.log('destroy')
    }

}
function collisionHandler (obj1, obj2) {

    game.stage.backgroundColor = '#992d2d';
    console.log('BOOM')

}

function renderObstacle (id) {

}

function render () {

    // game.debug.text(game.time.physicsElapsed, 32, 32);
    // game.debug.body(player);
    game.debug.bodyInfo(player, 16, 24);

}

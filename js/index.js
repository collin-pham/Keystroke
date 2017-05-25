
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'Keystroke', { preload: preload, create: create, update: update, render: render });

// Load the assets
function preload() {
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.image('background', 'assets/background.png');
    game.load.image('mushroom', 'assets/mushroom.png');
}
// define initial parameters
var player;
var facing = 'idle';
var jumpTimer = 0;
var runTimer = 0;
var cursors;
var space;
var bg;
var obstacles = [];
var curId = -1;

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
    player.body.maxVelocity.y = 1000;
    player.body.setSize(20, 32, 5, 16);

    // Define obstacle
    renderObstacle();

    cursors = game.input.keyboard.createCursorKeys();
    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function update() {
    player.body.velocity.x = 0;
    game.physics.arcade.collide(player, obstacles[curId].obstacle, collisionHandler, null, this);

    if (buttonHandler().search("space") > -1 && player.body.onFloor() && game.time.now > jumpTimer)
    {
        playerJump();
    }
    if (player.body.onFloor() && game.time.now > runTimer) 
    {
        playerShift();
    }
    if (obstacles[curId].obstacle.x < 25) {
        removeObstacle(curId);
        renderObstacle();
    }
}

function buttonHandler() {
    var buttonCombo = "";
    if (space.isDown)
        buttonCombo += "space";
    return buttonCombo;
}

function removeObstacle(id) {
    obstacles[id].obstacle.pendingDestroy = true;
}

function playerJump() {
    player.frame = 6
    player.body.velocity.y = -750;
    jumpTimer = game.time.now + 750;
}

function playerShift() {
    runTimer = game.time.now + 250;
    player.frame = player.frame % 4 + 5
}

function collisionHandler (obj1, obj2) {
    game.stage.backgroundColor = '#992d2d';
    console.log('BOOM')
    player.pendingDestroy = true;
}

function renderObstacle() {
    curId++;
	obstacles.push(new obstacle(curId));
}

class obstacle {
	constructor(id) {
		this.id = id;
		this.obstacle = game.add.sprite(900, 600, 'mushroom');
    	this.obstacle.name = 'mushroom';
   
    	game.physics.enable(this.obstacle, Phaser.Physics.ARCADE);
    
    	this.obstacle.body.velocity.x = -Math.random()*100 - 100
    	this.obstacle.body.collideWorldBounds = true;
        this.obstacle.immovable = true;
	}
}

function render () {

    // game.debug.text(game.time.physicsElapsed, 32, 32);
    // game.debug.body(player);
    game.debug.bodyInfo(player, 16, 24);
}

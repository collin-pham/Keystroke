
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'Keystroke', { preload: preload, create: create, update: update, render: render });

// Load the assets
function preload() {
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.image('background', 'assets/background.png');
    game.load.spritesheet('mushroom', 'assets/mushroom.png');
    game.load.spritesheet('fireball', 'assets/fireball.png', 48, 48);
}
// define initial parameters
var player;
var facing = 'idle';
var jumpTimer = 0;
var runTimer = 0;
var cursors;

var space;
var leftKey;
var rightKey;

var bg;                         // background variable

var pressString = "JUMP";


var obstacles = [];
var currentObstacles = []

var curId = -1;

//string of all keys pressed, dont touch or rename collin!!
var keystring = "";

function create() {
    // Define the world
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, 1000, 600);
    game.physics.arcade.gravity.y = 300;

    // Define background
    bg = game.add.tileSprite(0, 0, 800, 600, 'background');

    // Define player
    player = game.add.sprite(150, 320, 'dude');
    player.frame = 5;

    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.collideWorldBounds = true;
    player.body.gravity.y = 1000;
    player.body.maxVelocity.y = 1000;
    player.body.setSize(20, 32, 5, 16);

    // Define obstacle
    initObstacles()
    renderObstacle();

    cursors = game.input.keyboard.createCursorKeys();

    space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    game.input.keyboard.onDownCallback =  function(e) {key(e.keyCode)};
}

function update() {
    bg.tilePosition.x -= .5;

    player.body.velocity.x = 0;
    game.physics.arcade.collide(player, currentObstacles[curId].obstacle, collisionHandler, null, this);

    if (checkstring(pressString) && player.body.onFloor() && game.time.now > jumpTimer)
    {
        playerJump();
        jump = false;
    }
    if (player.body.onFloor() && game.time.now > runTimer) 
    {
        playerShift();
    }
    if (currentObstacles[curId].obstacle.x < 25) {
        removeObstacle(curId);
        renderObstacle();
        pressString = randomStr(4);
    }

    if (leftKey.isDown)
    {
        player.body.velocity.x = -200;
    }

    if (rightKey.isDown)
    {
        player.body.velocity.x = 200;
    }


}
//add all keys pressed to string
function key(keycode) {
    if (keycode > 64 && keycode < 91)
        keystring += String.fromCharCode(keycode);
}

//check for jump
function checkjump() {
    if (keystring.length >= 4) {
        var last4 = keystring.substr(keystring.length - 4);
        if (last4.includes("J") && last4.includes("U") && last4.includes("M") && last4.includes("P")) {
            keystring = keystring.slice(0,keystring.length - 4);
            return true;
        }
    }  
    return false;
}

function checkstring(str) {
    var contains = false;
    if (keystring.length >= str.length) {
        var all = true;
        var end = keystring.substr(keystring.length - str.length);
        for (var i = 0; i < str.length; i++) {
            if (!end.includes(str[i]))
                all = false;
        }
        keystring = keystring.slice(0,keystring.length - str.length);
        return all;
    }
    return contains;
}

function buttonHandler() {
    var buttonCombo = "";
    if (space.isDown)
        buttonCombo += "space";
    return buttonCombo;
}

function removeObstacle(id) {
    currentObstacles[id].obstacle.pendingDestroy = true;
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
    currentObstacles[curId].obstacle.pendingDestroy = true;
    renderObstacle();
}

/*****************************************************************
Obstacle Code

******************************************************************/

function initObstacles() {
    const mushroom = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 50,
        maxVelocity: 1000,
        name: 'mushroom',
        width: 50,
        onGround: true
    }
    const fireball = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 100,
        maxVelocity: 1000,
        name: 'fireball',
        width: 100,
        onGround: true
    }

    obstacles = [
        mushroom, 
        fireball
    ]
    
}

// render new obstacle objects based on random Id.
function renderObstacle() {
    curId++;
	currentObstacles.push(new obstacle(curId % 2));
}

function randomStr(siz) {
    str = "";
    for (var i = 0; i < siz; i++)
        str += String.fromCharCode(Math.floor(Math.random() * 26) + 65)
    console.log(str);
    return str;
}

class obstacle {
	constructor(id) {
        var obstacle = obstacles[id];
		this.id = id;

		this.obstacle = game.add.sprite(900, 600, obstacles[id].name);
        this.obstacle.frame = obstacle.frame;
        this.obstacle.width = obstacle.width;
        this.obstacle.height = obstacle.height;
    	this.obstacle.name = obstacle.name;
   
    	game.physics.enable(this.obstacle, Phaser.Physics.ARCADE);
        
    	this.obstacle.body.velocity.x = -1.5 * obstacle.baseVelocity
    	this.obstacle.body.collideWorldBounds = true;
        this.obstacle.immovable = true;
	}
}

/*****************************************************************
Difficulty Code

******************************************************************/

function changeObstacleVelocity(obstacle) {

}

function changeBackgroundVelocity() {

}

function changePlatformVelocity() {

}

function changeJumpString() {

}



function render () {
    // game.debug.text(game.time.physicsElapsed, 32, 32);
    // game.debug.body(player);
    game.debug.bodyInfo(player, 16, 24);
}

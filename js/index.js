
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
var BASE_TIME = 1000000000;

//for movement aside from keyboard input
var leftKey;
var rightKey;

var bg;                         // background variable

//stores the command that corresponds to jump at any given time
var pressString = "JUMP";

var obstacles = [];
var currentObstacles = []

var curId = -1;

//string of all keys pressed, dont touch or rename collin!!
var keystring = "";

/////////////////////////// RIGHT NOW THE PLAYER CAN GO FURTHER RIGHT THAN WHERE OBSTACLES SPAWN. FIX AT SOME POINT BY LIMITING PLAYER /////////

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

    // cursors = game.input.keyboard.createCursorKeys();

    //initialize arrow keys
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    //create handler for rest of keyboard
    game.input.keyboard.onDownCallback =  function(e) {key(e.keyCode);};
}

function update() {
    var shift = 1;

    //so player doesn't slide around
    player.body.velocity.x = 0;

    //physics handler for collisions
    game.physics.arcade.collide(player, currentObstacles[curId].obstacle, collisionHandler, null, this);

    //is the player trying to jump?
    if (checkstring(pressString) && player.body.onFloor() && game.time.now > jumpTimer) {
        playerJump();
        jump = false;
    }

    //walking animation
    if (player.body.onFloor() && game.time.now > runTimer) {
        playerShift();
    }

    //obstacle hitting wall?
    if (currentObstacles[curId].obstacle.x < 10) {
        removeObstacle(curId);
        renderObstacle();
        pressString = randomStr(caculateJumpStringLength());
    }

    //arrow key handlers
    if (leftKey.isDown) {
        player.body.velocity.x = -200;
        shift -= .3;
    }
    if (rightKey.isDown) {
        player.body.velocity.x = 200;
        shift += .3;
    }
    //makes world look like its moving
    bg.tilePosition.x -= changeBackgroundVelocity(shift);
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

//check for any given input string
function checkstring(str) {
    if (keystring.length >= str.length) {
        var end = keystring.substr(keystring.length - str.length);
        for (var i = 0; i < str.length; i++) {
            if (!end.includes(str[i]))
                return false;
        }
        keystring = "";//keystring.slice(0,keystring.length - str.length);
        return true;
    }
    return false;
}

//create a random string of length siz
function randomStr(siz = 4) {
    str = "";
    var char;
    while (str.length < siz) {
        char = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        if (!str.includes(char))
            str += char;
    }
    // console.log(str);
    return str;
}

//mark an obstacle for destroy
function removeObstacle(id) {
    currentObstacles[id].obstacle.pendingDestroy = true;
}

//make the player jump
function playerJump() {
    player.frame = 6
    player.body.velocity.y = -750;
    jumpTimer = game.time.now + 750;
}

//adjust the frame of the sprite
function playerShift() {
    runTimer = game.time.now + 250;
    player.frame = player.frame % 4 + 5
}

function collisionHandler (obj1, obj2) {
    game.stage.backgroundColor = '#992d2d';
    console.log('BOOM')

    //for now we destroy the obstacle and send another
    removeObstacle(curId);
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
	currentObstacles.push(new obstacle(curId));
}

// abstract class to hold different types of obstacles
class obstacle {
	constructor(id) {
        var index = Math.floor(Math.random()*2)
        var obstacle = obstacles[index];
		this.id = id;

		this.obstacle = game.add.sprite(900, 600, obstacles[index].name);
        this.obstacle.frame = obstacle.frame;
        this.obstacle.width = obstacle.width;
        this.obstacle.height = obstacle.height;
    	this.obstacle.name = obstacle.name;
   
    	game.physics.enable(this.obstacle, Phaser.Physics.ARCADE);
        
    	this.obstacle.body.velocity.x = -.5 * changeObstacleVelocity(obstacle);
    	this.obstacle.body.collideWorldBounds = true;
        this.obstacle.immovable = true;
	}
}

/*****************************************************************
Difficulty Code

******************************************************************/

function changeObstacleVelocity(obstacle) {
    return calculateRatio()*(obstacle.maxVelocity-obstacle.baseVelocity)+obstacle.baseVelocity;
}

function changeBackgroundVelocity(num) {
    return calculateRatio()*num;
}

function changePlatformVelocity() {

}

function caculateJumpStringLength() {
    return Math.floor(calculateRatio()*6);
}

function calculateRatio() {
    return Math.log(game.time.now)/Math.log(BASE_TIME)
}


function render () {
    // var ti = "Time: "+game.time.physicsElapsed.toString();
    var ob = "Obstacles Cleared: "+parseInt(curId, 10).toString();
    var typ = "Type "+pressString+" To Jump!"
    // console.log(time);
    // console.log(obstacle);
    // game.debug.text(ti, 32, 64);
    game.debug.text(ob, 32, 32);
    game.debug.text(typ, 32, 64);
    // game.debug.body(player);
    // game.debug.bodyInfo(player, 16, 24);
}

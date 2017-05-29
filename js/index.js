
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'Keystroke', { preload: preload, create: create, update: update, render: render });

// Load the assets
function preload() {
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.image('background', 'assets/background.png');

    game.load.spritesheet('button', 'assets/pause.png', 321, 311);

    game.load.spritesheet('mushroom', 'assets/mushroom.png');

    game.load.spritesheet('platform', 'assets/LargePlatform.png', 130, 50);

    game.load.spritesheet('fireball', 'assets/fireball.png', 52, 42);
    game.load.spritesheet('crab', 'assets/crab.png', 131, 129);

}
// define initial parameters
var player;
var facing = 'idle';
var jumpTimer = 0;
var runTimer = 0;
var frameTimer = 0;
var cursors;
var BASE_TIME = 2.2;
var timeDivisor = 100000;

//for movement aside from keyboard input
var leftKey;
var rightKey;

var bg;                         // background variable

//stores the command that corresponds to jump at any given time
var pressString = "JUMP";

var obstacles = [];
var currentObstacles = [];
var curId = -1;

var currentPlatforms = [];
var platformId = -1;

//string of all keys pressed, dont touch or rename collin!!
var keystring = "";

var platforms;

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

    renderPlatform();

    // define pause button
    menu_button = game.add.button(750, 10, 'button', handleMenu, this, 2, 1, 0);
    menu_button.scale.setTo(.1, .1);

    //platforms
    


    // cursors = game.input.keyboard.createCursorKeys();

    //initialize arrow keys
    spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
    rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);

    //create handler for rest of keyboard
    game.input.keyboard.onDownCallback =  function(e) {key(e.keyCode);};

    // Pass true to show the starting menu
    handleMenu(true);
}

function update() {
    var shift = 3;

    //so player doesn't slide around
    player.body.velocity.x = 0;

    //physics handler for collisions
    game.physics.arcade.collide(player, currentObstacles[curId].obstacle, collisionHandler, null, this);

    // pause with keyboard
    if (spaceKey.isDown)
        handleMenu()

    //is the player trying to jump?
    if (checkstring(pressString) && player.body.onFloor() && game.time.now > jumpTimer) {
        playerJump();
        jump = false;
    }

    //walking animation
    if (player.body.onFloor() && game.time.now > runTimer) {
        playerShift();
    }
    if (game.time.now > frameTimer) {
        animate();
    }

    //obstacle hitting wall?
    if (currentObstacles[curId].obstacle.x < 10) {
        removeObstacle(curId);
        renderObstacle();
        pressString = randomStr(caculateJumpStringLength());
    }

    //platform hitting wall?
    if (currentPlatforms[platformId].x > 800) {
        removePlatform(platformId);
        renderPlatform();
    }

    //arrow key handlers
    if (leftKey.isDown) {
        player.body.velocity.x = -200;
        shift *= .6;
    }
    if (rightKey.isDown) {
        player.body.velocity.x = 200;
        shift *= 1.4;
    }
    //makes world look like its moving
    bg.tilePosition.x -= changeBackgroundVelocity(shift);


    game.physics.arcade.collide(player, platforms);

}
//add all keys pressed to string
function key(keycode) {
    if (keycode > 64 && keycode < 91 && !game.paused)
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
    return str;
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

//checks the obstacle to see if it should increment the frame and by how much
function animate() {
    if (currentObstacles[curId].shift) {
        frameTimer = game.time.now + currentObstacles[curId].shiftFreq;
        currentObstacles[curId].obstacle.frame = currentObstacles[curId].obstacle.frame + 1;
    }
    else
        frameTimer += 1000;
}

function collisionHandler (obj1, obj2) {
    game.stage.backgroundColor = 'red';
    console.log('BOOM')

    //for now we destroy the obstacle and send another
    removeObstacle(curId);
    renderObstacle();
    // curId = 0;
    // player.x = 150
    // player.y = 320
    
}
/*****************************************************************
Platform Code

******************************************************************/
function renderPlatform() {
    platforms = game.add.group();
    platforms.physicsBodyType = Phaser.Physics.ARCADE;
    var amount = Math.random() * 300;
    var p = platforms.create(10, 300+amount, 'platform');
    game.physics.enable(p, Phaser.Physics.ARCADE);
    p.body.allowGravity = false;
    p.body.immovable = true;
    p.body.velocity.x = 50;
    p.body.velocity.y = 0;
    currentPlatforms.push(p);
    platformId++;
}
//mark an obstacle for destroy
function removePlatform(id) {
    currentPlatforms[id].pendingDestroy = true;
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
        onGround: true,
        shiftFreq: 50,
        shift: false
    }
    const fireball = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 100,
        maxVelocity: 1000,
        name: 'fireball',
        width: 100,
        onGround: true,
        shiftFreq: 50,
        shift: false
    }
    const crab = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 80,
        maxVelocity: 1000,
        name: 'crab',
        width: 80,
        onGround: true,
        shiftFreq: 50,
        shift: true
    }

    obstacles = [
        mushroom, 
        fireball,
        crab
    ]
    
}

//mark an obstacle for destroy
function removeObstacle(id) {
    currentObstacles[id].obstacle.pendingDestroy = true;
}

// render new obstacle objects based on random Id.
function renderObstacle() {
    curId++;
	currentObstacles.push(new obstacle(curId));
}

// abstract class to hold different types of obstacles
class obstacle {
	constructor(id) {
        var obstacle = obstacles[Math.floor(Math.random()*3)];
		this.id = id;

		this.obstacle = game.add.sprite(900, 600, obstacle.name);
        this.obstacle.frame = obstacle.frame;
        this.obstacle.width = obstacle.width;
        this.obstacle.height = obstacle.height;
    	this.obstacle.name = obstacle.name;
        this.shiftFreq = obstacle.shiftFreq;
        this.shift = obstacle.shift;
   
    	game.physics.enable(this.obstacle, Phaser.Physics.ARCADE);
        
    	this.obstacle.body.velocity.x = -.66 * changeObstacleVelocity(obstacle);
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
    return Math.floor(calculateRatio()*10);
}

function calculateRatio() {
    var ratio = Math.exp(game.time.now/timeDivisor)/Math.exp(BASE_TIME);
    return ratio;
}

/*****************************************************************
Menu Code

******************************************************************/

function handleMenu(onStart) {
    onStart = typeof onStart == 'boolean' ? true : false;
    // pause the game
    game.paused = !game.paused;
    menu_button.visible = false;

    var style = {
        font: "20px Arial", 
        fill: "#fff",
        align:"left",
        boundsAlignH: "top",
        boundsAlignV:"top",
        cursor: "pointer"
    };
    var text = `Welcome to Keystroke! \nAvoid the obstacles to survive. \nJump by button mashing the correct keys. \nGood luck!`
        
    start_button = game.add.text(350, 200, onStart ? 'start' : 'restart', style);
    resume_button = game.add.text(350, 250, 'resume', style);
    instruction_button = game.add.text(350, 300, 'instructions', style);
    back_button = game.add.text(350, 350, 'back', style);
    instruction_text = game.add.text(350, 200, text, style);

    start_button.inputEnabled = true;
    resume_button.inputEnabled = true;
    instruction_button.inputEnabled = true;
    back_button.inputEnabled = true;

    back_button.visible = false;
    instruction_text.visible = false;

    start_button.events.onInputDown.add(start, this);
    resume_button.events.onInputDown.add(resume, this);
    instruction_button.events.onInputDown.add(instruction, this);
    back_button.events.onInputDown.add(toggleButtons, this);

    function start () {
        unpause();
        menu_button.visible = true;
    }

    function resume() {
        unpause();
        menu_button.visible = true;
    }

    function instruction () { 
        toggleButtons();
    }

    function unpause() {
        game.paused = !game.paused;
        start_button.destroy();
        resume_button.destroy();
        instruction_button.destroy();
    }
    function toggleButtons() {
        start_button.visible = !start_button.visible;
        resume_button.visible = !resume_button.visible;
        instruction_button.visible = !instruction_button.visible;
        back_button.visible = !back_button.visible;
        instruction_text.visible = !instruction_text.visible;
    }


}

/*****************************************************************
Restart Game

******************************************************************/

function render () {
    var ob = "Obstacles Cleared: "+parseInt(curId, 10).toString();
    var typ = "Type "+pressString+" To Jump!"
    game.debug.text(ob, 32, 32);
    game.debug.text(typ, 32, 64);
}

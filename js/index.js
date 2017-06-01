
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'Keystroke', { preload: preload, create: create, update: update, render: render });

// Load the assets
function preload() {
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.image('background', 'assets/background.png');

    game.load.spritesheet('button', 'assets/pause.png', 321, 311);

    game.load.spritesheet('platform', 'assets/LargePlatform.png', 130, 50);

    game.load.spritesheet('fireball', 'assets/fireball.png', 52, 42);
    game.load.spritesheet('crab', 'assets/crab.png', 131, 129);
    game.load.spritesheet('raindrop', 'assets/raindrop.png', 290, 399);
    game.load.spritesheet('mushroom', 'assets/mushroom.png');

}
// define initial parameters
var player;
var facing = 'idle';
var jumpTimer = 0;
var runTimer = 0;
var frameTimer = 0;
var cursors;
var oldScore;

var score_text;
var type_text;
var oldScore_text;

var BASE_TIME = .6;
var timeDivisor = 1000000;

//for movement aside from keyboard input
var leftKey;
var rightKey;

var bg;                         // background variable

//stores the command that corresponds to jump at any given time
var pressString = "JUMP";

var obstacles = [];
var currentObstacles = [];
var curId = -1;
var successfulObs = 0;

var currentPlatforms = [];
var platformId = -1;
var pdelId = 0;
var platforms;
var platformWaitCounter = 0;
var platformTimer = -1;

var text = [];
var textId = -1;

var currtext = []
var grizstyle = { font: "32px Arial", fill: "white", boundsAlignH: "top",boundsAlignV:"top", align: "center", backgroundColor: "transparent" };
var danstyle = { font: "24px Arial", fill: "#ffffff", align: "left", boundsAlignH: "top", boundsAlignV:"top" };


//string of all keys pressed, dont touch or rename collin!!
var keystring = "";
var score = 0;

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
    score += .1;

    var shift = 3;

    //so player doesn't slide around
    player.body.velocity.x = 0;

    //physics handler for collisions
    game.physics.arcade.collide(player, currentObstacles[curId].obstacle, collisionHandler, null, this);

    // pause with keyboard
    if (spaceKey.isDown)
        handleMenu()

    // game.physics.arcade.collide(player, platforms);
    for (var i = pdelId; i <= platformId; i++)
        game.physics.arcade.collide(player, currentPlatforms[i]);

    //is the player trying to jump?
    if (checkstring(pressString) && player.body.newVelocity.y > 0 && player.body.newVelocity.y < 0.362 && (game.time.now > jumpTimer)) {
        playerJump();
    }

    //walking animation
    if (player.body.newVelocity.x > 0 && game.time.now > runTimer) {
        walkForwards()
        
    }else if (player.body.newVelocity.x < 0 && game.time.now > runTimer) {
        walkBackwards()
        
    } else if (player.body.newVelocity.x == 0 && game.time.now > runTimer) {
        player.frame = 4;
    }
    if (game.time.now > frameTimer) {
        animate();
    }

    //obstacle hitting wall?
    if (currentObstacles[curId].obstacle.x < 10 ){
        successfulObs++;
        removeObstacle(curId);
        renderObstacle();
        pressString = randomStr(caculateJumpStringLength());
        removeText(textId);
        renderText(pressString);
        score += 200;
    } 
    if (currentObstacles[curId].obstacle.y == 549 ){  
        successfulObs++;
        removeObstacle(curId);
        renderObstacle();
        pressString = randomStr(caculateJumpStringLength());
        removeText(textId);
        renderText(pressString);
        score += 200;
    } 

    //platform hitting wall?
    var random = Math.random()

    if (currentPlatforms[pdelId].x > 800) {
        removePlatform(pdelId);
        pdelId++;
        platformWaitCounter++;
    }
    if (platformId + platformWaitCounter - pdelId + 1 < caculateJumpStringLength()) {
        platformWaitCounter++;
    }
    if (platformWaitCounter > 0 && game.time.now > platformTimer) {
        platformWaitCounter--;
        platformTimer = game.time.now + 1700;
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

    if (player.body.x >= 770) {
        player.body.x = 770;
    }

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
    player.frame = 6;
    player.body.velocity.y = -750;
    jumpTimer = game.time.now + 750;
}


function walkForwards() {
    runTimer = game.time.now + 250;
    if (player.body.velocity.y == 0)
        player.frame = player.frame % 4 + 5;
    else 
        player.frame = 6;
    
}
function walkBackwards() {
    runTimer = game.time.now + 250;
    if (player.body.velocity.y == 0)
        player.frame = (player.frame + 1) % 4;
    else 
        player.frame = 1;
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
    removeText(textId);
    game.time.reset();
    oldScore = score;
    score = 0;
    player.body.x = 150;
    player.body.y = 320;
    successfulObs = 0;

    for (var i = pdelId; i <= platformId; i++) {
        removePlatform(i);
    }

    platformTimer = -1;

    jumpTimer = 0;
    runTimer = 0;
    frameTimer = 0;
    pressString = "JUMP";

    handleMenu(true,true);
}
/*****************************************************************
Platform Code

******************************************************************/
function renderPlatform() {
    platforms = game.add.group();
    platforms.physicsBodyType = Phaser.Physics.ARCADE;
    var amount = Math.random() * 90;
    var p = platforms.create(10, 420+amount, 'platform');
    
    game.physics.enable(p, Phaser.Physics.ARCADE);
    p.body.allowGravity = false;
    p.body.immovable = true;
    p.body.velocity.x = changePlatformVelocity()*200 + 50;
    p.body.velocity.y = 0;

    // Disable collisions from down, left and right directions
    p.body.checkCollision.down = false;
    p.body.checkCollision.left = false;
    p.body.checkCollision.right = false;

    // add platforms
    currentPlatforms.push(p);
    platformId++;
}
//mark an platform for destroy
function removePlatform(id) {
    currentPlatforms[id].pendingDestroy = true;
}
/*****************************************************************
Text Code

******************************************************************/
function renderText(intext) {
    currtext = game.add.group();
    currtext.physicsBodyType = Phaser.Physics.ARCADE;
    var y = Math.floor(Math.random() * 100) + 125;
    var t = game.add.text(0,y,String(intext),grizstyle)
    game.physics.enable(t, Phaser.Physics.ARCADE);
    t.body.allowGravity = false;
    t.body.immovable = true;
    t.body.velocity.x = 50;
    t.body.velocity.y = 0;
    text.push(t);
    textId++;
}
function removeText(id) {
    if (id >= 0)
        text[id].pendingDestroy = true;
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
        shift: false,
        yVelocity: false
    }
    const fireball = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 100,
        maxVelocity: 1000,
        name: 'fireball',
        width: 100,
        onGround: false,
        shiftFreq: 50,
        shift: false,
        yVelocity: false
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
        shift: true,
        yVelocity: false
    }
    const raindrop = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 51,
        maxVelocity: 1000,
        name: 'raindrop',
        width: 51,
        onGround: false,
        shiftFreq: 50,
        shift: false,
        yVelocity: true
    }

    obstacles = [
        mushroom, 
        fireball,
        crab,
        raindrop
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
        var num = Math.floor(Math.random()*obstacles.length)
        var obstacle = obstacles[num];
        // var obstacle = obstacles[1];
		this.id = id;
        var height = 600;
        var allowGravity = true;
        if (!obstacle.onGround) {
            // var heightAdd = Math.random() * 200;
            // height = 300 + heightAdd;
            allowGravity = false;
            height = player.y;
        }
		
        
        if (obstacle.yVelocity) {
            this.obstacle = game.add.sprite(750*Math.random(), 0, obstacle.name);
            game.physics.enable(this.obstacle, Phaser.Physics.ARCADE);
            this.obstacle.body.velocity.y = .66 * changeObstacleVelocity(obstacle);
            this.obstacle.body.acceleration.y = 100;

        } else {
            this.obstacle = game.add.sprite(900, height, obstacle.name);
            game.physics.enable(this.obstacle, Phaser.Physics.ARCADE);
            this.obstacle.body.velocity.x = -.66 * changeObstacleVelocity(obstacle);
           
        }
        this.obstacle.frame = obstacle.frame;
        this.obstacle.width = obstacle.width;
        this.obstacle.height = obstacle.height;
    	this.obstacle.name = obstacle.name;
        this.shiftFreq = obstacle.shiftFreq;
        this.shift = obstacle.shift;
        this.yVelocity = obstacle.yVelocity



    	this.obstacle.body.collideWorldBounds = true;
        this.obstacle.body.allowGravity = allowGravity;
        this.obstacle.immovable = true;
	}
}

/*****************************************************************
Difficulty Code

******************************************************************/

function changeObstacleVelocity(obstacle) {
    // return calculateRatio()*(obstacle.maxVelocity-obstacle.baseVelocity)+obstacle.baseVelocity;    
    return calculateLinear()*(obstacle.maxVelocity-obstacle.baseVelocity)+obstacle.baseVelocity;

}

function changeBackgroundVelocity(num) {
    return calculateRatio()*num;
}

function changePlatformVelocity() {
    // return calculateRatio();    
    return calculateLinear();
}

function caculateJumpStringLength() {
    // return Math.floor(calculateRatio()*10);
    var length = 1;
    var val = calculateLinear();
    if (val > .1)
        length++;
    if (val > .25)
        length++;
    if (val > .5)
        length++;
    if (val > .85)
        length++;
    // return Math.floor(calculateLinear()*10) > 0 ? Math.floor(calculateLinear()*10) : 1;
    return length;

}

function calculateRatio() {
    var ratio = Math.exp(game.time.now/timeDivisor)/Math.exp(BASE_TIME);
    return ratio;
}

function calculateLinear() {
    var ratio = game.time.now/(timeDivisor*BASE_TIME);
    return ratio;
}

/*****************************************************************
Menu Code

******************************************************************/

function handleMenu(onStart,restart) {
    onStart = typeof onStart == 'boolean' ? true : false;
    restart = typeof restart == 'boolean' ? true : false;
    var pauseTime = game.time.now;
    // pause the game
    game.paused = !game.paused;
    menu_button.visible = false;

    var style = {
        font: "24px Arial",
        fill: "#ffffff",
        align: "left",
        boundsAlignH: "top",
        boundsAlignV:"top",
        cursor: "pointer"
    };
    var text = `Welcome to Keystroke! \nAvoid the obstacles to survive. \nJump by button mashing the correct keys. \nGood luck!`
        
    // Location of text
    var xCord = 350;
    var yCord = 200;
    var yIncrement = 50;

    // Add start button and instruction text
    if (restart) {
        var sc = "Score: "+parseInt(oldScore).toString();
        oldScore_text = game.add.text(xCord, yCord - 50, sc, danstyle);
    }
    start_button = game.add.text(xCord, yCord, restart ? 'restart' : 'start', style);
    instruction_text = game.add.text(xCord - 150, yCord, text, style);

    // Add resume button if not start screan    
    if (!onStart && curId > 0) {
        resume_button = game.add.text(xCord, yCord += yIncrement, 'resume', style);
        resume_button.inputEnabled = true;
        resume_button.events.onInputDown.add(resume, this);
    }

    // add instruction and back button
    instruction_button = game.add.text(xCord, yCord +=yIncrement, 'instructions', style);
    back_button = game.add.text(xCord - 150, onStart ? yCord += (50 + yIncrement) : yCord += yIncrement, 'back', style);


    start_button.inputEnabled = true;
    instruction_button.inputEnabled = true;
    back_button.inputEnabled = true;

    back_button.visible = false;
    instruction_text.visible = false;

    start_button.events.onInputDown.add(start, this);
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
        instruction_button.destroy();

        if (restart) {
            oldScore_text.destroy();
            renderPlatform();
            renderObstacle();
            pdelId++;
        }

        !onStart ? resume_button.destroy() : null;
    }
    function toggleButtons() {
        start_button.visible = !start_button.visible;
        instruction_button.visible = !instruction_button.visible;
        back_button.visible = !back_button.visible;
        instruction_text.visible = !instruction_text.visible;

        !onStart ? resume_button.visible = !resume_button.visible : null;
    }


}

/*****************************************************************
Restart Game

******************************************************************/

function render () {
    var sc = "Score: "+parseInt(score).toString();
    // var ob = "Obstacles Cleared: "+parseInt(successfulObs, 10).toString();
    var typ = "Type "+pressString+"!"
    if (score_text != null) {
        score_text.destroy();
        type_text.destroy();
    }
    score_text = game.add.text(32, 32, sc, danstyle);
    // obstacle_text = game.add.text(32, 64, ob, danstyle);
    type_text = game.add.text(32, 64, typ, danstyle);
}

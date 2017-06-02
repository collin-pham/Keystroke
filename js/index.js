
var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'Keystroke', { preload: preload, create: create, update: update, render: render });

// Load the assets
function preload() {
    game.load.spritesheet('dude', 'assets/spacedude.png', 48, 48);
    game.load.image('background', 'assets/background.png');

    game.load.spritesheet('button', 'assets/pause.png', 321, 311);

    game.load.spritesheet('platform', 'assets/platform.png', 125, 50);

    game.load.spritesheet('fireball', 'assets/fireball2.png', 54, 19);
    game.load.spritesheet('crab', 'assets/crab.png', 131, 129);
    game.load.spritesheet('asteroid', 'assets/asteroid.png', 300, 369);
    game.load.spritesheet('mushroom', 'assets/mushroom2.png');
    game.load.audio('jump',['assets/jump.wav']);
    game.load.audio('collision',['assets/DCCollision.mp3']);
    game.load.audio('bgmusic',['assets/bgmusic.mp3']);
}
// define initial parameters
var jump;
var collision;
var bgmusic;

var player;
var facing = 'idle';
var jumpTimer = 0;
var runTimer = 0;
var spinTimer = 0;

var frameTimer = 0;
var cursors;
var oldScore;
var high_score = 0;

var score_text;
var type_text;
var oldScore_text;
var hs_text;

var keyDistances = {};
var keyBoard = {
    A : ["Q","W","S","Z"],
    B : ["V","G","H","N"],
    C : ["X","D","F","V"],
    D : ["S","E","R","F","C","X"],
    E : ["W","S","D","R"],
    F : ["R","T","G","V","C","D"],
    G : ["H","Y","T","F","V","B"],
    H : ["G","Y","U","J","N","B"],
    I : ["U","J","K","O"],
    J : ["H","U","I","K","M","N"],
    K : ["J","I","O","L","M"],
    L : ["K","O","P"],
    M : ["N","J","K"],
    N : ["B","H","J","M"],
    O : ["I","K","L","P"],
    P : ["O","L"],
    Q : ["A","W"],
    R : ["E","D","F","T"],
    S : ["A","W","E","D","X","Z"],
    T : ["R","F","G","Y"],
    U : ["Y","H","J","I"],
    V : ["C","F","G","B"],
    W : ["Q","A","S","E"],
    X : ["Z","S","D","C"],
    Y : ["T","G","H","U"],
    Z : ["A","S","X"]
};

var BASE_TIME = 240;

//for movement aside from keyboard input
var leftKey;
var rightKey;

var bg;                         // background variable

//stores the command that corresponds to jump at any given time
var pressString = "J";

var obstacles = [];
var currentObstacles = [];
var successfulObs = 0;

var currentPlatforms = [];
var platforms;
var platformWaitCounter = 0;
var platformTimer = -1;

var text = [];

var currtext = [];
var grizstyle = { font: "32px Arial", fill: "white", boundsAlignH: "top",boundsAlignV:"top", align: "center", backgroundColor: "transparent" };
var danstyle = { font: "24px Arial", fill: "#ffffff", align: "left", boundsAlignH: "top", boundsAlignV:"top" };
var jumpstyle = { font: "24px Arial", fill: "#1c59f7", align: "left", boundsAlignH: "top", boundsAlignV:"top" };


//string of all keys pressed, dont touch or rename collin!!
var keystring = "";
var score = 0;

/////////////////////////// RIGHT NOW THE PLAYER CAN GO FURTHER RIGHT THAN WHERE OBSTACLES SPAWN. FIX AT SOME POINT BY LIMITING PLAYER /////////

function create() {
    // Define the world
    initKeyDistances();
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, 1000, 600);
    game.physics.arcade.gravity.y = 300;

    // Define background
    bg = game.add.tileSprite(0, 0, 800, 600, 'background');

    // Define player
    setPlayer();

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

    jump = game.add.audio("jump");
    collision = game.add.audio("collision");
    bgmusic = game.add.audio("bgmusic");
    renderText("J");
    bgmusic.play();

    // game.sound.setDecodedCallback([collision], collisionHandler, this);
}

function update() {
    score += calculateRatio();

    var shift = 3;

    //so player doesn't slide around
    player.body.velocity.x = 0;

    //physics handler for collisions
    currentObstacles.length > 0 ? game.physics.arcade.collide(player, currentObstacles[0].obstacle, collisionHandler, null, this) : null;

    for (var i = 0; i < currentPlatforms.length; i++)
        game.physics.arcade.collide(player, currentPlatforms[i]);

    // pause with keyboard
    if (spaceKey.isDown)
        handleMenu()


    //is the player trying to jump?
    if (checkstring(pressString) && player.body.newVelocity.y > 0 && player.body.newVelocity.y < 0.362 && (game.time.totalElapsedSeconds() > jumpTimer)) {
        playerJump();
    }

    //walking animation
    if (player.body.newVelocity.x > 0 && game.time.totalElapsedSeconds() > runTimer) {
        walkForwards()
        
    }else if (player.body.newVelocity.x < 0 && game.time.totalElapsedSeconds() > runTimer) {
        walkBackwards()
        
    } else if (player.body.newVelocity.x == 0 && game.time.totalElapsedSeconds() > runTimer && jumpTimer < game.time.totalElapsedSeconds()) {
        player.frame = 1;
    }
    if (player.body.newVelocity.x == 0 && jumpTimer > game.time.totalElapsedSeconds() && spinTimer < game.time.totalElapsedSeconds()){
        spin();
        spinTimer = game.time.totalElapsedSeconds() + .07;
    }


    if (currentObstacles.length > 0 && currentObstacles[0].shift && game.time.totalElapsedSeconds() > frameTimer) {
        animate();
    }

    //obstacle hitting wall?
    if (currentObstacles.length > 0 && currentObstacles[0].obstacle.x < 10 ) {
        successfulObs++;
        removeObstacle();
        renderObstacle();
        pressString = randomStr(calculateJumpStringLength());
        removeText();
        renderText(pressString);
        score += 200;
    } 
    if (currentObstacles.length > 0 && currentObstacles[0].obstacle.y == 549 ) {  
        successfulObs++;
        removeObstacle();
        renderObstacle();
        pressString = randomStr(calculateJumpStringLength());
        removeText();
        renderText(pressString);
        score += 200;
    } 

    //platform hitting wall? 
    if (currentPlatforms.length > 0 && currentPlatforms[0].x > 800) {
        removePlatform();
        platformWaitCounter++;
    }
    if (currentPlatforms.length + platformWaitCounter < calculateJumpStringLength()) {
        platformWaitCounter++;
    }
    if (platformWaitCounter > 0 && game.time.totalElapsedSeconds() > platformTimer) {
        platformWaitCounter--;
        platformTimer = game.time.totalElapsedSeconds() + 1.5;
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

    if (player.body.x >= 770)
        player.body.x = 770;
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
        if (!str.includes(char) && checkKeyDistance(str,char) < calculateJumpStringLength())
            str += char;
    }
    return str;
}

function checkKeyDistance(string, char) {
    distance = 0;
    for (var i = 0; i < string.length; i++) {
        var checkChar = string.charAt(i);
        var tempDistance = keyDistances[checkChar][char];
        if (tempDistance > distance)
            distance = tempDistance;
    }
    return distance;
}

function initKeyDistances() {
    for (var letter in keyBoard) {
        visited = [];
        letterQueue = [];
        keyDistances[letter] = {};
        keyDistances[letter][letter] = 0;
        distance = 1;
        for (var i = 0; i < keyBoard[letter].length; i++) {
            letterQueue.push(keyBoard[letter][i]);
        }
        visited.push(letter)
        while (letterQueue.length > 0) {
            var toadd = []
            while(letterQueue.length > 0) {
                var neighbor = letterQueue[0];
                keyDistances[letter][neighbor] = distance;
                visited.push(neighbor);
                toadd.push(neighbor);
                letterQueue.shift();
            }
            distance++;
            for (var j = 0; j < toadd.length; j++) {
                var char = toadd[j];
                for (var i = 0; i < keyBoard[char].length; i++) {
                    var deeperchar = keyBoard[char][i];
                    if (!visited.includes(deeperchar))
                        letterQueue.push(deeperchar)
                }
            }
        }
    }
}
//make the player jump
function playerJump() {
    jump.play();
    player.body.velocity.y = -750;
    jumpTimer = game.time.totalElapsedSeconds() + 1;

}


function walkForwards() {
    runTimer = game.time.totalElapsedSeconds() + .15;
    player.frame = player.frame < 6 ? 6 : player.frame;

    if (player.body.velocity.y == 0)
        player.frame = ++player.frame > 8 ? 6 : player.frame; 
    else 
        player.frame = 8;
    
}
function walkBackwards() {
    runTimer = game.time.totalElapsedSeconds() + .15;
    player.frame = player.frame < 3 ? 3 : player.frame;
    if (player.body.velocity.y == 0)
        player.frame = ++player.frame > 5 ? 3 : player.frame;
    else 
        player.frame = 5;
}

function spin() {
    player.frame += 3;
    player.frame = player.frame > 10 ? 1 : player.frame;
}

//checks the obstacle to see if it should increment the frame and by how much
function animate() {
    frameTimer = game.time.totalElapsedSeconds() + currentObstacles[0].shiftFreq;
    currentObstacles[0].obstacle.frame = currentObstacles[0].obstacle.frame + 1;
}

function collisionHandler (obj1, obj2) {
    reset();
    handleMenu(true,true);
}

function reset() {
    removeObstacle();
    removeText();
    oldScore = score;
    if (score > high_score)
        high_score = score;
    score = 0;
    successfulObs = 0;
    player.destroy();
    setPlayer();

    while (currentPlatforms.length > 0)
        removePlatform();
    platformWaitCounter = 0;
    game.time.reset();
    jumpTimer = 0;
    runTimer = 0;
    frameTimer = 0;
    spinTimer = 0;
    pressString = "J";
    keystring = "";
}

/*****************************************************************
Player Code

******************************************************************/
function setPlayer() {
    player = game.add.sprite(150, 600, 'dude');
    player.frame = 1;

    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.collideWorldBounds = true;
    player.body.gravity.y = 1000;
    player.body.maxVelocity.y = 1000;
    player.body.setSize(20, 32, 5, 16);
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
}
//mark an platform for destroy
function removePlatform() {
    currentPlatforms[0].destroy();
    currentPlatforms.shift();
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
}
function removeText() {
    if (text.length > 0) {
        text[0].destroy();
        text.shift();
    }
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
        shiftFreq: 0,
        shift: false,
        yVelocity: false
    }
    const fireball = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 19,
        maxVelocity: 1000,
        name: 'fireball',
        width: 54,
        onGround: false,
        shiftFreq: 0,
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
        shiftFreq: .03,
        shift: true,
        yVelocity: false
    }
    const raindrop = {
        action: 'jump',
        baseVelocity: 100,
        frame: 0,
        height: 51,
        maxVelocity: 1000,
        name: 'asteroid',
        width: 51,
        onGround: false,
        shiftFreq: 0,
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
function removeObstacle() {
    if (currentObstacles.length > 0) {
        currentObstacles[0].obstacle.destroy();
        currentObstacles.shift();
    }
}

// render new obstacle objects based on random Id.
function renderObstacle() {
	currentObstacles.push(new obstacle());
}

// abstract class to hold different types of obstacles
class obstacle {
	constructor() {
        var num = Math.floor(Math.random()*obstacles.length);
        var obstacle = obstacles[num];
        var height = 600;
        var allowGravity = true;
        if (!obstacle.onGround) {
            allowGravity = false;
            height = player.body.y;
        }
        if (obstacle.yVelocity) {
            this.obstacle = game.add.sprite(player.body.x, 0, obstacle.name);
            game.physics.enable(this.obstacle, Phaser.Physics.ARCADE);
            this.obstacle.body.velocity.y = .66 * changeObstacleVelocity(obstacle);
            this.obstacle.body.acceleration.y = 100;
            if (this.obstacle.body.x > 400)
                this.obstacle.body.velocity.x = -Math.random()*140 - 30;
            else
                this.obstacle.body.velocity.x = Math.random()*140 + 30;

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
        this.yVelocity = obstacle.yVelocity;

    	this.obstacle.body.collideWorldBounds = true;
        this.obstacle.body.allowGravity = allowGravity;
        this.obstacle.immovable = true;
	}
}

/*****************************************************************
Difficulty Code

******************************************************************/

function changeObstacleVelocity(obstacle) { 
    return calculateLinear()*(obstacle.maxVelocity-obstacle.baseVelocity)+obstacle.baseVelocity;

}

function changeBackgroundVelocity(num) {
    return calculateLinear()*num;
}

function changePlatformVelocity() {
    return calculateLinear();
}

function calculateJumpStringLength() {
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
    return length;

}

function calculateRatio() {
    var ratio = Math.exp(game.time.totalElapsedSeconds()/100)/Math.exp(BASE_TIME/100);
    return ratio;
}

function calculateLinear() {
    var ratio = game.time.totalElapsedSeconds()/BASE_TIME;
    return ratio;
}

/*****************************************************************
Menu Code

******************************************************************/

function handleMenu(onStart,restart) {
    onStart = typeof onStart == 'boolean' ? true : false;
    restart = typeof restart == 'boolean' ? true : false;
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
    var pauseRestart = false;

    // Add start button and instruction text
    if (restart) {
        var sc = "Score: "+parseInt(oldScore).toString();
        oldScore_text = game.add.text(xCord, yCord - 50, sc, danstyle);
    }
    start_button = game.add.text(xCord, yCord, restart || !onStart ? 'restart' : 'start', style);
    instruction_text = game.add.text(xCord - 150, yCord, text, style);

    // Add resume button if not start screan    
    if (!onStart && currentObstacles.length > 0) {
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
        if (!onStart) {
            pauseRestart = true;
            reset();
            player.destroy();
            setPlayer();
        }
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
        }
        if (pauseRestart || restart) {
            game.time.reset();
            renderObstacle();
            platformTimer = -1;
        }

        !onStart ? resume_button.destroy() : null;
    }
    function toggleButtons() {
        start_button.visible = !start_button.visible;
        instruction_button.visible = !instruction_button.visible;
        back_button.visible = !back_button.visible;
        instruction_text.visible = !instruction_text.visible;
        oldScore_text.visible = !oldScore_text.visible;

        !onStart ? resume_button.visible = !resume_button.visible : null;
    }


}

/*****************************************************************
Restart Game

******************************************************************/

function render () {
    var sc = "Score: "+parseInt(score).toString();
    // var ob = "Obstacles Cleared: "+parseInt(successfulObs, 10).toString();
    var typ = "Type " + pressString + " to jump"
    var hs = "High Score: "+parseInt(high_score).toString();
    if (score_text != null) {
        score_text.destroy();
        type_text.destroy();
        hs_text.destroy();
    }
    hs_text = game.add.text(32, 32, hs, danstyle);
    score_text = game.add.text(32, 64, sc, danstyle);
    // obstacle_text = game.add.text(32, 64, ob, danstyle);
    type_text = game.add.text(32, 96, typ, jumpstyle);
}

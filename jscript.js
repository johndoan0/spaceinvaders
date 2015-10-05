"use strict";

;(function(){
	var Game = function(canvasId){
		var canvas = document.getElementById(canvasId); //screen size of game
		var screen = canvas.getContext('2d'); //draws to canvas
		var gameSize = {x: canvas.width, y: canvas.height};

		//info on size of player, enemies, bullets
		this.bodies = createInvaders(this).concat(new Player(this, gameSize));

		var self = this;
		loadSound("shoot.wav", function(shootSound){
			self.shootSound = shootSound;
			var tick = function(){
			//runs the game logic, runs ~60x/second depending on browser
				self.update();
				self.draw(screen, gameSize);
				requestAnimationFrame(tick) //makes tick() run ~60x/second
			};

			tick();
		})
	};

	Game.prototype = {
		update: function(){
			// console.log(this.bodies)
			var bodies = this.bodies;
			//anything colliding w/ b1 (ie. b2) will disappear
			var notCollidingWithAnything = function(b1){
				return bodies.filter(function(b2){return colliding(b1, b2);}).length === 0
			};

			this.bodies = this.bodies.filter(notCollidingWithAnything);

			for(var i = 0; i < this.bodies.length; i++){
				this.bodies[i].update();
			};
		},  // calls update on this.bodies instances

		draw: function(screen, gameSize){
			//clear previous bodies so they they don't clutter and overlap 
			screen.clearRect(0, 0, gameSize.x, gameSize.y);
			//for loop draws player, invaders, bullets bodies every this.update
			for(var i = 0; i < this.bodies.length; i++){
				drawRect(screen, this.bodies[i]);
			}
		},

		addBody: function(body){
			this.bodies.push(body);
		},

		invadersBelow: function(invader){
			return this.bodies.filter(function(b){
				return b instanceof Invader && 		//keep invader bodies below
				b.center.y > invader.center.y &&
				b.center.x - invader.center.x < invader.size.x;
			}).length > 0; //.length > 0 = there are invaders below, don't shoot
		}
	};

	//PLAYER
	var Player = function(game, gameSize){
		this.game = game;
		this.size = {x: 10, y: 10}; //size of player
		this.center = {x: gameSize.x / 2, y: gameSize.y - this.size.x}; //where player will start
		this.keyboarder = new Keyboarder(); //new instance of Keyboarder which detects keypress for movement
	};

	Player.prototype = {
		//when game.update is run (60/sec), will also run player.update
		update: function(){
			//keypress left = player left
			if(this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)){
				this.center.x -= 2;
			}
			// keypress right = player right
			else if(this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)){
				this.center.x += 2;	
			}

			// bullet = space key
			if(this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)){
				var bullet = new Bullet({x: this.center.x, y: this.center.y - this.size.x/2},
										{x: 0, y: -.9});
				this.game.addBody(bullet);
				this.game.shootSound.load();
				this.game.shootSound.play();
			}	
		}
	};

	//BULLET
	var Bullet = function(center, velocity){
		this.size = {x: 1, y: 1}; //size of bullet
		this.center = center;
		this.velocity = velocity;
	};

	Bullet.prototype = {
		//when game.update is run (60/sec), will also run bullet.update
		update: function(){
				this.center.x += this.velocity.x;
				this.center.y += this.velocity.y;
		}		
	};

	//INVADER
	var Invader = function(game, center){
		this.game = game;
		this.size = {x: 5, y: 5 }; //size of invader
		this.center = center;
		this.patrolX = 0;
		this.speedX = 0.3;

	};

	Invader.prototype = {
		//when game.update is run (60/sec), will also run invader.update
		update: function(){
			//invaders will move in opposite direction when it hits boundary
			if (this.patrolX < 0 || this.patrolX > 40){
				this.speedX = -this.speedX;
			}

			//velocity which invaders move
			this.center.x += this.speedX;
			this.patrolX += this.speedX;

			//rate at which invader shoots, direction && top doesn't shoot other invaders below
			if(Math.random() > .995 && !this.game.invadersBelow(this)){
				var bullet = new Bullet({x: this.center.x, y: this.center.y + this.size.x*2},
										{x: Math.random() - 0.5 , y: 2});
				this.game.addBody(bullet);
			};
		}
	};

	var createInvaders = function(game){
	//create 23 invaders
		var invaders = [];
		//x = columns of invaders, y = rows of invaders, *30 = space between invaders
		for (var i = 0; i < 24; i++) {
			var x = 30 + (i % 8) * 20;
			var y = 30 + (i % 3) * 20;
			invaders.push(new Invader(game, {x: x, y: y}));
		};
		return invaders
	};

	var drawRect = function(screen, body){
		screen.fillRect(body.center.x - body.size.x/2,
						body.center.y - body.size.y/2,
						body.size.x,
						body.size.y) //draws player body
	};

	var Keyboarder = function(){
		//movement
		var keyState = {};
		
		window.onkeydown = function(e){
			keyState[e.keyCode] = true;
		};

		window.onkeyup = function(e){
			keyState[e.keyCode] = false;
		};

		this.isDown = function(keyCode){
			return keyState[keyCode] === true;
		};

		this.KEYS = {LEFT: 37, RIGHT: 39, SPACE: 32};
	};

	var colliding = function(b1,b2){
		//detect collision by checking if sides DO NOT overlap, if no overlap, then 'true'
		return !(b1 === b2 ||
				b1.center.x + b1.size.x/2 < b2.center.x - b2.size.x/2 ||
				b1.center.y + b1.size.y/2 < b2.center.y - b2.size.y/2 ||
				b1.center.x - b1.size.x/2 > b2.center.x + b2.size.x/2 ||
				b1.center.y - b1.size.y/2 > b2.center.y + b2.size.y/2);
	};

	var loadSound = function(soundFile, callback){
		var loaded = function(){
			callback(sound);
			sound.removeEventListener('canplaythrough', loaded);
		}

		var sound = new Audio("sounds/shoot.wav");
		sound.addEventListener('canplaythrough', loaded);
		sound.load();
	};

	window.onload = function(){
		new Game("screen"); //loads game when DOM loads canvas and other stuff
	};
} ) ();


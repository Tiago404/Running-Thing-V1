import kaboom from "kaboom"

kaboom()

// load a sprite "bean" from an image
loadSprite("bean", "sprites/bean.png")
loadSprite("bg", "sprites/bg3.png")
loadSprite("tree", "sprites/tree.gif")

// Loading a multi-frame sprite
loadSprite("shinobi", "sprites/spriteRun2.png", {
	// The image contains 8 frames layed out horizontally, slice it into individual frames
	sliceX: 8,
	// Define animations
	anims: {
		"run": {
			from: 0,
			to: 7,
			//Frames per second
			speed: 10,
			loop: true,
		}
	},
})

// Define player movement speed when arrows are pressed
const SPEED = 320

const dialogs = [
	["CHEATING WILL NOT BE PERMITTED"],
	[""]
]

const effects = {
	crt: () => ({
		"u_flatness": 3,
	}),
	// vhs: () => ({
	// 	"u_intensity": 12,
	// }),
	// pixelate: () => ({
	// 	"u_resolution": vec2(width(), height()),
	// 	"u_size": wave(2, 16, time() * 2),
	// }),
	// invert: () => ({
	// 	"u_invert": 1,
	// }),
	// light: () => ({
	// 	"u_radius": 64,
	// 	"u_blur": 64,
	// 	"u_resolution": vec2(width(), height()),
	// 	"u_mouse": mousePos(),
	// }),
}

for (const effect in effects) {
	loadShaderURL(effect, null, `frags/${effect}.frag`)
}

/////////////////////////////////////////
//     			START 				   //
//				SCENE                  //
/////////////////////////////////////////
scene("start", () => {
	var currEffect = 0;

	onKeyPress("up", () => {
		const effect = Object.keys(effects)[0]
		usePostEffect(effect, effects[effect]())
	})

	onKeyPress("down", () => {
		usePostEffect(null)
	})

	//add background sprite
	add([
		sprite("bg", { tiled: false, width: width(), height: height() }),
	])

	add([
		text("Bean Boy"),
		pos(width() / 2, height() / 2),
		scale(1.5),
		anchor("center"),
	]);

	add([
		text("Press Space To Start..."),
		pos(width() / 2, height() / 2 + 200),
		scale(2),
		anchor("center"),
	]);

	add([
		text("By Tiago404", {
			font: "monospace",
			// special wave effect
			transform: (idx, ch) => ({
				color: hsl2rgb((time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8),
				pos: vec2(0, wave(-4, 4, time() * 4 + idx * 0.5)),
				scale: wave(1, 1.2, time() * 3 + idx),
				angle: wave(-9, 9, time() * 3 + idx),
			}),
		}),
		pos(width() / 4, height() / 4),
		scale(2),
		anchor("center"),

	]);


	// go back to game with space is pressed
	onKeyPress("space", () => go("game"));
	onClick(() => go("game"));
})

/////////////////////////////////////////
//     			GAME 				   //
//				SCENE                  //
/////////////////////////////////////////
scene("game", () => {


	/*
	----- CONTROL VIEW CHANGES BELOW -----
	*/
	//trigger first effect change on screen at 15 seconds
	wait(15, () => {
		const effect = Object.keys(effects)[0]
		usePostEffect(effect, effects[effect]())
	})

	// 5 seconds after last effect, reset the view
	wait(20, () => {
		usePostEffect(null)
	})

	/*
	----- END OF CONTROL VIEW CHANGES ABOVE -----
	*/


	//Setup speeds for player movement and background movement
	let playerSpeed = 0;
	let backgroundSpeed = 400;


	/*
	----- BACKGROUND SETTINGS BELOW -----
	*/
	//use 3 bg sprites, when one is too far outside the camera, it jumps to the front, refer to onUpdate below
	let bgs = [0, 1, 2].map(index => add([
		sprite("bg", { width: width(), height: height() }),
		pos(index * width(), 0),
		area(),
		move(LEFT, backgroundSpeed)
	]))

	//onUpdate registers an event that runs every frame (60x per second)
	onUpdate(() => {
		bgs.forEach(bg => {
			if (bg.pos.x < camPos().x - width() * 2) {
				bg.pos.x += width() * 3
			}
		})
	})


	// Wait x amt of seconds to double speed of background
	wait(3, () => {

		bgs = [0, 1, 2].map(index => add([
			sprite("bg", { width: width(), height: height() }),
			pos(index * width(), 0),
			area(),
			move(LEFT, backgroundSpeed * 2),
			z(-1)
		]))

	})

	/*
	----- END OF BACKGROUND SETTINGS ABOVE -----
	*/


	/*
	----- PLAYER SETTINGS BELOW -----
	*/
	const player = add([
		sprite("shinobi"),
		pos(80, 40),
		// Set custom area margin
		area({ shape: new Rect(vec2(0), 90, 125) }),
		// If we want the area scale to be calculated from the center
		anchor("center"),
		body(),
		scale(2),
	])

	player.play("run")

	//make sure bean only jump when he's on the ground
	onKeyPress("space", () => {
		if (player.isGrounded()) {
			player.jump(1200)
		}
	})

	//bean move left when left key is pressed
	onKeyDown("left", () => {
		if (player.pos.x < 0) {
			player.pos.x = 0
		}
		player.move(-SPEED, 0)
	})

	//bean move right when right key is pressed
	onKeyDown("right", () => {
		if (player.pos.x > width() - 100) {
			player.pos.x = width() / 2

			//Add text let player know not to cheat
			const textbox = add([
				rect(width() - 200, 120, { radius: 32 }),
				anchor("center"),
				pos(center().x, center().y),
				outline(4),
			])
			const txt = add([
				text(dialogs[0], { size: 32, width: width() - 230, align: "center" }),
				pos(textbox.pos),
				anchor("center"),
				color(0, 0, 0),
			])

			wait(3, () => {
				destroy(textbox)
				destroy(txt)
			})
		}
		player.move(SPEED, 0)
	})

	//set collision
	player.onCollide("tree", () => {
		addKaboom(player.pos);
		shake();
		wait(0.15, () => {
			go("lose", score);
		})

	})

	/*
	----- END PLAYER SETTINGS ABOVE -----
	*/


	// add platform to the bottom of the screen, this is what player runs on
	add([
		rect(width(), 48),
		pos(0, height() - 48),
		outline(4),
		area(),
		body({ isStatic: true }),
		color(127, 200, 255),
	])

	setGravity(2000)



	//add tree, every 0.5-1.5 seconds
	//pos defines the top left point of the shape, here we change it to bot left point 
	//because we want it just above platform
	function spawnTree() {
		add([
			sprite("tree", { width: 200, height: rand(150, 280) }),
			area(),
			pos(width(), height() - 48),
			anchor("botleft"),
			color(255, 180, 255),
			move(LEFT, 800),
			"tree", //tree tag
			offscreen({ destroy: true })
		]);
		wait(rand(0.8, 2.0), () => {
			spawnTree();
		});
	}

	// spawnTree();

	let score = 0;
	const scoreLabel = add([
		text(score),
		pos(24, 24)
	])

	// increment score every frame
	onUpdate(() => {
		score++;
		scoreLabel.text = score;
	});

})


/////////////////////////////////////////
//     		   END GAME     		   //
//				SCENE                  //
/////////////////////////////////////////
scene("lose", (score) => {
	//add background sprite
	add([
		sprite("bg", { tiled: false, width: width(), height: height() }),
	])

	//add player sprite
	add([
		sprite("shinobi"),
		pos(width() / 2, height() / 2 - 80),
		scale(2),
		anchor("center"),
	]);

	//display score
	add([
		text(score),
		pos(width() / 2, height() / 2 + 80),
		scale(2),
		anchor("center"),
	]);


	//message to show how to restart
	add([
		text("Press Space To Start Again"),
		pos(width() / 2, height() / 2 + 200),
		scale(2),
		anchor("center"),
	]);


	// go back to game with space is pressed
	onKeyPress("space", () => go("game"));
	onClick(() => go("game"));
})








//start the game at start scene
go("start")





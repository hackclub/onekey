---
title: Make a one key gambling game!
description: Gambling with JavaScript!
thumbnail: https://cdn.hackclub.com/019f1f47-55b9-78d4-8245-f1fed312274b/mr0ydi8.png
stack:
  - HTML
  - CSS
  - JavaScript
order: 1
---
## Make a one key gambling game
let's go gambling! _ding ding ding_ aw dang it _ding ding ding_ aw dang it

Okay... gambling is bad, kids. But, it makes for fun & simple gameplay, which is perfect for onekey! Let's learn how to make a RNG game on the web together, using HTML, CSS, and JavaScript!

Quick heads up before we start - literally everything we're about to build (press a key, get a random number, react to it) doesn't actually have to be about gambling. That's just the theme I picked! Same code underneath, but you could just as easily turn this into a magic 8-ball, a slot machine, or honestly whatever random idea pops into your head. Keep that in mind as we go - I'd love for your version to end up feeling like your game, not just a copy of mine!
## Requirements
To follow this guide, you'll also need to know how to use the following tools:

- Visual Studio Code
- GitHub or GitHub Desktop
- Hackatime - this tracks your coding time, which onekey uses to verify your work If you're already familiar with how to use these tools, you can skip to the section after "Setup" If you need help setting up these tools, view our [Hackatime tutorial video](https://www.youtube.com/watch?v=grriwsX5mIo) or come ask for help in #onekey-help on the Hack Club Slack!
## Repository Setup
If you're already familiar with how to make a GitHub repository and get it onto your computer, you can do that and skip this step!

First, if you don't already have GitHub Desktop, download it here: https://desktop.github.com/download/

Proceed with logging into the app with your GitHub account and following the instructions until you get to this screen:  
![Image|520](https://docs.github.com/assets/cb-143755/mw-1440/images/help/desktop/lets-get-started.webp)  
Click "Create a New Repository on your Hard Drive..." and a few fields should appear:  

- **Name**: Pick a nice name for your project (and repo folder) - if you don't have one yet, "onekey-rng" should be fine!
- **Description**: A short description of what your project does - it's optional, so you can leave it blank.
- **Initialize this repository with a README**: just check this - why not?
- **Git ignore**: You can leave this empty.
- **License**: Not important unless you know what license you want - just leave it blank.

Now, click "Create repository." Congratulations, you're the proud new owner of your very own GitHub repository!

Assuming you're using Visual Studio Code - open it up by clicking the "Open in Visual Studio Code" button; if you're using another editor, it may or may not show up. Just open the repository folder (wherever it was saved) in your code editor.

You can initialize this project by making a blank HTML file called `index.html`, which would look like this:
```html
<!DOCTYPE html>
<html>
	<head>
	</head>
	<body>
	</body>
</html>
```
If you open this HTML file from your file system (File Explorer, Finder, etc) into your browser, it should display a white screen! Nice job - you've made a website! (unfortunately, a very boring one) Go ahead and publish this repository to GitHub - make sure that your code is public, NOT PRIVATE!  
![](https://cdn.hackclub.com/019efb50-479b-7a0e-8a9c-b9557bdae33b/image%20(6))
## Drawing something on the screen
Let's now put something on this very blank site! We'll use something called a `<h1>` element, which is short for "heading 1!" We can place that inside the `<body>` tags, which should contain anything that visually shows up on the page.

If you're not familiar with what an element is - it's a single piece of HTML, made up of three parts: an opening tag, the content inside it, and a closing tag. For example, our `<h1>` element breaks down like this:

`<h1>` - the starting tag
`Hello!` - content inside the element
`</h1>` - the closing tag

```html
<!DOCTYPE html>
<html>
	<head>
	</head>
	<body>
		<h1>Hello!</h1>
	</body>
</html>
```
Now, save your file (Ctrl+S on Windows, Cmd+S on Mac) - your browser can only show your latest changes if the file's actually been saved! Then go back to your file in the browser and refresh - a little text in the corner saying "Hello!" should appear! Now your page is not so empty anymore :)
(P.S. Don't forget to keep saving! You need to save every time you want to check your changes on the website!)  
![](https://cdn.hackclub.com/019f1f30-79c7-7102-8166-9c9866afdc7e/Pasted%20image%2020260630161546.png)
We'll also assign an ID to this heading - this will be important later, when we need to use the element in JavaScript!
```html
<body>
	<h1 id="display">Hello!</h1>
</body>
```
Let's go ahead and turn this into something we can actually use for the game!
## Tracking inputs
We need a way to track when you press a key, so that it can do something when you press it! We'll do this using **JavaScript**, the scripting language of the web! Start by making a `<script>` tag in your `<head>` element:
```html
<head>
	<script>
	</script>
</head>
```
Script elements are where your JavaScript code will live! Inside the script tag, JavaScript code will run - so where you place it matters! Script tags inside the head element will load first, but if you place a script tag in your body tag, it will run when it loads (potentially after some elements load!) We'll actually run into this ourselves later on, so keep it in mind! Let's actually put some JavaScript in there - let's make it register key presses!
```html
<head>
	<script>
		document.addEventListener("keydown", (event) => {
			alert("You pressed a key!");
		});
	</script>
</head>
```
We just added an event listener - that's a piece of JavaScript code that listens for when certain events happen! In this case, the event was a key! Now if you check your website, when you press a key, a little window should pop up saying "You pressed a key!"  
![292](https://cdn.hackclub.com/019f19de-3f65-7251-818c-1c291a4413a1/f49qxes.png)  
But this is any key pressed - we only want ONE KEY to do anything... let's pick the O key (for onekey!)
```html
<head>
	<script>
	document.addEventListener("keydown", (event) => {
		if (event.key == "o") { // Check if the key was an O
			alert("You pressed O!");
		}
	});
	</script>
</head>
```
Essentially, when we register a "keydown" event, we store information about the event in the event variable, including which key it was! Then, we check if it was the right key, and trigger the popup window if it was!

One small thing to watch out for: `event.key` is case-sensitive, so if Caps Lock is on, pressing the key will give you `"O"` instead of `"o"` - and the check will silently fail! Just something to keep in mind if your game ever seems to stop responding.

Now, your website is interactive! Let's make it actually do something fun!
## Adding randomness
Okay, if we want to gamble, we have to make things random! The basis of all things random on the internet is RNG (Random Number Generation)! So let's make it so when you press the key, it shows a random number on the screen! (Occasionally in the code on this tutorial, there will be some grayed out text! These are comments, just notes from me to you to explain what some code is doing! You don't have to copy them.)
```html
<head>
	<script>
	let random_number = 0; // declare a variable to hold a number
	document.addEventListener("keydown", (event) => {
		if (event.key == "o") {
			random_number = Math.random(); // put a random number inside the variable
			alert(random_number); // show the variable in a popup
		}
	});
	</script>
</head>
```
If you did everything right, this popup should show when you press "o," displaying a random number! ![](https://cdn.hackclub.com/019f1f30-045e-7f37-b6c5-98865cc2b26c/Pasted%20image%2020260630165555.png)  
Oh, but... why is it a decimal number? Why is it only numbers between 0-1? Ah, that's because the random function in JavaScript only returns a random number between 0 and 1. While this is not very useful on its own, we can combine it with other math functions to make it generate useful numbers!
```js
document.addEventListener("keydown", (event) => {
	if (event.key == "o") {
		random_number = Math.floor(Math.random() * 11); // multiply the number by 11, then round it down!
		alert(random_number);
	}
});
```
This math should give you, now, random numbers, from 1-10 inclusive! If you want different numbers, you can change the 11 in the code to another number:
- 1-100: set the number to 101
- 1-1000: set the number to 1001
- 1-67: set the number to 68 Do you see the pattern? It's just one more than the upper bound! Let's make it look a little nicer by adding a big display on the screen!
## Number display
Right now, your code should look somewhat like this:
```html
<!DOCTYPE html>
<html>
	<head>
		<script>
			let random_number = 0;
			document.addEventListener("keydown", (event) => {
				if (event.key == "o") {
				random_number = Math.floor(Math.random() * 11);
				alert(random_number);
				}
			});
		</script>
	</head>
	<body>
		<h1 id="display">Hello!</h1>
	</body>
</html>
```
### Make it look nicer?
Let's change the div text to be bigger, and in the middle of the screen - this is where we'll show the random number! We'll use CSS to do this - this is how websites look better than just text on your screen - there's styling to it! We'll start by placing a style tag in the header - this is where all the CSS on your website lives (kinda like script tags for JavaScript!)
```html
<!DOCTYPE html>
<html>
	<head>
		<script>
			let random_number = 0;
			document.addEventListener("keydown", (event) => {
				if (event.key == "o") {
				random_number = Math.floor(Math.random() * 11);
				alert(random_number);
				}
			});
		</script>
		<style>
		</style>
	</head>
	<body>
		<h1 id="display">Hello!</h1>
	</body>
</html>
```
Inside the style tag, we'll write our first bit of CSS by styling the body tag - the element that holds everything on the screen (so, like a container)! We'll change the background color to show you how CSS works!
```html
<style>
	body {
		background-color: skyblue; /* or choose your favorite color! */
	}
</style>
```
You'll see the entire background of the body turned skyblue (one of my personal favorite colors!) Let's go through what each part of this CSS code did!
```css
body { /* this is a selector! rules inside of it will apply to its elements (in this case, the body!) */
	background-color: skyblue; /* this is a rule, saying that the background color should be skyblue! it applies to the selector that it's inside! */
}
```
Let's apply some more rules:
```css
body {
	background-color: skyblue;
	display: flex; /* enables "flexbox" which allows you to display your elements in a flexible way */
	align-items: center; /* centers the items vertically inside the container */
	justify-content: center; /* centers the items horizontally inside the container */
	height: 100vh; /* sets the height to the full height of the screen */
	margin: 0; /* remove the small margin (empty space) surrounding the body tag by default */
}
```
Now your "Hello!" should be in the middle of the screen! But it doesn't look very nice... let's make it look cooler by making a new tag!
```css
body {
	background-color: skyblue;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100vh;
	margin: 0;
}
/* new code below */
h1 { /* now these rules only apply to h1 tags! */
	color: black; /* you can set your text color to whatever - i kept it black */
	font-size: 67px; /* let's make it mega big!! you can change this number to tweak the size to your liking*/
	font-family: sans-serif; /* you can set this to serif, sans-serif, monospace, or cursive! */
}
```
You can also figure out how to set a custom font using Google Fonts - but I suggest to do this later! If you've followed along correctly, your code and website should look like this:  
![](https://cdn.hackclub.com/019f1f2f-68ad-70f0-b4f2-4da11efa4a47/Pasted%20image%2020260701120402.png)
When you press the "o" key, it should show a random number! Let's make it actually show the number now, instead of just the word "Hello!" Before we do that - let's actually change the text to something useful:
```html
<body>
	<h1 id="display">Press "o" to start</h1>
</body>
```
### Connecting it to the screen
Let's go back to coding in JavaScript! Right now, pressing the "o" key only makes an alert / popup on the screen - let's have it display on the text in the middle! Remove the current "alert" line, which opens that popup - we'll replace it with something else soon! But first, we need to add a line before all of this code. This one is a bit more complicated, so let me explain what it means!
```js
const display = document.getElementById("display");
```
We're setting a variable called `display` to hold the `<h1 id="display">` element we made earlier - remember when we added that ID? This is exactly why! `getElementById` finds the element with that ID, and stores it in the `display` variable so we can change it with code.
```js
...
let random_number = 0;
const display = document.getElementById("display"); /* put this here! */
document.addEventListener("keydown", (event) => {
...
```
Now we can use that `display` variable to change the text inside the element:
```js
display.innerHTML = random_number;
```
`innerHTML` refers to the content INSIDE the tag - so if you remember earlier:

> `<h1>` - the starting tag
> `Hello!` - innerHTML
> `</h1>` - the closing tag

Setting `display.innerHTML` to `random_number` swaps out the text for the number we just generated!
```js
const display = document.getElementById("display");
let random_number = 0;
document.addEventListener("keydown", (event) => {
	if (event.key == "o") {
		random_number = Math.floor(Math.random() * 11);
		display.innerHTML = random_number; /* put this here! */
	}
});
```
If you run this code, you may notice that it doesn't work. This is because, this JavaScript code runs before the HTML code, which means the display text element doesn't exist yet! We can fix this by moving the entire script element down BELOW (after) the h1 element! This should look something like:
```html
<!DOCTYPE html>
<html>
<head>
<style>
	body {
		background-color: skyblue;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		margin: 0;
	}
	h1 {
		color: black;
		font-size: 67px;
		font-family: sans-serif;
	}
</style>
</head>
<body>
	<h1 id="display">Press "o" to start</h1>
	<script>
		const display = document.getElementById("display");
		let random_number = 0;
		document.addEventListener("keydown", (event) => {
			if (event.key == "o") {
				random_number = Math.floor(Math.random() * 11);
				display.innerHTML = random_number;
			}
		});
	</script>
</body>
</html>
```

Now if you check your website - it should work! A random number should appear when you press the "o" key! What number did you get? I got 6 :)  
![](https://cdn.hackclub.com/019f1f2a-e2f2-78aa-be2d-d7523fb4ce4d/Pasted%20image%2020260701131801.png)
Nice! Now we have a working way to generate random numbers and display them on the screen! However, this is far from a game - right now, every roll you make just kinda disappears the second you press "o" again. Let's fix that.
## Turning it into a real game
Let's give your rolls something to actually build towards, by keeping track of a coin balance that grows every time you play, and rewarding you for saving it up!
### Adding a coin balance
Let's add a new variable to keep track of your coins - we'll put it right next to `random_number`:
```js
let coins = 0; // starts at 0, but will grow as you play!
```
Now, instead of just showing off the number you rolled, let's actually add it to your balance! We'll use the `+=` operator for this, which just means "take whatever's already there, and add this on top of it":
```js
coins += random_number; // adds whatever you rolled to your coin total
```
Let's put that all together, and update the display so it shows both what you rolled AND your running total:
```js
const display = document.getElementById("display");
let random_number = 0;
let coins = 0;
document.addEventListener("keydown", (event) => {
	if (event.key == "o") {
		random_number = Math.floor(Math.random() * 11);
		coins += random_number;
		display.innerHTML = "Rolled " + random_number + "! Coins: " + coins;
	}
});
```
Now every press actually matters! Your balance keeps climbing the more you play, instead of disappearing the second you roll again.
### Unlocking colors as you save up
Let's make those coins feel worth earning, by unlocking a new background color once you hit a certain amount! We'll use `else if` for this, which lets you check a bunch of conditions back to back - it goes through them top to bottom, and stops at the first one that's true:
```js
if (coins >= 100) {
	document.body.style.backgroundColor = "gold"; // unlocked at 100 coins!
} else if (coins >= 50) {
	document.body.style.backgroundColor = "orchid"; // unlocked at 50 coins!
} else if (coins >= 20) {
	document.body.style.backgroundColor = "lightgreen"; // unlocked at 20 coins!
}
```
Add this right after you update `coins` inside your event listener, and boom - your background changes on its own as your balance grows! Try picking your own colors and thresholds here too - this is your game now, so go wild!
## Next Steps
Right now your coins grow the exact same way every single time, which is kind of boring - let's throw a little luck into it! Once you see how this works, you'll be able to build every other idea below using basically the same trick.
### Adding a lucky number bonus
Let's say landing on 7 is lucky, and pays out double coins! We can check for this right when we update `coins`, using an `if` / `else` statement:
```js
document.addEventListener("keydown", (event) => {
	if (event.key == "o") {
		random_number = Math.floor(Math.random() * 11);
		if (random_number == 7) {
			coins += random_number * 2; // lucky! double coins
			display.innerHTML = "Lucky 7! Coins: " + coins;
		} else {
			coins += random_number;
			display.innerHTML = "Rolled " + random_number + "! Coins: " + coins;
		}
	}
});
```
An `if` statement runs its code only when the condition inside the parentheses is true - and `else` gives you a backup, for when it isn't! Try it out - press "o" a bunch of times until you land on 7!
### The pattern to reuse
Here's the actual trick we just pulled: we checked if something was true (was `random_number` 7?), and changed something because of it (your coins, and the message). That's genuinely it - that's the whole secret behind every idea below! Here's how you'd use that same trick for each one:
- **Add more unlock tiers**: try adding unlocks at 200, 500, or 1000 coins - or ditch the colors entirely for something like animal emojis or text labels that "hatch" as you save up (Egg → Chick → Hen → Rooster, for example)!
- **Track your total rolls**: keep a separate variable, like `let rolls = 0;`, and add 1 to it every time you press "o" (`rolls += 1;`) - then show it on screen alongside your coins, so players can see how many tries it took to get where they are.
- **Add sound effects**: look up the `Audio` object in JavaScript - you can play a sound with just `new Audio("yoursound.mp3").play();` inside your lucky-roll `if` statement.
- **Add a coin multiplier**: what if every 5th press paid out extra, instead of just rolling a 7?
- **Add a reset button**: make a `<button>` element in your HTML, give it an ID like `reset`, then add a _second_ event listener for it (`resetButton.addEventListener("click", ...)`) that sets `coins` back to 0 and resets the display and background back to their starting state.

Before you ship this, make sure you've actually changed or added at least one thing from the list above (or come up with something totally different!) - just copying this tutorial word-for-word isn't gonna cut it. Make it feel like yours! And if you get stuck, come ask in #onekey-help on Slack! I'd be more than happy to help you!
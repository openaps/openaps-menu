// scripts/screen_menu.js
// Manages the different screens of the menu
//
// Author: juehv
// License: AGPLv3

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';
const Menube = require('menube');

module.exports = function (configButtons, configMenus, display, openapsDir, screens) {
	if (!configButtons.gpios || !configButtons.gpios.buttonUp || !configButtons.gpios.buttonDown) {
		throw new Error('Incomplete pins definition in configuration.');
	}
	const gpios = configButtons.gpios;
	const menu = Menube(configMenus.menuFile, configMenus.menuSettings);
	const piButtons = require('node-pi-buttons')(configButtons.options);
	
	var screensPos=-1;
	var displayDirty = false;
	
	// menu functions
	function up () {
		if (screensPos === -1){
			screensPos = 0;
		} else if (screensPos !== 0){
			screensPos -= 1;
		}
		console.log(screensPos);
		redraw();
		//menu.menuUp();
	}
	function down () {
		if (screensPos === -1){
			screensPos = 0;
		} else if (screensPos !== screens.length-1){
			screensPos += 1;
		}
		console.log(screensPos);
		redraw();
		//menu.menuDown();
	}
	function esc () {
		if (screensPos === -1){
			screensPos = 0;
		}
		// menu.menuBack();
	}
	function act () {
		if (screensPos === -1){
			screensPos = 0;
		}
		// menu.activateSelect();
	}
	
	// button events
	 piButtons
	.on('clicked', function (gpio, data) {
		// if (displayDirty) {
		  // fake menu changed to force redraw
		  // menu.emit('menu_changed');
		  // displayDirty = false;
		// }
		// else {
		  switch(parseInt(gpio, 10)) {
			case gpios.buttonUp:
				// if (!displayDirty) {
				  up();
				// }
				break;

			case gpios.buttonDown:
				// if (!displayDirty) {
				  down();
				// }
				break;
		  }
		resetTimer();
		// }
	})
	.on('pressed', function (gpio, data) {
		// if (displayDirty) {
		  // fake menu changed to force redraw
		  // menu.emit('menu_changed');
		  // displayDirty = false;
		// }
		// else {
		  switch (parseInt(gpio, 10)) {
			case gpios.buttonUp:
				esc();
				break;

			case gpios.buttonDown:
				// displayDirty = true; // activate may write something to the display
				act();
				break;
		  }
		resetTimer();
		// }
	})
	.on('released', function (gpio, data) {
		if (displayDirty) {
		  // fake menu changed to force redraw
		  menu.emit('menu_changed');
		  displayDirty = false;
		}
		resetTimer();
	})
	.on('error', function (data) {
		console.log('ERROR: ', data.error);
	});
	
	// display inactive timer
	var timer;
	function resetTimer(){
		if (typeof timer !== 'undefined'){
			clearTimeout(timer);
		}

		timer = setTimeout(() => {
			display.clear();
			screensPos = -1;
		}, 15000);
	}
	
	// draw active screen
	function redraw () {
		if (display){
			screens[screensPos](display, openapsDir);
		}
	}
	
	return menu;
}
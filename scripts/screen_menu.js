// scripts/screen_menu.js
// Manages the different screens of the menu
//
// Author: juehv
// License: AGPLv3

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

const Menube = require('menube');
const font = require('oled-font-5x7');

module.exports = function (configButtons, configMenus, display, openapsDir, screens, subMenuFiles, pumpPref) {
	if (!configButtons.gpios || !configButtons.gpios.buttonUp || !configButtons.gpios.buttonDown) {
		throw new Error('Incomplete pins definition in configuration.');
	}
	const gpios = configButtons.gpios;
	const events = require('events');
	const emitter = new events.EventEmitter();
	const piButtons = require('node-pi-buttons')(configButtons.options);
	
	var screensPos=-1;
	var subMenus = [];
	var subMenuActive = false;
	var displayDirty = false;
	
	
	// menu functions
	function up () {
		if (subMenuActive){
			subMenus[screensPos].menuUp();
			showMenu(subMenus[screensPos]);
		} else {
			if (screensPos === -1){
				screensPos = 0;
			} else if (screensPos !== 0){
				screensPos -= 1;
			}
			redraw();
		}
	}
	function down () {
		if (subMenuActive){
			subMenus[screensPos].menuDown();
			showMenu(subMenus[screensPos]);
		} else {
			if (screensPos === -1){
				screensPos = 0;
			} else if (screensPos !== screens.length-1){
				screensPos += 1;
			}
			redraw();
		}
	}
	function esc () {
		if (subMenuActive){
			if (subMenus[screensPos].menuBack()){
				showMenu(subMenus[screensPos]);
			} else {
				subMenuActive = false;
				redraw();
			}
		} else {
			if (screensPos === -1){
				screensPos = 0;
			}
			redraw();
		}
	}
	function act () {
		if (subMenuActive){
			if (subMenus[screensPos].getCurrentSelect().command){
				display.clear();
				display.write("Please wait...");
				subMenus[screensPos].activateSelect();
			} else {
				subMenus[screensPos].activateSelect();
				showMenu(subMenus[screensPos]);
			}
		} else {
			if (screensPos === -1){
				screensPos = 0;
			}
			if (subMenus[screensPos] !== undefined){
				showMenu(subMenus[screensPos]);
				subMenuActive = true;
			} else {	
				redraw();
			}
		}
	}
	
	// button events
	 piButtons
	.on('clicked', function (gpio, data) {
		  switch(parseInt(gpio, 10)) {
			case gpios.buttonUp:
	      up();
				break;

			case gpios.buttonDown:
		    down();
				break;
		  }
		resetTimer();
	})
	.on('pressed', function (gpio, data) {
		  switch (parseInt(gpio, 10)) {
			case gpios.buttonUp:
				esc();
				break;

			case gpios.buttonDown:
				act();
				break;
		  }
		resetTimer();
	})
	.on('released', function (gpio, data) {
		// if (displayDirty) {
		  // fake menu changed to force redraw
		  // emitter.emit('menu_changed');
		  // displayDirty = false;
		// }
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

		var timeout = subMenuActive ? 60000 : 15000;
		timer = setTimeout(() => {
			display.clear();
			screensPos = -1;
			subMenuActive = false;
		}, timeout);
	}
	
	// draw active screen
	function redraw () {
		if (display){
			screens[screensPos](display, openapsDir, pumpPref);
		}
	}
	
	// handling sub menus
	
	subMenuFiles.forEach(function (item) {
		if (item !== undefined){
			const tmpMenu = Menube(item, configMenus.menuSettings)
			tmpMenu.on('showoutput', function (err, stdout, stderr) {
				display.clear();
				display.write(stdout);
			});
			subMenus.push(tmpMenu);
		} else {
			subMenus.push(undefined);
		}
	});
	
	function showMenu(menu) {
		if (display) {
			display.clear();
			var text = '';

			var p = menu.getParentSelect();
			text += p ? '[' + p.label + ']\n' : '';
			
			var c = menu.getCurrentSelect();
			menu.getActiveMenu().forEach(function (m) {
				text += (m.selected ? '>' : ' ') + m.label + '\n';
			});

			//  console.log(text);
			display.oled.writeString(font, 1, text, 1, false, 0, false);
			// display.write(text);
		}
	}
	
  resetTimer(); 
	return emitter;
}
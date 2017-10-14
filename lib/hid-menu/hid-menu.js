// hid-menu.js

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

const Menube = require('menube');

function createHIDMenu(configButtons, configMenus) {
  if (!configButtons.pins || !configButtons.pins.buttonUp || !configButtons.pins.buttonDown) {
    throw new Error('Incomplete pins definition in configuration.');
  }
  var pins = configButtons.pins;
  var buttonOptions = configButtons.options || {};
  var onChange = configMenus.onChange;
  var menu = Menube(configMenus.menuFile, configMenus.menuSettings);
  var displayDirty = false;
  var buttons = require('rpi-gpio-buttons')([pins.buttonUp, pins.buttonDown], buttonOptions);

  menu.on('menu_changed', function () {
    displayDirty = false; // the parent will redraw the display
  });

  buttons
  .on('clicked', function (pin) {
    if (displayDirty) {
      // fake menu changed to force redraw
      menu.emit('menu_changed');
      displayDirty = false;
    }
    else {
      switch(pin) {
        case pins.buttonUp:
        if (!displayDirty) {
          menu.menuUp();
        }
        break;

        case pins.buttonDown:
        if (!displayDirty) {
          menu.menuDown();
        }
        break;
      }
    }
  })
  .on('double_clicked', function (pin) {
    if (displayDirty) {
      // fake menu changed to force redraw
      menu.emit('menu_changed');
      displayDirty = false;
    }
    else {
      switch (pin) {
        case pins.buttonUp:
        menu.menuBack();
        break;

        case pins.buttonDown:
        displayDirty = true; // activate may write something to the display
        menu.activateSelect();
        break;
      }
    }
  })
  .on('released', function (pin) {
    if (displayDirty) {
      // fake menu changed to force redraw
      menu.emit('menu_changed');
      displayDirty = false;
    }
  });

  return menu;
}


module.exports = createHIDMenu;

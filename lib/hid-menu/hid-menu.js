// hid-menu.js

/*jslint node: true */
/*jslint esversion: 6 */

'use strict';

const Menube = require('menube');

function createHIDMenu(configButtons, configMenus) {
  if (!configButtons.gpios || !configButtons.gpios.buttonUp || !configButtons.gpios.buttonDown) {
    throw new Error('Incomplete pins definition in configuration.');
  }
  var gpios = configButtons.gpios;
  var buttonOptions = configButtons.options || {};
  var onChange = configMenus.onChange;
  var menu = Menube(configMenus.menuFile, configMenus.menuSettings);
  var displayDirty = false;
  var piButtons = require('node-pi-buttons')(configButtons.options);

  menu.on('menu_changed', function () {
    displayDirty = false; // the parent will redraw the display
  });

  piButtons
  .on('clicked', function (gpio, data) {
    if (displayDirty) {
      // fake menu changed to force redraw
      menu.emit('menu_changed');
      displayDirty = false;
    }
    else {
      switch(parseInt(gpio, 10)) {
        case gpios.buttonUp:
        if (!displayDirty) {
          menu.menuUp();
        }
        break;

        case gpios.buttonDown:
        if (!displayDirty) {
          menu.menuDown();
        }
        break;
      }
    }
  })
  .on('double_clicked', function (gpio, data) {
    if (displayDirty) {
      // fake menu changed to force redraw
      menu.emit('menu_changed');
      displayDirty = false;
    }
    else {
      switch (parseInt(gpio, 10)) {
        case gpios.buttonUp:
        menu.menuBack();
        break;

        case gpios.buttonDown:
        displayDirty = true; // activate may write something to the display
        menu.activateSelect();
        break;
      }
    }
  })
  .on('released', function (gpio, data) {
    if (displayDirty) {
      // fake menu changed to force redraw
      menu.emit('menu_changed');
      displayDirty = false;
    }
  })
  .on('error', function (data) {
    console.log('ERROR: ', data.error);
  });

  return menu;
}


module.exports = createHIDMenu;

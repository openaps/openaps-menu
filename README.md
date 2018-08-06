# openaps-menu

This is the repository holding the menu-based software code, which you may choose to add to an Explorer HAT or other screen-based rig in order to visualize and enter information into a Pi-based #OpenAPS rig.

See [here](https://github.com/EnhancedRadioDevices/Explorer-HAT) for more details on the Explorer HAT hardware.

You can set your preferred auto-updating status screen using the following setting in your `~/myopenaps/preferences.json`:

`"status_screen": "bigbgstatus"` will display the big BG status screen (no graph).

`"status_screen": "off"` will turn the auto-updating screen off.


The auto-updating status script will invert the display about 50% of the time, to prevent burn-in on the OLED screen. You can turn this off with the following setting in your `~/myopenaps/preferences.json`:

`"wearOLEDevenly": false`


## Example screen outputs (Note: these are examples. The latest code may yield different menu items and screen displays)

### Status screen:

![Status screen](https://github.com/openaps/openaps-menu/blob/master/images/status.JPG)

### Graph:

![Graph visual on screen](https://github.com/openaps/openaps-menu/blob/master/images/graph.JPG)






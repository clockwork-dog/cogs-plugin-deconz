# COGS Deconz (Zigbee) plugin

## How to use

### Install the plugin

- Download the plugin from [Releases](https://github.com/clockwork-dog/cogs-plugin-deconz/releases/latest)
- Unzip into the `plugins` folder in your COGS project
- In the plugin you have copied, edit `cogs-plugin-manifest.json` following the examples already there and set:
  - Any lights/outlets you have add in Phoscon to `"state"` with the exact same `"name"`.
  - Any button/switches you have add in Phoscon to the `"toCogs"` section of `"events"` with the exact same `"name"`.
    - Buttons should have a value of `{ "type": "option", "options": [ "On Pressed", "On Long Pressed" ] }`
    - On/Off switches should have a value of `{ "type": "option", "options": [ "On Pressed", "Off Pressed", "On Long Pressed", "Off Long Pressed"] }`
- In COGS, open the project and go to `Setup` > `Settings` and enable `Deconz`

### How to use the plugin

- To trigger a behaviour from a button select `Deconz: My button` as the "When" and select the event type
- To change an outlet/light state add an `Update values` action to your behaviour and set it to `True` to turn on or `False` to turn off

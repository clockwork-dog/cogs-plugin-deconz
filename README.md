# COGS Deconz (Zigbee) plugin

![image](https://user-images.githubusercontent.com/292958/201886256-f6557b12-8e2f-4bbe-a564-4e50643811a3.png)

## How to use

### What you'll need

One of:

- [Raspbee II](https://phoscon.de/en/raspbee2)
- [Conbee II](https://phoscon.de/en/conbee2/)

### Install the plugin

- Install the [Phoscon app](https://phoscon.de/en/app/doc) on your machine or another machine on the network and pair your switches, buttons, lights and outlets
- Download the COGS plugin from [Releases](https://github.com/clockwork-dog/cogs-plugin-deconz/releases/latest)
- Unzip into the `plugins` folder in your COGS project
- In the plugin you have copied, edit `cogs-plugin-manifest.json` following the examples already there and set:
  - Any lights/outlets you have add in Phoscon to `"state"` with the exact same `"name"`.
  - Any button/switches you have add in Phoscon to the `"toCogs"` section of `"events"` with the exact same `"name"`.
    - Buttons should have a value of `{ "type": "option", "options": [ "On Pressed", "On Long Pressed" ] }`
    - On/Off switches should have a value of `{ "type": "option", "options": [ "On Pressed", "Off Pressed", "On Long Pressed", "Off Long Pressed"] }`
- In COGS, open the project and go to `Setup` > `Settings` and enable `Deconz`
- Add the Phoscon machine's IP address and your Phoscon API key in the plugin settings

### How to use the plugin

- To trigger a behaviour from a button select `Deconz: My button` as the "When" and select the event type
- To change an outlet/light state add an `Update values` action to your behaviour and set it to `True` to turn on or `False` to turn off

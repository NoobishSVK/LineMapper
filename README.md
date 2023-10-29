# LineMapper

**Make line maps your way!**

LineMapper is a powerful topology map-making library compatible with both desktops & mobile devices.

## Features

With LineMapper, you can:

- Generate a branched line map easily by drawing a main line and adding as many waypoints as you want. You can even use it as an event timeline.

- Make your map interactive by scripting custom functions for your waypoints, making them interactive and dynamic.

- Customize everything, from waypoint styles to line design. LineMapper is highly modular, allowing you to customize it to your specific needs.

## Projects using LineMapper

- [Noobish's interactive Minecraft Nether Highway map](https://noobish.eu/mc_map/): This map serves as a virtual Minecraft top-down view map, featuring interactive waypoint behavior and custom content.

Did you know that your project can be featured here as well? 😎

## Getting Started

### Installation

You can download LineMapper by [clicking here](https://github.com/NoobishSVK/LineMapper/releases) or install it using npm:

npm install linemapper.js

### Importing

You can import LineMapper into your project as follows:
~~~
<script src="linemapper.js"></script>
~~~
Or when using npm: 
~~~
const lineMapper = require('linemapper.js');
~~~

### Initializing LineMapper

To set up the container where the map will be drawn, put a canvas inside a container with the linemapper class:

~~~
<div class="linemapper">
  <canvas id="your-custom-id"></canvas> <!-- your-custom-id will be used for canvas init -->
</div>
~~~

Then, initialize LineMapper by calling this code at any time you need (after loading the library itself):
~~~
lineMapper.init({
  canvasId: 'your-custom-id', // the ID used in your canvas tag

  // Settings for the main line - coordinates (0, 0) indicate the middle of the canvas
  mainLine: {
    startPosX: '-512', // start position on X axis
    startPosY: '0',    // start position on Y axis
    endPosX: '512',    // end position on X axis (only used for horizontal lines)
    endPosY: '512',    // end position on Y axis (only used for vertical lines)
    color: '#bada55',  // color (can be in any format - rgb, rgba, hex...)
    branchSquareColor: 'white', // color of the square that indicates branching
    orientation: 'vertical',    // orientation of the line (can be either horizontal or vertical)
    width: 20 // thickness in pixels
  },
});
~~~

That's it! You're ready to create interactive and customizable line maps with LineMapper.

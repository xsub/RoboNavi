# RoboNavi

[![CI](https://github.com/xsub/RoboNavi/actions/workflows/ci.yml/badge.svg)](https://github.com/xsub/RoboNavi/actions/workflows/ci.yml)
[![Play RoboNavi](https://img.shields.io/badge/PLAY-ROBONAVI-83b996?style=for-the-badge)](https://xsub.github.io/RoboNavi/)

RoboNavi is an isometric robot-programming puzzle game for learning sequencing,
planning, and debugging. Build a command queue, predict the route, and then run
the whole program.

**[Play RoboNavi in your browser](https://xsub.github.io/RoboNavi/)**

![RoboNavi level 7 showing the 3D board, programmed route, robot, and mission-control panel](docs/robonavi-gameplay.png)

## Features

- 20 hand-authored levels with progressively larger boards
- Procedural levels with configurable size, route count, and wall density
- Dijkstra validation and A* reference programs for generated boards
- Forward, left, right, beacon-battery, and inductive-charge programming
- Floor, thin edge walls, sand, ice, charging stations, and signal beacons
- Three.js 3D board and robot with metallic PBR materials, animated multicolor
  tank tracks, expressive blinking, a telescopic idle antenna, and purple
  floor-projector beacons
- Mission-control cockpit with global-light and floor-color controls
- Persistent spectrum controls for the floor, cockpit background, and robot paint
- Animated electronic signal pulses travelling through the background grid
- Quarter-turn camera rotation, zoom controls, wheel or touchpad zoom, and drag-to-pan navigation
- Optional route preview without a ghost robot
- Unlimited-energy Free Drive mode for relaxed practice
- Energy and execution targets with three-star scoring
- Full-screen confetti celebration after the final beacon
- A 60-second beacon-network countdown after the first battery is installed
- Procedural Web Audio for the motor, wheels, turns, wall collisions, batteries,
  induction charging, robot whistles, failures, and success
- Localized synthesized execution messages in English and Polish
- English and Polish interface
- Desktop and compact iPhone landscape layouts
- Local progress saved in the browser

## Controls

- `<`, `^`, `>`: add turn-left, forward, and turn-right commands
- `B`: install a battery while standing on an unfinished beacon
- `I`: inductively charge while standing on a charging station (`I1` by default)
- `1`-`4` after `I`: invest 1-4 energy and receive 3, 5, 7, or 9 energy
- `UNDO`: remove the last command
- `CLEAR`: empty the command queue
- `EXECUTE`: run the program
- `RANDOM`: open the procedural generator
- `FREE DRIVE`: disable energy costs and display `NO LIMIT`
- `SHADOW`: preview the programmed route
- `↺`, `↻`: rotate the camera by 90 degrees
- `-`, `+` or the mouse wheel/touchpad: zoom the board
- Click or touch and drag the board to pan the camera
- Keyboard: `L`, `F`, `R`, `B`, `I`, `1`-`4`, arrow keys, `Z` or `Backspace`
  to undo, `Enter` to execute, `C` to clear, and `X` to reset the level

## Local Development

The game has no build step. Start a local server to use the Three.js renderer:

```bash
npm run dev
```

Then open [http://localhost:4173](http://localhost:4173).

RoboNavi uses JavaScript modules, so serve it over HTTP instead of opening
`index.html` directly. The pinned Three.js runtime and its MIT license are
stored in `vendor/three`.

## Tests

```bash
npm test
```

The test suite validates syntax, all campaign reference solutions, terrain
behavior, Dijkstra route counting, A* programs, generated levels, and energy
reserves. GitHub Actions runs it on every push to `main` and on every pull
request.

## Procedural Generator

`RANDOM` creates a new board instead of selecting an existing campaign level.
The generator pipeline:

1. Builds a weighted grid and places thin walls between tiles plus sand terrain.
2. Uses Dijkstra to verify reachability and count shortest routes.
3. Rejects boards below the selected minimum route count.
4. Uses A* over position and robot orientation to find the optimal command
   program.
5. Sets the energy target from the A* result and adds a practical battery
   reserve above that optimum.
6. Stores the seed and search metadata on the generated level for deterministic
   testing.

## Deployment

The public build is served by GitHub Pages:
[xsub.github.io/RoboNavi](https://xsub.github.io/RoboNavi/).

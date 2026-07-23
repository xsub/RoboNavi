# RoboNavi

[![CI](https://github.com/xsub/RoboNavi/actions/workflows/ci.yml/badge.svg)](https://github.com/xsub/RoboNavi/actions/workflows/ci.yml)
[![Play RoboNavi](https://img.shields.io/badge/PLAY-ROBONAVI-83b996?style=for-the-badge)](https://xsub.github.io/RoboNavi/)

RoboNavi is an isometric robot-programming puzzle game for learning sequencing,
planning, and debugging. Build a command queue, predict the route, and then run
the whole program.

**[Play RoboNavi in your browser](https://xsub.github.io/RoboNavi/)**

![RoboNavi gameplay showing the isometric board and robot control panel](docs/robonavi-gameplay.png)

## Features

- 20 hand-authored levels with progressively larger boards
- Forward, left, and right command programming
- Floor, walls, sand, ice, charging stations, and signal beacons
- Optional route preview without a ghost robot
- Energy and execution targets with three-star scoring
- English and Polish interface
- Desktop and mobile layouts
- Local progress saved in the browser

## Controls

- `LEFT`, `FORWARD`, `RIGHT`: add a command
- `UNDO`: remove the last command
- `CLEAR`: empty the command queue
- `EXECUTE`: run the program
- `RANDOM`: load a different random campaign level
- Keyboard: `L`, `F`, `R`, arrow keys, `Backspace`, `Enter`, `C` to clear
  the program, and `X` to reset the level

## Local Development

The game has no build step. Open `index.html` directly or start a local server:

```bash
npm run dev
```

Then open [http://localhost:4173](http://localhost:4173).

## Tests

```bash
npm test
```

The test suite validates syntax, all level reference solutions, energy targets,
terrain behavior, and campaign structure. GitHub Actions runs it on every push
to `main` and on every pull request.

## Roadmap: Procedural Levels

The next campaign mode will generate deterministic levels from a stored seed.
Its validation and scoring pipeline will:

1. Build a weighted state graph that includes position, robot orientation,
   collected beacons, terrain costs, and available energy.
2. Use Dijkstra-based validation to reject generated boards that cannot be
   completed within the energy budget or do not provide at least two viable,
   meaningfully distinct routes.
3. Use A* to calculate the most efficient reference solution for the accepted
   board.
4. Derive energy, execution-count, and three-star thresholds from that reference
   cost, then score the player's program against those targets.
5. Store the seed and reference metadata so every generated challenge can be
   replayed and tested deterministically.

## Deployment

The public build is served by GitHub Pages:
[xsub.github.io/RoboNavi](https://xsub.github.io/RoboNavi/).

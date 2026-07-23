# RoboNavi

[![CI](https://github.com/xsub/RoboNavi/actions/workflows/ci.yml/badge.svg)](https://github.com/xsub/RoboNavi/actions/workflows/ci.yml)
[![Play RoboNavi](https://img.shields.io/badge/PLAY-ROBONAVI-83b996?style=for-the-badge)](https://xsub.github.io/RoboNavi/)

RoboNavi is an isometric robot-programming puzzle game for learning sequencing,
planning, and debugging. Build a command queue, predict the route, and then run
the whole program.

**[Play RoboNavi in your browser](https://xsub.github.io/RoboNavi/)**

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
- Keyboard: `L`, `F`, `R`, arrow keys, `Backspace`, and `Enter`

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

## Deployment

The public build is served by GitHub Pages:
[xsub.github.io/RoboNavi](https://xsub.github.io/RoboNavi/).

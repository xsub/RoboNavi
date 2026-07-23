# RoboNavi

RoboNavi is a small browser-first prototype for a robot-programming puzzle game.
Players queue commands, execute the program, and learn by comparing their plan
with the robot's deterministic movement.

## Play

Open `index.html` in a browser, or run:

```sh
npm run dev
```

Then visit `http://localhost:4173`.

## Controls

- `F`: move forward
- `L`: turn left
- `R`: turn right
- `Enter`: execute
- `Backspace`: undo

The built-in MVP includes fifteen hand-authored levels, energy scoring, one or more
beacons per level, sand, ice, charger tiles, a shadow preview, local progress,
and a top-down mini-map.

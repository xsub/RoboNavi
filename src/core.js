(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RoboNaviCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var DIRECTIONS = ["north", "east", "south", "west"];
  var COMMANDS = ["forward", "turn-left", "turn-right", "battery", "induct"];
  var EPSILON = 0.00001;
  var COSTS = {
    startup: 0.5,
    turn: 0.25,
    collision: 0.5,
    battery: 0
  };
  var TERRAIN = {
    floor: { label: "Floor", cost: 1, passable: true },
    sand: { label: "Sand", cost: 2, passable: true },
    ice: { label: "Ice", cost: 1, passable: true },
    charger: { label: "Charge", cost: 1, passable: true },
    wall: { label: "Wall", cost: Infinity, passable: false }
  };
  var TILE_FROM_CHAR = {
    ".": "floor",
    "#": "wall",
    "s": "sand",
    "i": "ice",
    "c": "charger"
  };
  var DIR_DELTA = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 }
  };
  var DIR_LABEL = {
    north: "N",
    east: "E",
    south: "S",
    west: "W"
  };

  var LEVELS = [
    {
      id: "wake-beacon",
      name: "Wake Beacon",
      subtitle: "A straight path to the first signal.",
      width: 7,
      height: 7,
      energyMax: 8,
      parEnergy: 4,
      parRuns: 1,
      start: { x: 1, y: 5, direction: "north" },
      goals: [{ x: 1, y: 2 }],
      solution: "FFFB",
      grid: [
        "#######",
        "#.....#",
        "#.....#",
        "#.....#",
        "#.....#",
        "#.....#",
        "#######"
      ]
    },
    {
      id: "right-angle",
      name: "Right Angle",
      subtitle: "One corner, one clean route.",
      width: 7,
      height: 7,
      energyMax: 9,
      parEnergy: 7,
      parRuns: 1,
      start: { x: 1, y: 5, direction: "north" },
      goals: [{ x: 4, y: 2 }],
      solution: "FFFRFFFB",
      grid: [
        "#######",
        "#.....#",
        "#.....#",
        "#.....#",
        "#.....#",
        "#.....#",
        "#######"
      ]
    },
    {
      id: "soft-shortcut",
      name: "Soft Shortcut",
      subtitle: "Sand is predictable, but hungry.",
      width: 8,
      height: 8,
      energyMax: 11,
      parEnergy: 10,
      parRuns: 1,
      start: { x: 1, y: 5, direction: "east" },
      goals: [{ x: 6, y: 5 }],
      solution: "FFFFFB",
      grid: [
        "########",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#.ssss.#",
        "#......#",
        "########"
      ]
    },
    {
      id: "ice-slide",
      name: "Ice Slide",
      subtitle: "A tile can move more than expected.",
      width: 7,
      height: 7,
      energyMax: 7,
      parEnergy: 5,
      parRuns: 1,
      start: { x: 1, y: 5, direction: "north" },
      goals: [{ x: 1, y: 1 }],
      solution: "FFB",
      grid: [
        "#######",
        "#.....#",
        "#i....#",
        "#i....#",
        "#.....#",
        "#.....#",
        "#######"
      ]
    },
    {
      id: "outer-maze",
      name: "Outer Maze",
      subtitle: "A wall keeps the simple path honest.",
      width: 8,
      height: 8,
      energyMax: 13,
      parEnergy: 11,
      parRuns: 1,
      start: { x: 1, y: 6, direction: "north" },
      goals: [{ x: 6, y: 1 }],
      solution: "FFFFFRFFFFFB",
      grid: [
        "########",
        "#......#",
        "#.####.#",
        "#.#....#",
        "#.#.##.#",
        "#...#..#",
        "#......#",
        "########"
      ]
    },
    {
      id: "long-corner",
      name: "Long Corner",
      subtitle: "The same turn from a different heading.",
      width: 9,
      height: 9,
      energyMax: 15,
      parEnergy: 13,
      parRuns: 1,
      start: { x: 7, y: 7, direction: "west" },
      goals: [{ x: 1, y: 1 }],
      solution: "FFFFFFRFFFFFFB",
      grid: [
        "#########",
        "#.......#",
        "#.#####.#",
        "#.#...#.#",
        "#.#.#.#.#",
        "#...#...#",
        "#.#####.#",
        "#.......#",
        "#########"
      ]
    },
    {
      id: "two-beacons",
      name: "Two Beacons",
      subtitle: "A route can collect more than one signal.",
      width: 8,
      height: 8,
      energyMax: 13,
      parEnergy: 11,
      parRuns: 1,
      start: { x: 1, y: 6, direction: "north" },
      goals: [
        { x: 1, y: 1 },
        { x: 6, y: 1 }
      ],
      solution: "FFFFFBRFFFFFB",
      grid: [
        "########",
        "#......#",
        "#......#",
        "#.####.#",
        "#......#",
        "#......#",
        "#......#",
        "########"
      ]
    },
    {
      id: "charge-crossing",
      name: "Charge Crossing",
      subtitle: "The station turns a tight plan into a possible one.",
      width: 8,
      height: 8,
      energyMax: 8,
      parEnergy: 15,
      parRuns: 1,
      chargerPower: 4,
      start: { x: 1, y: 6, direction: "east" },
      goals: [{ x: 6, y: 1 }],
      solution: "FFFI4LFFFFFRFFB",
      grid: [
        "########",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#......#",
        "#...c..#",
        "########"
      ]
    },
    {
      id: "ice-rail",
      name: "Ice Rail",
      subtitle: "A short command can cross a long strip.",
      width: 9,
      height: 9,
      energyMax: 9,
      parEnergy: 7,
      parRuns: 1,
      start: { x: 1, y: 2, direction: "east" },
      goals: [{ x: 7, y: 2 }],
      solution: "FFFB",
      grid: [
        "#########",
        "#.......#",
        "#..iii..#",
        "#..#.#..#",
        "#..#.#..#",
        "#..s.s..#",
        "#.......#",
        "#.......#",
        "#########"
      ]
    },
    {
      id: "signal-run",
      name: "Signal Run",
      subtitle: "A quiet perimeter route around rough ground.",
      width: 10,
      height: 10,
      energyMax: 17,
      parEnergy: 15,
      parRuns: 1,
      start: { x: 1, y: 8, direction: "north" },
      goals: [
        { x: 1, y: 1 },
        { x: 8, y: 1 }
      ],
      solution: "FFFFFFFBRFFFFFFFB",
      grid: [
        "##########",
        "#........#",
        "#.####...#",
        "#....#...#",
        "#.ss.#.i.#",
        "#.##.#.i.#",
        "#....#...#",
        "#.c..#...#",
        "#........#",
        "##########"
      ]
    },
    {
      id: "zigzag-relay",
      name: "Zigzag Relay",
      subtitle: "Four signals trace a narrow switching route.",
      width: 11,
      height: 11,
      energyMax: 18,
      parEnergy: 16.25,
      parRuns: 1,
      start: { x: 1, y: 9, direction: "north" },
      goals: [
        { x: 1, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 2 },
        { x: 9, y: 2 }
      ],
      solution: "FFFFBRFFFFBLFFFBRFFFFB",
      grid: [
        "###########",
        "#.........#",
        "#..#......#",
        "#..#..##..#",
        "#..##.....#",
        "#.........#",
        "#.###..#..#",
        "#...#..#..#",
        "#.###.....#",
        "#.........#",
        "###########"
      ]
    },
    {
      id: "sand-divide",
      name: "Sand Divide",
      subtitle: "A long relay where every rough tile matters.",
      width: 12,
      height: 12,
      energyMax: 24,
      parEnergy: 22.25,
      parRuns: 1,
      start: { x: 1, y: 10, direction: "east" },
      goals: [
        { x: 5, y: 10 },
        { x: 5, y: 6 },
        { x: 10, y: 6 },
        { x: 10, y: 1 }
      ],
      solution: "FFFFBLFFFFBRFFFFFBLFFFFFB",
      grid: [
        "############",
        "#..........#",
        "#..##......#",
        "#.....##...#",
        "#.##.......#",
        "#..#...##..#",
        "#.......s..#",
        "#..##......#",
        "#....s..#..#",
        "#..#.......#",
        "#..s..##...#",
        "############"
      ]
    },
    {
      id: "ice-junction",
      name: "Ice Junction",
      subtitle: "Chain three slides and stop on the right cells.",
      width: 12,
      height: 12,
      energyMax: 21,
      parEnergy: 19.25,
      parRuns: 1,
      start: { x: 1, y: 10, direction: "north" },
      goals: [
        { x: 1, y: 4 },
        { x: 5, y: 4 },
        { x: 5, y: 1 },
        { x: 10, y: 1 }
      ],
      solution: "FFBRFBLFBRFFFFFB",
      grid: [
        "############",
        "#..........#",
        "#..#.i.....#",
        "#....i.##..#",
        "#.iii...#..#",
        "#i..##.....#",
        "#i.....##..#",
        "#i.##......#",
        "#i......#..#",
        "#....#.....#",
        "#..........#",
        "############"
      ]
    },
    {
      id: "charge-relay",
      name: "Charge Relay",
      subtitle: "The route is longer than one battery can survive.",
      width: 13,
      height: 13,
      energyMax: 12,
      parEnergy: 27.25,
      parRuns: 1,
      chargerPower: 9,
      start: { x: 1, y: 11, direction: "north" },
      goals: [
        { x: 1, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 2 },
        { x: 11, y: 2 }
      ],
      solution: "FFFFFBRFFFI3I4FFBLFFFFBRFFFFFB",
      grid: [
        "#############",
        "#...........#",
        "#..##.......#",
        "#....#......#",
        "#.##.....#..#",
        "#......##...#",
        "#...c.......#",
        "#...##......#",
        "#......###..#",
        "#.##........#",
        "#.....##....#",
        "#...........#",
        "#############"
      ]
    },
    {
      id: "final-network",
      name: "Final Network",
      subtitle: "A full-system route through every known terrain.",
      width: 14,
      height: 14,
      energyMax: 20,
      parEnergy: 52,
      parRuns: 1,
      chargerPower: 14,
      start: { x: 1, y: 12, direction: "east" },
      goals: [
        { x: 6, y: 8 },
        { x: 2, y: 8 },
        { x: 2, y: 3 },
        { x: 8, y: 3 },
        { x: 8, y: 7 },
        { x: 12, y: 7 }
      ],
      solution: "FFFFFLFFI4I4FFBLFFFFBRFFBRFFFFFFI1I3I4BRFFFFBLFFFFB",
      grid: [
        "##############",
        "#............#",
        "#..###.......#",
        "#....s..c....#",
        "#.i....#.#...#",
        "#.i.##.......#",
        "#.i......#...#",
        "#....#.......#",
        "#......#.....#",
        "#..##........#",
        "#.....c......#",
        "#........##..#",
        "#..s...##....#",
        "##############"
      ]
    },
    {
      id: "orbit-sweep",
      name: "Orbit Sweep",
      subtitle: "Six signals form a wide route around obstacle islands.",
      width: 15,
      height: 15,
      energyMax: 36,
      parEnergy: 34.75,
      parRuns: 1,
      start: { x: 1, y: 13, direction: "north" },
      goals: [
        { x: 1, y: 7 },
        { x: 5, y: 7 },
        { x: 5, y: 3 },
        { x: 10, y: 3 },
        { x: 10, y: 10 },
        { x: 13, y: 10 }
      ],
      solution: "FFFFFFBRFFFFBLFFFFBRFFFFFBRFFFFFFFBLFFFB",
      grid: [
        "###############",
        "#..###...##...#",
        "#........##...#",
        "#......s......#",
        "#..##....#....#",
        "#........#....#",
        "#.........s...#",
        "#..s..........#",
        "#.....##......#",
        "#.............#",
        "#s............#",
        "#..###.....##.#",
        "#..###.....##.#",
        "#.............#",
        "###############"
      ]
    },
    {
      id: "charge-chain",
      name: "Charge Chain",
      subtitle: "Three stations keep a long seven-signal route alive.",
      width: 15,
      height: 15,
      energyMax: 16,
      parEnergy: 57.75,
      parRuns: 1,
      chargerPower: 12,
      start: { x: 1, y: 13, direction: "east" },
      goals: [
        { x: 7, y: 13 },
        { x: 7, y: 8 },
        { x: 2, y: 8 },
        { x: 2, y: 2 },
        { x: 7, y: 2 },
        { x: 12, y: 2 },
        { x: 12, y: 6 }
      ],
      solution: "FFFI4FFFBLFFFFFBLFFFFFBRFI1I3I4I4FFFFFBRFFFFFI4BFFFFFBRFFFFB",
      grid: [
        "###############",
        "#...##........#",
        "#......c......#",
        "#.............#",
        "#........##...#",
        "#...##...##...#",
        "#...##........#",
        "#.c...........#",
        "#.......##....#",
        "#.......##....#",
        "#..##.........#",
        "#..##......##.#",
        "#..........##.#",
        "#...c.........#",
        "###############"
      ]
    },
    {
      id: "ice-weave",
      name: "Ice Weave",
      subtitle: "Link three ice rails without losing the route.",
      width: 16,
      height: 16,
      energyMax: 33,
      parEnergy: 30.5,
      parRuns: 1,
      start: { x: 1, y: 14, direction: "north" },
      goals: [
        { x: 1, y: 8 },
        { x: 7, y: 8 },
        { x: 7, y: 2 },
        { x: 12, y: 2 },
        { x: 12, y: 8 }
      ],
      solution: "FFBRFFBLFFBRFFFFFBRFFFFFFB",
      grid: [
        "################",
        "#..............#",
        "#..##..........#",
        "#..##..i.......#",
        "#......i..##...#",
        "#..##..i..##...#",
        "#..##..i.......#",
        "#..............#",
        "#..iiii..##....#",
        "#i.......##....#",
        "#i.###.......###",
        "#i.###.......###",
        "#i......###....#",
        "#.......###....#",
        "#..............#",
        "################"
      ]
    },
    {
      id: "sand-matrix",
      name: "Sand Matrix",
      subtitle: "Choose carefully across a field of costly shortcuts.",
      width: 16,
      height: 16,
      energyMax: 50,
      parEnergy: 48,
      parRuns: 1,
      start: { x: 1, y: 14, direction: "east" },
      goals: [
        { x: 6, y: 14 },
        { x: 6, y: 10 },
        { x: 11, y: 10 },
        { x: 11, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 1 },
        { x: 14, y: 1 }
      ],
      solution: "FFFFFBLFFFFBRFFFFFBLFFFFFBLFFFFFFFBRFFFFBRFFFFFFFFFFB",
      grid: [
        "################",
        "#..............#",
        "#.##...##......#",
        "#.##s..##...##.#",
        "#...........##.#",
        "#.......s......#",
        "#.....##.......#",
        "#.###.##.......#",
        "#.###......s...#",
        "#..............#",
        "#.......s......#",
        "#..............#",
        "#.....s.##..####",
        "#.......##..####",
        "#..s...........#",
        "################"
      ]
    },
    {
      id: "grand-tour",
      name: "Grand Tour",
      subtitle: "Eight beacons, three chargers, ice, and sand in one final system test.",
      width: 16,
      height: 16,
      energyMax: 20,
      parEnergy: 68.25,
      parRuns: 1,
      chargerPower: 15,
      start: { x: 1, y: 14, direction: "north" },
      goals: [
        { x: 1, y: 9 },
        { x: 5, y: 9 },
        { x: 5, y: 4 },
        { x: 11, y: 4 },
        { x: 11, y: 11 },
        { x: 6, y: 11 },
        { x: 6, y: 14 },
        { x: 14, y: 14 }
      ],
      solution: "FFFI4FFBRFFFFBLFFBRFFFI4FFFBRFFFFI2I4I4I4FFFBRFFFFFBLFFFBLFFFFFFFFB",
      grid: [
        "################",
        "#......###.....#",
        "#.##...###..####",
        "#.##........####",
        "#.......c.s....#",
        "#.##.i.........#",
        "#.##.i..##.....#",
        "#....i..##.....#",
        "#..........c...#",
        "#............###",
        "#............###",
        "#c###........###",
        "#.###...##.....#",
        "#.......##.....#",
        "#..............#",
        "################"
      ]
    }
  ];

  function roundEnergy(value) {
    return Math.round(value * 100) / 100;
  }

  function cloneState(state) {
    return {
      x: state.x,
      y: state.y,
      direction: state.direction,
      energyRemaining: state.energyRemaining,
      energySpent: state.energySpent,
      collected: state.collected || 0
    };
  }

  function createInitialState(level) {
    return {
      x: level.start.x,
      y: level.start.y,
      direction: level.start.direction,
      energyRemaining: level.energyMax,
      energySpent: 0,
      collected: 0
    };
  }

  function commandType(command) {
    return typeof command === "string" ? command : command && command.type;
  }

  function normalizeCommand(command) {
    var value = commandType(command);
    if (value === "F") return "forward";
    if (value === "L") return "turn-left";
    if (value === "R") return "turn-right";
    if (value === "B") return "battery";
    if (value === "I") value = "induct";
    if (COMMANDS.indexOf(value) === -1) {
      throw new Error("Unknown command: " + value);
    }
    if (value === "induct") {
      var amount =
        typeof command === "object" && command
          ? Number(command.amount)
          : 1;
      return {
        type: "induct",
        amount: Math.max(1, Math.min(4, Math.floor(amount) || 1))
      };
    }
    return value;
  }

  function parseProgram(program) {
    var source = String(program || "").toUpperCase().replace(/\s+/g, "");
    var commands = [];
    for (var index = 0; index < source.length; index += 1) {
      var char = source[index];
      if (char === "I") {
        var amount = Number(source[index + 1]);
        if (amount >= 1 && amount <= 4) {
          index += 1;
        } else {
          amount = 1;
        }
        commands.push({ type: "induct", amount: amount });
      } else {
        commands.push(normalizeCommand(char));
      }
    }
    return commands;
  }

  function commandToken(command) {
    var normalized = normalizeCommand(command);
    var type = commandType(normalized);
    if (type === "induct") return "I" + normalized.amount;
    if (type === "battery") return "B";
    if (normalized === "forward") return "F";
    if (normalized === "turn-left") return "L";
    return "R";
  }

  function turn(direction, amount) {
    var index = DIRECTIONS.indexOf(direction);
    return DIRECTIONS[(index + amount + DIRECTIONS.length) % DIRECTIONS.length];
  }

  function inside(level, x, y) {
    return x >= 0 && y >= 0 && x < level.width && y < level.height;
  }

  function terrainAt(level, x, y) {
    if (!inside(level, x, y)) return "wall";
    var char = level.grid[y][x];
    return TILE_FROM_CHAR[char] || "floor";
  }

  function canEnter(level, x, y) {
    return TERRAIN[terrainAt(level, x, y)].passable;
  }

  function spend(state, amount) {
    if (state.energyRemaining + EPSILON < amount) {
      state.energySpent = roundEnergy(state.energySpent + state.energyRemaining);
      state.energyRemaining = 0;
      return false;
    }
    state.energyRemaining = roundEnergy(state.energyRemaining - amount);
    state.energySpent = roundEnergy(state.energySpent + amount);
    return true;
  }

  function collectAt(level, state) {
    var newlyCollected = [];
    level.goals.forEach(function (goal, index) {
      var mask = 1 << index;
      if ((state.collected & mask) === 0 && goal.x === state.x && goal.y === state.y) {
        state.collected |= mask;
        newlyCollected.push(index);
      }
    });
    return newlyCollected;
  }

  function isComplete(level, state) {
    var allMask = (1 << level.goals.length) - 1;
    return (state.collected & allMask) === allMask;
  }

  function enterCell(level, state, x, y) {
    var terrain = terrainAt(level, x, y);
    var cost = TERRAIN[terrain].cost;
    if (!spend(state, cost)) {
      return { entered: false, terrain: terrain, cost: cost, collected: [], recharged: 0 };
    }
    state.x = x;
    state.y = y;
    return {
      entered: true,
      terrain: terrain,
      cost: cost,
      collected: [],
      recharged: 0
    };
  }

  function moveForward(level, state, commandIndex) {
    var event = {
      commandIndex: commandIndex,
      command: "forward",
      from: cloneState(state),
      before: cloneState(state),
      after: null,
      path: [],
      cost: 0,
      collected: [],
      recharged: 0,
      blockedAt: null,
      status: "ok"
    };
    var delta = DIR_DELTA[state.direction];
    var nextX = state.x + delta.x;
    var nextY = state.y + delta.y;

    if (!canEnter(level, nextX, nextY)) {
      event.blockedAt = { x: nextX, y: nextY };
      event.cost = Math.min(COSTS.collision, state.energyRemaining);
      spend(state, COSTS.collision);
      event.status = "collision";
      event.after = cloneState(state);
      return event;
    }

    while (true) {
      var entered = enterCell(level, state, nextX, nextY);
      if (!entered.entered) {
        event.blockedAt = { x: nextX, y: nextY };
        event.status = "out-of-energy";
        event.after = cloneState(state);
        return event;
      }

      event.cost = roundEnergy(event.cost + entered.cost);
      event.recharged = roundEnergy(event.recharged + entered.recharged);
      event.collected = event.collected.concat(entered.collected);
      event.path.push({
        x: state.x,
        y: state.y,
        terrain: entered.terrain,
        cost: entered.cost
      });

      if (terrainAt(level, state.x, state.y) !== "ice") {
        break;
      }

      nextX = state.x + delta.x;
      nextY = state.y + delta.y;
      if (!canEnter(level, nextX, nextY)) {
        break;
      }
    }

    if (isComplete(level, state)) {
      event.status = "complete";
    }
    event.after = cloneState(state);
    return event;
  }

  function turnRobot(level, state, command, commandIndex) {
    var event = {
      commandIndex: commandIndex,
      command: command,
      from: cloneState(state),
      before: cloneState(state),
      after: null,
      path: [],
      cost: COSTS.turn,
      collected: [],
      recharged: 0,
      blockedAt: null,
      status: "ok"
    };
    if (!spend(state, COSTS.turn)) {
      event.status = "out-of-energy";
      event.after = cloneState(state);
      return event;
    }
    state.direction = turn(state.direction, command === "turn-left" ? -1 : 1);
    if (isComplete(level, state)) {
      event.status = "complete";
    }
    event.after = cloneState(state);
    return event;
  }

  function batteryAction(level, state, commandIndex) {
    var event = {
      commandIndex: commandIndex,
      command: "battery",
      from: cloneState(state),
      before: cloneState(state),
      after: null,
      path: [],
      cost: COSTS.battery,
      collected: [],
      recharged: 0,
      blockedAt: null,
      status: "ok",
      invalidReason: null
    };
    event.collected = collectAt(level, state);
    if (event.collected.length === 0) {
      event.status = "invalid-action";
      event.invalidReason = "battery";
    } else if (isComplete(level, state)) {
      event.status = "complete";
    }
    event.after = cloneState(state);
    return event;
  }

  function inductOutput(amount) {
    return amount * 2 + 1;
  }

  function inductAction(level, state, command, commandIndex) {
    var amount = command.amount;
    var event = {
      commandIndex: commandIndex,
      command: "induct",
      inductAmount: amount,
      inductOutput: inductOutput(amount),
      from: cloneState(state),
      before: cloneState(state),
      after: null,
      path: [],
      cost: amount,
      collected: [],
      recharged: 0,
      blockedAt: null,
      status: "ok",
      invalidReason: null
    };

    if (terrainAt(level, state.x, state.y) !== "charger") {
      event.status = "invalid-action";
      event.invalidReason = "induct";
      event.after = cloneState(state);
      return event;
    }
    if (!spend(state, amount)) {
      event.status = "out-of-energy";
      event.after = cloneState(state);
      return event;
    }

    var beforeRecharge = state.energyRemaining;
    state.energyRemaining = roundEnergy(
      Math.min(level.energyMax, state.energyRemaining + event.inductOutput)
    );
    event.recharged = roundEnergy(state.energyRemaining - beforeRecharge);
    event.after = cloneState(state);
    return event;
  }

  function minimumMovementEnergy(level, state) {
    var currentDirection = DIRECTIONS.indexOf(state.direction);
    var minimum = Infinity;

    DIRECTIONS.forEach(function (direction, directionIndex) {
      var delta = DIR_DELTA[direction];
      var nextX = state.x + delta.x;
      var nextY = state.y + delta.y;
      if (!canEnter(level, nextX, nextY)) return;

      var clockwiseTurns =
        (directionIndex - currentDirection + DIRECTIONS.length) % DIRECTIONS.length;
      var turns = Math.min(clockwiseTurns, DIRECTIONS.length - clockwiseTurns);
      var terrainCost = TERRAIN[terrainAt(level, nextX, nextY)].cost;
      minimum = Math.min(
        minimum,
        COSTS.startup + turns * COSTS.turn + terrainCost
      );
    });

    return minimum;
  }

  function simulate(level, commands, startState) {
    var state = startState ? cloneState(startState) : createInitialState(level);
    var events = [];
    var normalized = commands.map(normalizeCommand);

    if (normalized.length > 0) {
      if (!spend(state, COSTS.startup)) {
        return {
          finalState: cloneState(state),
          events: [
            {
              commandIndex: -1,
              command: "startup",
              from: cloneState(state),
              before: cloneState(state),
              after: cloneState(state),
              path: [],
              cost: COSTS.startup,
              collected: [],
              recharged: 0,
              blockedAt: null,
              status: "out-of-energy"
            }
          ],
          completed: false,
          stoppedReason: "out-of-energy"
        };
      }
    }

    for (var index = 0; index < normalized.length; index += 1) {
      var command = normalized[index];
      var type = commandType(command);
      var event;
      if (type === "forward") {
        event = moveForward(level, state, index);
      } else if (type === "turn-left" || type === "turn-right") {
        event = turnRobot(level, state, type, index);
      } else if (type === "battery") {
        event = batteryAction(level, state, index);
      } else {
        event = inductAction(level, state, command, index);
      }
      events.push(event);

      if (
        event.status === "collision" ||
        event.status === "out-of-energy" ||
        event.status === "invalid-action"
      ) {
        return {
          finalState: cloneState(state),
          events: events,
          completed: false,
          stoppedReason: event.status
        };
      }
      if (event.status === "complete") {
        return {
          finalState: cloneState(state),
          events: events,
          completed: true,
          stoppedReason: "complete"
        };
      }
    }

    var completed = isComplete(level, state);
    var nextMovementCost = minimumMovementEnergy(level, state);
    var canInduct =
      terrainAt(level, state.x, state.y) === "charger" &&
      state.energyRemaining + EPSILON >= 1;
    var movementDepleted =
      normalized.length > 0 &&
      nextMovementCost !== Infinity &&
      !canInduct &&
      state.energyRemaining + EPSILON < nextMovementCost;

    return {
      finalState: cloneState(state),
      events: events,
      completed: completed,
      stoppedReason: completed
        ? "complete"
        : movementDepleted
          ? "out-of-energy"
          : "program-ended"
    };
  }

  function scoreCompletion(level, finalState, runCount) {
    if (!isComplete(level, finalState)) return 0;
    var stars = 1;
    if (finalState.energySpent <= level.parEnergy + EPSILON) stars += 1;
    if (runCount <= level.parRuns) stars += 1;
    return stars;
  }

  function validateLevel(level) {
    if (level.grid.length !== level.height) {
      throw new Error(level.id + " has invalid grid height");
    }
    level.grid.forEach(function (row) {
      if (row.length !== level.width) {
        throw new Error(level.id + " has invalid grid width");
      }
    });
    if (!canEnter(level, level.start.x, level.start.y)) {
      throw new Error(level.id + " starts on a blocked tile");
    }
    level.goals.forEach(function (goal) {
      if (!canEnter(level, goal.x, goal.y)) {
        throw new Error(level.id + " has a blocked goal");
      }
    });
    return true;
  }

  LEVELS.forEach(validateLevel);

  return {
    COMMANDS: COMMANDS,
    COSTS: COSTS,
    DIR_DELTA: DIR_DELTA,
    DIR_LABEL: DIR_LABEL,
    DIRECTIONS: DIRECTIONS,
    LEVELS: LEVELS,
    TERRAIN: TERRAIN,
    canEnter: canEnter,
    cloneState: cloneState,
    commandType: commandType,
    commandToken: commandToken,
    createInitialState: createInitialState,
    inductOutput: inductOutput,
    isComplete: isComplete,
    normalizeCommand: normalizeCommand,
    parseProgram: parseProgram,
    scoreCompletion: scoreCompletion,
    simulate: simulate,
    terrainAt: terrainAt,
    turn: turn,
    validateLevel: validateLevel
  };
});

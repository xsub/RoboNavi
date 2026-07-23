(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./core"));
  } else {
    root.RoboNaviGenerator = factory(root.RoboNaviCore);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (core) {
  "use strict";

  var EPSILON = 0.00001;
  var DENSITIES = {
    relaxed: { walls: 0.1, sand: 0.04 },
    balanced: { walls: 0.16, sand: 0.06 },
    dense: { walls: 0.22, sand: 0.08 }
  };

  function MinHeap() {
    this.items = [];
  }

  MinHeap.prototype.push = function (item) {
    var items = this.items;
    items.push(item);
    var index = items.length - 1;
    while (index > 0) {
      var parent = Math.floor((index - 1) / 2);
      if (items[parent].priority <= item.priority) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = item;
  };

  MinHeap.prototype.pop = function () {
    var items = this.items;
    if (items.length === 0) return null;
    var first = items[0];
    var last = items.pop();
    if (items.length === 0) return first;

    var index = 0;
    while (true) {
      var left = index * 2 + 1;
      var right = left + 1;
      if (left >= items.length) break;
      var child =
        right < items.length && items[right].priority < items[left].priority
          ? right
          : left;
      if (items[child].priority >= last.priority) break;
      items[index] = items[child];
      index = child;
    }
    items[index] = last;
    return first;
  };

  function createRng(seed) {
    var value = (Number(seed) || 1) >>> 0;
    return function () {
      value += 0x6d2b79f5;
      var result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cellKey(x, y) {
    return x + "," + y;
  }

  function stateKey(x, y, direction) {
    return x + "," + y + "," + direction;
  }

  function roundQuarter(value) {
    return Math.ceil((value - EPSILON) * 4) / 4;
  }

  function dijkstra(level, start, goal, routeLimit) {
    var distances = {};
    var routeCounts = {};
    var queue = new MinHeap();
    var startKey = cellKey(start.x, start.y);
    var limit = Math.max(1, Number(routeLimit) || 10000);
    var visited = 0;

    distances[startKey] = 0;
    routeCounts[startKey] = 1;
    queue.push({ x: start.x, y: start.y, cost: 0, priority: 0 });

    while (queue.items.length > 0) {
      var current = queue.pop();
      var currentKey = cellKey(current.x, current.y);
      if (current.cost > distances[currentKey] + EPSILON) continue;
      visited += 1;

      core.DIRECTIONS.forEach(function (direction) {
        var delta = core.DIR_DELTA[direction];
        var nextX = current.x + delta.x;
        var nextY = current.y + delta.y;
        if (!core.canEnter(level, nextX, nextY)) return;

        var terrain = core.terrainAt(level, nextX, nextY);
        var nextCost = current.cost + core.TERRAIN[terrain].cost;
        var nextKey = cellKey(nextX, nextY);
        var known = distances[nextKey];

        if (known === undefined || nextCost < known - EPSILON) {
          distances[nextKey] = nextCost;
          routeCounts[nextKey] = routeCounts[currentKey];
          queue.push({
            x: nextX,
            y: nextY,
            cost: nextCost,
            priority: nextCost
          });
        } else if (Math.abs(nextCost - known) <= EPSILON) {
          routeCounts[nextKey] = Math.min(
            limit,
            (routeCounts[nextKey] || 0) + routeCounts[currentKey]
          );
        }
      });
    }

    var goalKey = cellKey(goal.x, goal.y);
    return {
      reachable: distances[goalKey] !== undefined,
      distance: distances[goalKey] === undefined ? Infinity : distances[goalKey],
      routeCount: routeCounts[goalKey] || 0,
      routeLimit: limit,
      visited: visited
    };
  }

  function heuristic(x, y, goal) {
    return Math.abs(goal.x - x) + Math.abs(goal.y - y);
  }

  function forwardTransition(level, state) {
    var delta = core.DIR_DELTA[state.direction];
    var nextX = state.x + delta.x;
    var nextY = state.y + delta.y;
    if (!core.canEnter(level, nextX, nextY)) return null;

    var cost = 0;
    var x = state.x;
    var y = state.y;
    while (core.canEnter(level, nextX, nextY)) {
      x = nextX;
      y = nextY;
      var terrain = core.terrainAt(level, x, y);
      cost += core.TERRAIN[terrain].cost;
      if (terrain !== "ice") break;
      nextX = x + delta.x;
      nextY = y + delta.y;
    }

    return {
      x: x,
      y: y,
      direction: state.direction,
      command: "forward",
      cost: cost
    };
  }

  function reconstructProgram(cameFrom, goalKey) {
    var commands = [];
    var key = goalKey;
    while (cameFrom[key]) {
      commands.push(cameFrom[key].command);
      key = cameFrom[key].previous;
    }
    commands.reverse();
    return commands;
  }

  function aStar(level, start, goal) {
    var queue = new MinHeap();
    var costs = {};
    var cameFrom = {};
    var startKey = stateKey(start.x, start.y, start.direction);
    var visited = 0;

    costs[startKey] = 0;
    queue.push({
      x: start.x,
      y: start.y,
      direction: start.direction,
      cost: 0,
      priority: heuristic(start.x, start.y, goal)
    });

    while (queue.items.length > 0) {
      var current = queue.pop();
      var currentKey = stateKey(current.x, current.y, current.direction);
      if (current.cost > costs[currentKey] + EPSILON) continue;
      visited += 1;

      if (current.x === goal.x && current.y === goal.y) {
        var commands = reconstructProgram(cameFrom, currentKey);
        commands.push("battery");
        return {
          found: true,
          commands: commands,
          solution: commands.map(core.commandToken).join(""),
          movementEnergy: current.cost,
          energy: current.cost + core.COSTS.startup + core.COSTS.battery,
          visited: visited
        };
      }

      var neighbors = [
        {
          x: current.x,
          y: current.y,
          direction: core.turn(current.direction, -1),
          command: "turn-left",
          cost: core.COSTS.turn
        },
        {
          x: current.x,
          y: current.y,
          direction: core.turn(current.direction, 1),
          command: "turn-right",
          cost: core.COSTS.turn
        },
        forwardTransition(level, current)
      ];

      neighbors.forEach(function (next) {
        if (!next) return;
        var nextKey = stateKey(next.x, next.y, next.direction);
        var nextCost = current.cost + next.cost;
        if (costs[nextKey] !== undefined && nextCost >= costs[nextKey] - EPSILON) {
          return;
        }

        costs[nextKey] = nextCost;
        cameFrom[nextKey] = {
          previous: currentKey,
          command: next.command
        };
        queue.push({
          x: next.x,
          y: next.y,
          direction: next.direction,
          cost: nextCost,
          priority: nextCost + heuristic(next.x, next.y, goal)
        });
      });
    }

    return {
      found: false,
      commands: [],
      solution: "",
      movementEnergy: Infinity,
      energy: Infinity,
      visited: visited
    };
  }

  function shuffledCopy(values, rng) {
    var result = values.slice();
    for (var index = result.length - 1; index > 0; index -= 1) {
      var swap = Math.floor(rng() * (index + 1));
      var current = result[index];
      result[index] = result[swap];
      result[swap] = current;
    }
    return result;
  }

  function oppositeCorners(size, rng) {
    var pairs = [
      [{ x: 1, y: size - 2 }, { x: size - 2, y: 1 }],
      [{ x: size - 2, y: size - 2 }, { x: 1, y: 1 }],
      [{ x: 1, y: 1 }, { x: size - 2, y: size - 2 }],
      [{ x: size - 2, y: 1 }, { x: 1, y: size - 2 }]
    ];
    return pairs[Math.floor(rng() * pairs.length)];
  }

  function inwardDirections(point, size) {
    var directions = [];
    directions.push(point.x === 1 ? "east" : "west");
    directions.push(point.y === 1 ? "south" : "north");
    return directions;
  }

  function isProtectedCell(x, y, points) {
    return points.some(function (point) {
      return Math.abs(point.x - x) + Math.abs(point.y - y) <= 1;
    });
  }

  function buildCandidate(size, density, rng) {
    var pair = oppositeCorners(size, rng);
    var startPoint = pair[0];
    var goal = pair[1];
    var protectedPoints = [startPoint, goal];
    var rows = [];

    for (var y = 0; y < size; y += 1) {
      var row = "";
      for (var x = 0; x < size; x += 1) {
        if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
          row += "#";
        } else if (!isProtectedCell(x, y, protectedPoints) && rng() < density.walls) {
          row += "#";
        } else {
          row += ".";
        }
      }
      rows.push(row);
    }

    rows = rows.map(function (row, y) {
      return row
        .split("")
        .map(function (cell, x) {
          if (
            cell === "." &&
            !isProtectedCell(x, y, protectedPoints) &&
            rng() < density.sand
          ) {
            return "s";
          }
          return cell;
        })
        .join("");
    });

    var starts = shuffledCopy(inwardDirections(startPoint, size), rng);
    return {
      width: size,
      height: size,
      start: {
        x: startPoint.x,
        y: startPoint.y,
        direction: starts[0]
      },
      goals: [goal],
      grid: rows
    };
  }

  function normalizeOptions(options) {
    var source = options || {};
    var size = [9, 11, 13].indexOf(Number(source.size)) === -1 ? 11 : Number(source.size);
    var density = DENSITIES[source.density] ? source.density : "balanced";
    return {
      size: size,
      density: density,
      minSolutions: Math.max(1, Math.min(8, Math.floor(Number(source.minSolutions) || 2))),
      maxAttempts: Math.max(10, Math.floor(Number(source.maxAttempts) || 160)),
      seed:
        source.seed === undefined
          ? ((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0)
          : (Number(source.seed) >>> 0)
    };
  }

  function finalizeLevel(candidate, options, seed, attempt, dijkstraResult, aStarResult) {
    var optimalEnergy = roundQuarter(aStarResult.energy);
    var safetyMargin = Math.max(3, optimalEnergy * 0.3);
    var energyMax = roundQuarter(optimalEnergy + safetyMargin);
    var id = "generated-" + seed;

    var level = {
      id: id,
      generated: true,
      name: "Generated map",
      subtitle: "A fresh route verified by Dijkstra and A*.",
      width: candidate.width,
      height: candidate.height,
      energyMax: energyMax,
      parEnergy: optimalEnergy,
      parRuns: 1,
      start: candidate.start,
      goals: candidate.goals,
      solution: aStarResult.solution,
      grid: candidate.grid,
      generation: {
        seed: seed,
        attempt: attempt,
        size: options.size,
        density: options.density,
        minSolutions: options.minSolutions,
        routeCount: dijkstraResult.routeCount,
        routeLimit: dijkstraResult.routeLimit,
        dijkstraCost: dijkstraResult.distance,
        dijkstraVisited: dijkstraResult.visited,
        optimalEnergy: optimalEnergy,
        optimalCommands: aStarResult.commands.length,
        aStarVisited: aStarResult.visited
      }
    };

    core.validateLevel(level);
    var verification = core.simulate(level, aStarResult.commands);
    if (!verification.completed) {
      throw new Error("A* reference program did not complete the generated level");
    }
    return level;
  }

  function generateLevel(options) {
    var normalized = normalizeOptions(options);
    var rng = createRng(normalized.seed);
    var density = DENSITIES[normalized.density];
    var routeLimit = Math.max(10000, normalized.minSolutions);

    for (var attempt = 1; attempt <= normalized.maxAttempts; attempt += 1) {
      var candidate = buildCandidate(normalized.size, density, rng);
      var dijkstraResult = dijkstra(
        candidate,
        candidate.start,
        candidate.goals[0],
        routeLimit
      );
      if (
        !dijkstraResult.reachable ||
        dijkstraResult.routeCount < normalized.minSolutions
      ) {
        continue;
      }

      var aStarResult = aStar(candidate, candidate.start, candidate.goals[0]);
      if (!aStarResult.found) continue;
      return finalizeLevel(
        candidate,
        normalized,
        normalized.seed,
        attempt,
        dijkstraResult,
        aStarResult
      );
    }

    var fallbackDensity = { walls: 0, sand: 0 };
    var fallback = buildCandidate(normalized.size, fallbackDensity, rng);
    var fallbackDijkstra = dijkstra(
      fallback,
      fallback.start,
      fallback.goals[0],
      routeLimit
    );
    var fallbackAStar = aStar(fallback, fallback.start, fallback.goals[0]);
    if (
      fallbackDijkstra.routeCount < normalized.minSolutions ||
      !fallbackAStar.found
    ) {
      throw new Error("Unable to generate a level with the requested route count");
    }
    return finalizeLevel(
      fallback,
      normalized,
      normalized.seed,
      normalized.maxAttempts + 1,
      fallbackDijkstra,
      fallbackAStar
    );
  }

  return {
    DENSITIES: DENSITIES,
    aStar: aStar,
    createRng: createRng,
    dijkstra: dijkstra,
    generateLevel: generateLevel,
    normalizeOptions: normalizeOptions
  };
});

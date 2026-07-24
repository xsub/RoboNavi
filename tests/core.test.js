const assert = require("assert");
const core = require("../src/core");

assert.strictEqual(core.LEVELS.length, 20, "the campaign should contain 20 levels");

core.LEVELS.forEach((level) => {
  const result = core.simulate(level, core.parseProgram(level.solution));
  assert.strictEqual(
    result.completed,
    true,
    `${level.id} should be completed by its reference solution`
  );
  assert(
    result.finalState.energySpent <= level.parEnergy + 0.00001,
    `${level.id} reference solution should meet the energy target`
  );
});

core.LEVELS.slice(10).forEach((level) => {
  let passable = 0;
  let junctions = 0;

  for (let y = 1; y < level.height - 1; y += 1) {
    for (let x = 1; x < level.width - 1; x += 1) {
      if (!core.canEnter(level, x, y)) continue;
      passable += 1;
      const exits = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ].filter(([dx, dy]) => core.canEnter(level, x + dx, y + dy)).length;
      if (exits >= 3) junctions += 1;
    }
  }

  assert(
    junctions >= passable * 0.25,
    `${level.id} should be an open arena with route choices, not a single corridor`
  );
});

{
  const level = core.LEVELS.find((entry) => entry.id === "ice-slide");
  const result = core.simulate(level, core.parseProgram("FF"));
  assert.deepStrictEqual(
    result.events[1].path.map((point) => [point.x, point.y]),
    [
      [1, 3],
      [1, 2],
      [1, 1]
    ],
    "ice should slide until the next non-ice tile"
  );
}

{
  const level = core.LEVELS[0];
  const result = core.simulate(level, core.parseProgram("LFF"));
  assert.strictEqual(core.terrainAt(level, 0, level.start.y), "floor");
  assert.strictEqual(
    core.canMove(level, level.start.x, level.start.y, 0, level.start.y),
    true,
    "a former wall block should now be a playable floor tile"
  );
  assert.strictEqual(result.stoppedReason, "collision");
  assert.strictEqual(result.finalState.x, 0);
  assert.strictEqual(result.finalState.y, level.start.y);
}

{
  const level = {
    id: "edge-wall-test",
    width: 5,
    height: 5,
    energyMax: 10,
    parEnergy: 10,
    parRuns: 1,
    start: { x: 1, y: 2, direction: "east" },
    goals: [{ x: 3, y: 2 }],
    grid: [
      ".....",
      ".....",
      ".....",
      ".....",
      "....."
    ],
    walls: [{ axis: "vertical", x: 2, y: 2 }]
  };
  core.validateLevel(level);
  assert.strictEqual(core.canEnter(level, 2, 2), true);
  assert.strictEqual(core.canMove(level, 1, 2, 2, 2), false);
  assert.deepStrictEqual(
    core.wallBetween(level, 1, 2, 2, 2),
    { axis: "vertical", x: 2, y: 2 }
  );
  const result = core.simulate(level, core.parseProgram("F"));
  assert.strictEqual(result.stoppedReason, "collision");
  assert.strictEqual(result.finalState.x, 1);
  assert.strictEqual(result.finalState.y, 2);
}

{
  const level = core.LEVELS[0];
  const arrival = core.simulate(level, core.parseProgram("FFF"));
  assert.strictEqual(
    arrival.finalState.collected,
    0,
    "entering a beacon should not install its battery automatically"
  );
  assert.strictEqual(arrival.completed, false);

  const installation = core.simulate(
    level,
    core.parseProgram("B"),
    arrival.finalState
  );
  assert.strictEqual(installation.completed, true);
  assert.deepStrictEqual(installation.events[0].collected, [0]);
}

{
  const level = core.LEVELS[0];
  const result = core.simulate(level, core.parseProgram("B"));
  assert.strictEqual(result.stoppedReason, "invalid-action");
  assert.strictEqual(result.events[0].invalidReason, "battery");
}

{
  const level = {
    id: "induct-test",
    width: 5,
    height: 5,
    energyMax: 20,
    start: { x: 2, y: 2, direction: "north" },
    goals: [{ x: 1, y: 1 }],
    grid: [
      "#####",
      "#...#",
      "#.c.#",
      "#...#",
      "#####"
    ]
  };

  [1, 2, 3, 4].forEach((amount) => {
    const startState = {
      ...core.createInitialState(level),
      energyRemaining: 10
    };
    const result = core.simulate(
      level,
      [{ type: "induct", amount }],
      startState
    );
    const event = result.events[0];
    assert.strictEqual(event.inductOutput, amount * 2 + 1);
    assert.strictEqual(event.recharged, amount * 2 + 1);
    assert.strictEqual(result.finalState.energyRemaining, 10.5 + amount);
    assert.strictEqual(result.finalState.energySpent, 0.5 + amount);
  });

  assert.deepStrictEqual(
    core.parseProgram("BI2I").map(core.commandToken),
    ["B", "I2", "I1"]
  );
}

{
  const level = core.LEVELS[0];
  const result = core.simulate(
    level,
    [{ type: "induct", amount: 2 }]
  );
  assert.strictEqual(result.stoppedReason, "invalid-action");
  assert.strictEqual(result.events[0].invalidReason, "induct");
}

{
  const level = {
    id: "depleted-after-program",
    width: 5,
    height: 5,
    energyMax: 2,
    start: { x: 2, y: 2, direction: "north" },
    goals: [{ x: 1, y: 1 }],
    grid: [
      "#####",
      "#...#",
      "#...#",
      "#...#",
      "#####"
    ]
  };
  const result = core.simulate(level, core.parseProgram("R"));
  assert.strictEqual(result.finalState.energyRemaining, 1.25);
  assert.strictEqual(
    result.stoppedReason,
    "out-of-energy",
    "a finished program should report depleted energy when no further move is affordable"
  );
}

{
  const level = {
    id: "unlimited-energy-drive",
    width: 5,
    height: 5,
    energyMax: 0.25,
    parEnergy: 4,
    parRuns: 1,
    start: { x: 1, y: 3, direction: "east" },
    goals: [{ x: 2, y: 1 }],
    grid: [
      ".....",
      ".....",
      ".....",
      ".....",
      "....."
    ]
  };
  const commands = core.parseProgram("FLFFB");
  const limited = core.simulate(level, commands);
  const unlimited = core.simulate(
    level,
    commands,
    undefined,
    { unlimitedEnergy: true }
  );

  assert.strictEqual(limited.stoppedReason, "out-of-energy");
  assert.strictEqual(unlimited.completed, true);
  assert.strictEqual(unlimited.finalState.energyRemaining, level.energyMax);
  assert.strictEqual(unlimited.finalState.energySpent, 0);
  unlimited.events.forEach((event) => {
    assert.strictEqual(event.cost, 0);
  });

  const collision = core.simulate(
    level,
    core.parseProgram("LLFF"),
    undefined,
    { unlimitedEnergy: true }
  );
  assert.strictEqual(collision.stoppedReason, "collision");
}

console.log(`Validated ${core.LEVELS.length} RoboNavi levels.`);

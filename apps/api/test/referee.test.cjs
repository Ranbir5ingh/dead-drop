const assert = require("node:assert/strict");
const test = require("node:test");
const { hiderPoints, hunterPoints } = require("@deaddrop/shared");
const { fallbackRiddle } = require("../dist/ai/fallback");
const { NAME_PATTERN, namesMatch } = require("../dist/common/names");
const { parseRiddle, parseVerdict } = require("../dist/ai/parse");
const { leaksObject, scanRiddle } = require("../dist/ai/safety");

test("scoring is 10x for hunters and 5x for hiders", () => {
  assert.equal(hunterPoints(1), 10);
  assert.equal(hunterPoints(2), 20);
  assert.equal(hunterPoints(3), 30);
  assert.equal(hiderPoints(1), 5);
  assert.equal(hiderPoints(3), 15);
});

test("scanner catches addresses, phones, and coordinates", () => {
  assert.deepEqual(scanRiddle("Meet me at 12 King Street tonight."), ["address"]);
  assert.ok(scanRiddle("Call 415-555-0199 when you arrive.").includes("phone"));
  assert.ok(scanRiddle("The pin is 28.61390, 77.20900.").includes("coordinates"));
  assert.ok(scanRiddle("Use plus code CWC8+R9 nearby.").includes("plus-code"));
  assert.ok(scanRiddle("Look up ///filled.count.soap later.").includes("what3words"));
  assert.deepEqual(
    scanRiddle(
      "Where the path keeps company with the water, a pocket-sized sun sits closer to the soil than to the sky.",
    ),
    [],
  );
  assert.deepEqual(scanRiddle("Sector 12 park"), []);
});

test("scanner rejects a verbatim object answer", () => {
  const object = "a smooth stone painted with a yellow sun";
  assert.equal(
    leaksObject(
      "You will find a smooth stone painted with a yellow sun beside the path if you look down carefully today.",
      object,
    ),
    true,
  );
  assert.equal(
    leaksObject(
      "A pocket-sized sun sits closer to the soil than to the sky and it did not roll there by chance at all.",
      object,
    ),
    false,
  );
});

test("JSON parsers are strict", () => {
  const riddle = parseRiddle(
    '```json\n{"riddle":"Somewhere in the garden a small joke waits low and patient for a person who looks twice and leaves it.","difficulty":2,"safetyFlags":[]}\n```',
  );
  assert.equal(riddle?.difficulty, 2);
  assert.equal(parseRiddle('{"riddle":"too short","difficulty":2,"safetyFlags":[]}'), null);
  assert.equal(parseRiddle('{"riddle":"Somewhere in the garden a small joke waits low and patient for a person who looks twice and leaves it.","difficulty":9,"safetyFlags":[]}'), null);
  assert.equal(parseVerdict('{"match":"yes","confidence":1,"reason":"sure"}'), null);
  const verdict = parseVerdict('{"match":true,"confidence":1.4,"reason":"The object is clearly visible."}');
  assert.equal(verdict?.confidence, 1);
  assert.equal(verdict?.match, true);
});

test("fallback riddles never carry an address", () => {
  const draft = fallbackRiddle({
    areaName: "12 King Street",
    objectHint: "a smooth stone painted with a yellow sun",
    variant: 0,
  });
  assert.equal(scanRiddle(draft.riddle).length, 0);
  assert.equal(draft.riddle.includes("12 King Street"), false);
  assert.ok(draft.difficulty === 1 || draft.difficulty === 2 || draft.difficulty === 3);
});

test("display names match without case games", () => {
  assert.equal(namesMatch("Asha", "asha"), true);
  assert.equal(namesMatch("Asha", "Leo"), false);
  assert.equal(NAME_PATTERN.test("Noor"), true);
  assert.equal(NAME_PATTERN.test("4155550199"), false);
});

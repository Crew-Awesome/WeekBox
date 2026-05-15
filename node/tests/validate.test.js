const test = require("node:test");
const assert = require("node:assert/strict");
const { assertObject, assertString } = require("../ipc/validate");
const { ok, fail } = require("../ipc/response");

test("assertString accepts non-empty string", () => {
  assert.doesNotThrow(() => assertString("abc", "field"));
});

test("assertString rejects empty string", () => {
  assert.throws(() => assertString("   ", "field"));
});

test("assertObject accepts plain object", () => {
  assert.doesNotThrow(() => assertObject({ a: 1 }, "payload"));
});

test("assertObject rejects arrays", () => {
  assert.throws(() => assertObject([], "payload"));
});

test("response helpers shape", () => {
  const yes = ok({ a: 1 });
  const no = fail("E", "Nope");
  assert.equal(yes.ok, true);
  assert.equal(no.ok, false);
  assert.equal(no.error.code, "E");
});

import assert from "node:assert/strict";
import test from "node:test";
import { formatEvoBalance } from "../../src/lib/store/balance.ts";

test("a real zero balance is displayed as zero, not a loading/error substitute", () => {
  assert.equal(formatEvoBalance("0"), "0");
  assert.equal(formatEvoBalance("0.0000"), "0");
});
test("large token balances remain exact beyond JavaScript's safe integer range", () => {
  assert.equal(
    formatEvoBalance("9007199254740993123456.75"),
    "9,007,199,254,740,993,123,456.75",
  );
});
test("display truncates rather than rounding up the amount a wallet holds", () => {
  assert.equal(formatEvoBalance("1234.999999999999999999"), "1,234.9999…");
  assert.equal(formatEvoBalance("0.000000000000000001"), "0.0000…");
  assert.equal(formatEvoBalance("1234.5000"), "1,234.5");
});
test("missing, malformed and negative balances are rejected instead of fabricated", () => {
  for (const value of [
    "",
    "-1",
    "NaN",
    "Infinity",
    "1e18",
    " 10",
    "1.",
    ".1",
    "1,000",
  ]) {
    assert.throws(() => formatEvoBalance(value), /Invalid EVO balance/);
  }
});

 test("menu balance rounds to the nearest whole EVO without losing large integer precision", () => {
  assert.equal(formatEvoBalance("1234.499999999999999999", true), "1,234");
  assert.equal(formatEvoBalance("1234.5", true), "1,235");
  assert.equal(formatEvoBalance("999.999", true), "1,000");
  assert.equal(formatEvoBalance("0.000000000000000001", true), "0");
  assert.equal(formatEvoBalance("9007199254740993123456.75", true), "9,007,199,254,740,993,123,457");
 });

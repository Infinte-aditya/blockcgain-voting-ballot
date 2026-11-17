import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

const SOLIDITY_PATH = "smart_contracts/Voting.sol";
const FRONTEND_PATH = "frontend/index.html";

function read(p) {
  return readFileSync(p, "utf8");
}

// Extract declared functions and events from the Solidity source.
function extractSolidityInterface(source) {
  const declared = new Map(); // name => { kind, inputs, mutability, outputs, modifiers }

  const fnRe =
    /function\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(external|public|internal|private)?\s*([^{]*)\{/g;
  let m;
  while ((m = fnRe.exec(source)) !== null) {
    const [, name, inputs, visibility, rest] = m;
    const mutability = /view/.test(rest) ? "view" : /pure/.test(rest) ? "pure" : "nonpayable";
    const modifiers = [];
    if (/onlyAdmin/.test(rest)) modifiers.push("onlyAdmin");
    if (/whenVotingOpen/.test(rest)) modifiers.push("whenVotingOpen");
    declared.set(name, { kind: "function", inputs, visibility, mutability, modifiers });
  }

  // Public state variables auto-generate getter functions (e.g. `address public admin` -> `admin()`).
  const publicVarRe = /^\s*(?:uint|bool|address|string)\s+public\s+([A-Za-z_]\w*)\s*;/gm;
  let v;
  while ((v = publicVarRe.exec(source)) !== null) {
    declared.set(v[1], { kind: "function", inputs: "", visibility: "public", mutability: "view", modifiers: [] });
  }

  const evRe = /event\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g;
  while ((m = evRe.exec(source)) !== null) {
    const [, name, inputs] = m;
    declared.set(name, { kind: "event", inputs });
  }

  return declared;
}

// Parse the frontend's CONTRACT_ABI array entries.
function extractFrontendAbi(html) {
  const blockMatch = html.match(/const\s+CONTRACT_ABI\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(blockMatch, "frontend must define a CONTRACT_ABI array");

  const entries = [];
  const entryRe = /"([^"]*?)"\s*(?:,|$)/g;
  let e;
  while ((e = entryRe.exec(blockMatch[1])) !== null) {
    entries.push(e[1]);
  }
  return entries;
}

function parseAbiEntry(entry) {
  const kind = entry.startsWith("event ") ? "event" : "function";
  const nameMatch = entry.match(/(?:function|event)\s+([A-Za-z_]\w*)/);
  return { kind, name: nameMatch ? nameMatch[1] : null, raw: entry };
}

describe("Static consistency: contract vs frontend", () => {
  it("Voting.sol compiles cleanly by inspection (no solc available offline)", () => {
    const source = read(SOLIDITY_PATH);
    assert.ok(/pragma solidity \^0\.8\.20;/.test(source), "expects pragma ^0.8.20");
    assert.ok(/contract Voting \{/.test(source), "defines contract Voting");
    assert.ok(/address public admin;/.test(source), "declares admin");
    assert.ok(/bool public votingOpen;/.test(source), "declares votingOpen");
    assert.ok(/function vote\(uint _candidateId\)/.test(source), "declares vote(uint)");
    assert.ok(/function getWinner\(\)/.test(source), "declares getWinner()");
    assert.ok(/onlyAdmin/.test(source) && /whenVotingOpen/.test(source), "has access-control modifiers");
  });

  it("every frontend CONTRACT_ABI entry corresponds to a declared contract function/event", () => {
    const contract = extractSolidityInterface(read(SOLIDITY_PATH));
    const abi = extractFrontendAbi(read(FRONTEND_PATH));

    assert.ok(abi.length > 0, "frontend ABI is non-empty");

    for (const raw of abi) {
      const parsed = parseAbiEntry(raw);
      assert.ok(parsed.name, `ABI entry has a name: ${raw}`);
      assert.ok(
        contract.has(parsed.name),
        `frontend ABI references "${parsed.name}" which is not declared in Voting.sol (${raw})`,
      );
    }

    // Key entry points the frontend depends on must be present in both.
    const required = ["admin", "votingOpen", "registerVoter", "setVotingStatus", "vote", "getAllCandidates", "getWinner", "VoteCast"];
    for (const name of required) {
      assert.ok(contract.has(name), `contract declares ${name}`);
      assert.ok(abi.some((r) => parseAbiEntry(r).name === name), `frontend ABI includes ${name}`);
    }
  });

  it("frontend references only DOM ids that exist in index.html", () => {
    const html = read(FRONTEND_PATH);
    const definedIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));

    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    assert.ok(scriptMatch, "index.html contains an inline <script>");
    const script = scriptMatch[1];

    const referencedIds = new Set([...script.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]));

    for (const id of referencedIds) {
      assert.ok(
        definedIds.has(id),
        `frontend JS references undefined DOM id "#${id}"`,
      );
    }

    // The page must load the ethers.js library.
    assert.ok(/ethers\/[\d.]+\/ethers\.umd\.min\.js/.test(html), "includes ethers.js from CDN");
    assert.ok(/CONTRACT_ABI/.test(script), "defines CONTRACT_ABI");
    assert.ok(/new ethers\.Contract\(/.test(script), "instantiates the contract");
  });
});

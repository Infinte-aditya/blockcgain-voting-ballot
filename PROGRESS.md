# Blockcgain Voting Ballot — Progress

## Milestones
- [x] Examined delivered sources (Voting.sol + index.html from smart_contracts.zip)
- [x] Incorporated sources into workspace (smart_contracts/Voting.sol, frontend/index.html)
- [x] Initialized npm + Hardhat project (hardhat.config.js, sources=smart_contracts, tests=test)
- [x] Wrote JS reference implementation of contract logic (test/votingReference.js)
- [x] Wrote exhaustive behaviour test suite (test/Voting.behavior.test.js): 18 tests
- [x] Wrote static consistency tests (test/consistency.test.js): contract vs frontend ABI + DOM ids
- [x] Ran `npm test`: 26 tests, 9 suites, 0 failures
- [x] Ran `npm run lint` (node --check): pass
- [x] Rendered frontend in headless Chromium: DOM dump OK, screenshot saved (/tmp/opencode/ballot.png), no JS errors
- [ ] Compile/deploy Voting.sol on-chain (BLOCKED: no Solidity compiler, no network)
- [ ] End-to-end wallet + live contract flow (BLOCKED: needs deployed contract + injected wallet)

## Commands
- `npm test` — run the behaviour + consistency test suite (offline, passes)
- `npm run lint` — syntax-check JS test files (passes)
- `npx hardhat compile` — compile the Solidity contract (requires solc download; blocked offline)

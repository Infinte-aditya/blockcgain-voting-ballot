# Blockcgain Voting Ballot — Acceptance Criteria

## Smart contract (Voting.sol)

| # | Criterion | Expected behavior | Test performed | Result |
|---|-----------|-------------------|----------------|--------|
| AC-1 | Constructor | Deploys with candidates; deployer = admin; voting closed; `CandidateAdded` per candidate | node:test behavior suite + static source check | PASS (offline mirror) |
| AC-2 | registerVoter | Only admin; sets registered; `VoterRegistered`; reverts if already registered | node:test behavior suite | PASS (offline mirror) |
| AC-3 | registerVotersBulk | Admin registers many; skips already-registered; emits events | node:test behavior suite | PASS (offline mirror) |
| AC-4 | setVotingStatus | Only admin open/close; `VotingStatusChanged` emitted | node:test behavior suite | PASS (offline mirror) |
| AC-5 | vote | Registered voter votes once; counted; `VoteCast`; rejects double/unregistered/closed/invalid id | node:test behavior suite | PASS (offline mirror) |
| AC-6 | getCandidate/getAllCandidates/getTotalCandidates | Correct data and counts | node:test behavior suite | PASS (offline mirror) |
| AC-7 | getWinner | Most-voted candidate; reverts if none; ties -> lowest id | node:test behavior suite | PASS (offline mirror) |
| AC-8 | Access control | Non-admin admin functions revert | node:test behavior suite | PASS (offline mirror) |

> Note: On-chain Solidity compilation/execution is blocked in this environment (no solc, no network — see KNOWN_ISSUES.md KI-01). AC-1..AC-8 are verified against a faithful JS reference implementation of Voting.sol (test/votingReference.js) plus static source checks. Re-run `npx hardhat test` on a machine with solc to confirm on-chain.

## Frontend (frontend/index.html)

| # | Criterion | Expected behavior | Test performed | Result |
|---|-----------|-------------------|----------------|--------|
| AC-9 | File loads | Opens in browser without console errors | Headless Chromium `--dump-dom` + screenshot | PASS |
| AC-10 | Wallet connect | Connects injected wallet; shows address + chain id | Static (DOM ids + script); live needs MetaMask | Verified statically |
| AC-11 | Contract load | Paste deployed address; loads contract; shows admin | Static (CONTRACT_ABI matches contract) | Verified statically |
| AC-12 | Admin UI | Open/close voting + register voter send transactions | Static (DOM ids + ABI + handlers present) | Verified statically |
| AC-13 | Voting UI | Candidate list with counts; Vote casts a vote | Static (DOM ids + ABI) | Verified statically |
| AC-14 | Winner UI | Reveal Current Leader shows leader + votes | Static (DOM ids + ABI) | Verified statically |

> AC-10..AC-14 require a live deployed contract + injected wallet to execute end-to-end (blocked offline — KI-02).

## Quality
- `npm test`: 26 tests, 9 suites, 0 failures — PASS
- `npm run lint` (`node --check test/*.js`): PASS
- Project documents (PROJECT_PLAN.md, ACCEPTANCE_CRITERIA.md, PROGRESS.md, TEST_RESULTS.md, KNOWN_ISSUES.md) exist and reflect final state — PASS

# Blockcgain Voting Ballot — Known Issues

## KI-01: No Solidity compiler available (environment limitation)
- Impact: `npx hardhat compile` cannot run; on-chain deployment and Hardhat-based on-chain tests cannot execute here.
- Cause: no network access to download solc 0.8.20; no `solc` binary installed.
- Workaround: contract correctness verified by inspection + exhaustive JS reference-implementation tests (test/votingReference.js, test/Voting.behavior.test.js) that mirror Voting.sol semantics.
- To complete on-chain: run `npm install` and `npx hardhat compile` on a machine with network/solc, then `npx hardhat test` (Hardhat config present at hardhat.config.js). Deploy via Remix/Hardhat and paste the address into the frontend.

## KI-02: Live wallet + contract flow not end-to-end tested here
- Impact: AC-10..AC-14 (wallet connect, contract load, admin UI, voting UI, winner UI) verified statically (ABI consistency, DOM ids, page loads) but not against a live contract.
- Cause: needs a deployed Voting contract address and an injected wallet (MetaMask), neither available offline.
- To verify manually: open frontend/index.html in a browser with MetaMask, connect a wallet, paste a deployed contract address, and exercise the panels.

## KI-03: Frontend is a single static HTML file (no build step)
- By design (delivered as-is). No bundle/lint tooling for the frontend JS; syntax verified via `node --check` on test files only.

## Design assumptions (documented)
- `getWinner()` ties resolve to the lowest candidate id (strict `>` comparison), matching Voting.sol.
- Candidate set is fixed at deployment; no add/edit/remove candidates post-deploy (matches Voting.sol).
- Deployment is manual (Remix / Hardhat); frontend expects user to paste a deployed address.

# Blockcgain Voting Ballot — Project Plan

## Overview
A decentralized on-chain voting system consisting of:
- `smart_contracts/Voting.sol` — Solidity smart contract (admin creates candidates, registered voters cast exactly one vote each)
- `frontend/index.html` — ethers.js v5 frontend that connects a wallet, loads the contract, and drives admin/voter actions
- `test/` — Hardhat-based test suite exercising the contract against a local Ethereum node

## Source origin
Contract and frontend sources were delivered in `smart_contracts.zip` (Voting.sol + index.html). They have been incorporated into this workspace under `smart_contracts/` and `frontend/`.

## Directory structure
```
blockcgain-voting-ballot/
├── README.md
├── PROJECT_PLAN.md
├── ACCEPTANCE_CRITERIA.md
├── PROGRESS.md
├── TEST_RESULTS.md
├── KNOWN_ISSUES.md
├── package.json
├── hardhat.config.js
├── smart_contracts/
│   └── Voting.sol
├── frontend/
│   └── index.html
└── test/
    └── Voting.test.js
```

## Technical stack
- Solidity ^0.8.20
- Hardhat + hardhat-ethers + ethers.js v5 (local node for testing)
- Vanilla HTML/JS frontend (ethers.js via CDN)

## Assumptions (documented)
- Deployment is manual via Remix/Hardhat; the frontend expects the user to paste a deployed contract address.
- No build step for the frontend (single HTML file opened in a browser with an injected wallet such as MetaMask).
- Tie-breaking in `getWinner()`: the first candidate (lowest id) wins ties (existing contract behavior, preserved).
- Tests run against a local Hardhat node; no live network required.

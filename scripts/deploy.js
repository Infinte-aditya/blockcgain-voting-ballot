import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const CANDIDATE_NAMES = ["Alice", "Bob", "Charlie"];

async function findArtifact() {
  const candidates = [
    path.join("artifacts", "smart_contracts", "Voting.sol", "Voting.json"),
    path.join("artifacts", "contracts", "Voting.sol", "Voting.json"),
    path.join("artifacts", "Voting.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    }
  }
  throw new Error("Could not find Voting contract artifact. Run 'npx hardhat compile' first.");
}

async function main() {
  // Connect to the local Hardhat node (must be running in another terminal)
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // First Hardhat local account (well-known private key for the local node)
  const deployerPk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(deployerPk, provider);

  console.log("Deploying Voting with account:", wallet.address);

  const artifact = await findArtifact();
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const voting = await factory.deploy(CANDIDATE_NAMES);
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("Voting deployed to:", address);
  console.log("Candidates:", CANDIDATE_NAMES);
  console.log("Admin:", wallet.address);
  console.log("");
  console.log("Paste this address into the frontend's Contract panel:");
  console.log("  " + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

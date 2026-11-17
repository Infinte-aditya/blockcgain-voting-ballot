import { ethers } from "hardhat";

const CANDIDATE_NAMES = ["Alice", "Bob", "Charlie"];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Voting with account:", deployer.address);

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(CANDIDATE_NAMES);
  await voting.waitForDeployment();

  const address = await voting.getAddress();
  console.log("Voting deployed to:", address);
  console.log("Candidates:", CANDIDATE_NAMES);
  console.log("Admin:", deployer.address);
  console.log("");
  console.log("Paste this address into the frontend's Contract panel:");
  console.log("  " + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

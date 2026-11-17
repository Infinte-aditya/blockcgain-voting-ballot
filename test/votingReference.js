// Reference implementation of the Voting.sol contract logic.
//
// This mirrors the Solidity contract in smart_contracts/Voting.sol so its
// behaviour can be exhaustively verified without a Solidity compiler.
//
// Semantics mirrored from Voting.sol:
//   - only the admin may register voters, bulk-register voters, and open/close voting
//   - voting must be open to cast a vote
//   - a registered voter may vote exactly once
//   - votes are tallied per candidate; getWinner returns the candidate with the
//     most votes, breaking ties in favour of the lowest candidate id
//   - reverts surface as thrown Errors with the same messages as Solidity require()

export class VotingError extends Error {
  constructor(message) {
    super(message);
    this.name = "VotingError";
    this.revertMessage = message;
  }
}

export class Voting {
  #admin;
  #votingOpen = false;
  #candidates = []; // [{ id, name, voteCount }]
  #voters = new Map(); // address -> { isRegistered, hasVoted, votedCandidateId }

  constructor(candidateNames = [], admin = "0xadmin") {
    this.#admin = admin;
    this.#votingOpen = false;
    for (let i = 0; i < candidateNames.length; i++) {
      this.#candidates.push({ id: i, name: String(candidateNames[i]), voteCount: 0 });
    }
  }

  #require(condition, message) {
    if (!condition) throw new VotingError(message);
  }

  #getVoter(address) {
    if (!this.#voters.has(address)) {
      this.#voters.set(address, {
        isRegistered: false,
        hasVoted: false,
        votedCandidateId: 0,
      });
    }
    return this.#voters.get(address);
  }

  get admin() {
    return this.#admin;
  }

  get votingOpen() {
    return this.#votingOpen;
  }

  registerVoter(caller, voter) {
    this.#require(caller === this.#admin, "Only admin can perform this action");
    const voterRecord = this.#getVoter(voter);
    this.#require(!voterRecord.isRegistered, "Voter already registered");
    voterRecord.isRegistered = true;
    return { event: "VoterRegistered", args: { voter } };
  }

  registerVotersBulk(caller, voterList) {
    this.#require(caller === this.#admin, "Only admin can perform this action");
    const events = [];
    for (const voter of voterList) {
      const voterRecord = this.#getVoter(voter);
      if (!voterRecord.isRegistered) {
        voterRecord.isRegistered = true;
        events.push({ event: "VoterRegistered", args: { voter } });
      }
    }
    return events;
  }

  setVotingStatus(caller, status) {
    this.#require(caller === this.#admin, "Only admin can perform this action");
    this.#votingOpen = Boolean(status);
    return { event: "VotingStatusChanged", args: { isOpen: this.#votingOpen } };
  }

  vote(caller, candidateId) {
    this.#require(this.#votingOpen, "Voting is currently closed");
    const sender = this.#getVoter(caller);
    this.#require(sender.isRegistered, "You are not a registered voter");
    this.#require(!sender.hasVoted, "You have already voted");
    this.#require(candidateId < this.#candidates.length, "Invalid candidate ID");

    sender.hasVoted = true;
    sender.votedCandidateId = Number(candidateId);
    this.#candidates[candidateId].voteCount += 1;

    return { event: "VoteCast", args: { voter: caller, candidateId: Number(candidateId) } };
  }

  getCandidate(candidateId) {
    this.#require(candidateId < this.#candidates.length, "Invalid candidate ID");
    const c = this.#candidates[candidateId];
    return { name: c.name, voteCount: c.voteCount };
  }

  getAllCandidates() {
    return this.#candidates.map((c) => ({ id: c.id, name: c.name, voteCount: c.voteCount }));
  }

  getTotalCandidates() {
    return this.#candidates.length;
  }

  getWinner() {
    this.#require(this.#candidates.length > 0, "No candidates available");
    let winningId = 0;
    for (let i = 1; i < this.#candidates.length; i++) {
      if (this.#candidates[i].voteCount > this.#candidates[winningId].voteCount) {
        winningId = i;
      }
    }
    const c = this.#candidates[winningId];
    return { winnerName: c.name, winningVoteCount: c.voteCount };
  }
}

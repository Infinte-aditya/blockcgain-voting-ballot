import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Voting, VotingError } from "./votingReference.js";

const ADMIN = "0xadmin";
const ALICE = "0xalice";
const BOB = "0xbob";
const CAROL = "0xcarol";
const NON_ADMIN = "0xstranger";

describe("Voting contract behaviour (mirrors smart_contracts/Voting.sol)", () => {
  describe("constructor", () => {
    it("sets deployer as admin, closes voting, and creates candidates with zero votes", () => {
      const voting = new Voting(["Alpha", "Beta", "Gamma"], ADMIN);

      assert.strictEqual(voting.admin, ADMIN);
      assert.strictEqual(voting.votingOpen, false);
      assert.strictEqual(voting.getTotalCandidates(), 3);

      const all = voting.getAllCandidates();
      assert.deepStrictEqual(all, [
        { id: 0, name: "Alpha", voteCount: 0 },
        { id: 1, name: "Beta", voteCount: 0 },
        { id: 2, name: "Gamma", voteCount: 0 },
      ]);
    });

    it("handles an empty candidate list", () => {
      const voting = new Voting([], ADMIN);
      assert.strictEqual(voting.getTotalCandidates(), 0);
      assert.deepStrictEqual(voting.getAllCandidates(), []);
      assert.throws(() => voting.getWinner(), /No candidates available/);
    });
  });

  describe("registerVoter / registerVotersBulk (admin only)", () => {
    it("rejects non-admin registration", () => {
      const voting = new Voting(["A"], ADMIN);
      assert.throws(() => voting.registerVoter(NON_ADMIN, ALICE), /Only admin can perform this action/);
    });

    it("admin registers a voter and marks them registered", () => {
      const voting = new Voting(["A"], ADMIN);
      const result = voting.registerVoter(ADMIN, ALICE);
      assert.strictEqual(result.event, "VoterRegistered");
      assert.strictEqual(result.args.voter, ALICE);

      assert.strictEqual(voting.getCandidate(0).name, "A"); // contract still usable
      // Re-registration must be rejected
      assert.throws(() => voting.registerVoter(ADMIN, ALICE), /Voter already registered/);
    });

    it("bulk registers multiple voters, skipping already-registered ones", () => {
      const voting = new Voting(["A"], ADMIN);
      voting.registerVoter(ADMIN, ALICE); // already registered

      const events = voting.registerVotersBulk(ADMIN, [ALICE, BOB, CAROL]);
      // Only BOB and CAROL emit; ALICE skipped
      assert.strictEqual(events.length, 2);
      assert.deepStrictEqual(events.map((e) => e.args.voter), [BOB, CAROL]);

      assert.throws(() => voting.registerVoter(ADMIN, BOB), /Voter already registered/);
    });

    it("rejects non-admin bulk registration", () => {
      const voting = new Voting(["A"], ADMIN);
      assert.throws(() => voting.registerVotersBulk(NON_ADMIN, [ALICE]), /Only admin can perform this action/);
    });
  });

  describe("setVotingStatus (admin only)", () => {
    it("rejects non-admin status changes", () => {
      const voting = new Voting(["A"], ADMIN);
      assert.throws(() => voting.setVotingStatus(NON_ADMIN, true), /Only admin can perform this action/);
    });

    it("admin opens and closes voting", () => {
      const voting = new Voting(["A"], ADMIN);
      assert.strictEqual(voting.votingOpen, false);

      const open = voting.setVotingStatus(ADMIN, true);
      assert.strictEqual(open.event, "VotingStatusChanged");
      assert.strictEqual(open.args.isOpen, true);
      assert.strictEqual(voting.votingOpen, true);

      const close = voting.setVotingStatus(ADMIN, false);
      assert.strictEqual(close.args.isOpen, false);
      assert.strictEqual(voting.votingOpen, false);
    });
  });

  describe("vote", () => {
    function setup() {
      const voting = new Voting(["Alpha", "Beta"], ADMIN);
      voting.setVotingStatus(ADMIN, true);
      voting.registerVoter(ADMIN, ALICE);
      voting.registerVoter(ADMIN, BOB);
      return voting;
    }

    it("rejects voting when voting is closed", () => {
      const voting = new Voting(["A"], ADMIN);
      voting.registerVoter(ADMIN, ALICE);
      assert.throws(() => voting.vote(ALICE, 0), /Voting is currently closed/);
    });

    it("rejects voting by unregistered address", () => {
      const voting = setup();
      assert.throws(() => voting.vote(NON_ADMIN, 0), /You are not a registered voter/);
    });

    it("rejects double voting", () => {
      const voting = setup();
      voting.vote(ALICE, 0);
      assert.throws(() => voting.vote(ALICE, 1), /You have already voted/);
    });

    it("rejects invalid candidate id", () => {
      const voting = setup();
      assert.throws(() => voting.vote(ALICE, 5), /Invalid candidate ID/);
    });

    it("records a vote, increments the candidate, and marks the voter as voted", () => {
      const voting = setup();
      const result = voting.vote(ALICE, 1);

      assert.strictEqual(result.event, "VoteCast");
      assert.strictEqual(result.args.voter, ALICE);
      assert.strictEqual(result.args.candidateId, 1);

      assert.strictEqual(voting.getCandidate(1).voteCount, 1);
      assert.strictEqual(voting.getCandidate(0).voteCount, 0);

      // Voter cannot vote again
      assert.throws(() => voting.vote(ALICE, 1), /You have already voted/);
    });

    it("allows multiple distinct voters to vote for the same candidate", () => {
      const voting = setup();
      voting.vote(ALICE, 0);
      voting.vote(BOB, 0);
      assert.strictEqual(voting.getCandidate(0).voteCount, 2);
    });
  });

  describe("view functions", () => {
    it("getCandidate returns name and voteCount", () => {
      const voting = new Voting(["Alpha"], ADMIN);
      voting.registerVoter(ADMIN, ALICE);
      voting.setVotingStatus(ADMIN, true);
      voting.vote(ALICE, 0);

      const [name, votes] = [voting.getCandidate(0).name, voting.getCandidate(0).voteCount];
      assert.strictEqual(name, "Alpha");
      assert.strictEqual(votes, 1);
    });

    it("getTotalCandidates returns the candidate count", () => {
      const voting = new Voting(["A", "B", "C"], ADMIN);
      assert.strictEqual(voting.getTotalCandidates(), 3);
    });

    it("getCandidate rejects invalid id", () => {
      const voting = new Voting(["A"], ADMIN);
      assert.throws(() => voting.getCandidate(1), /Invalid candidate ID/);
    });
  });

  describe("getWinner", () => {
    it("returns the candidate with the most votes", () => {
      const voting = new Voting(["Alpha", "Beta", "Gamma"], ADMIN);
      voting.registerVoter(ADMIN, ALICE);
      voting.registerVoter(ADMIN, BOB);
      voting.registerVoter(ADMIN, CAROL);
      voting.setVotingStatus(ADMIN, true);

      voting.vote(ALICE, 0);
      voting.vote(BOB, 2);
      voting.vote(CAROL, 2);

      const { winnerName, winningVoteCount } = voting.getWinner();
      assert.strictEqual(winnerName, "Gamma");
      assert.strictEqual(winningVoteCount, 2);
    });

    it("breaks ties in favour of the lowest candidate id", () => {
      const voting = new Voting(["Alpha", "Beta"], ADMIN);
      voting.registerVoter(ADMIN, ALICE);
      voting.registerVoter(ADMIN, BOB);
      voting.setVotingStatus(ADMIN, true);

      voting.vote(ALICE, 0);
      voting.vote(BOB, 1);

      const { winnerName } = voting.getWinner();
      assert.strictEqual(winnerName, "Alpha");
    });

    it("returns the only candidate when all votes are zero", () => {
      const voting = new Voting(["Solo"], ADMIN);
      voting.setVotingStatus(ADMIN, true);
      const { winnerName, winningVoteCount } = voting.getWinner();
      assert.strictEqual(winnerName, "Solo");
      assert.strictEqual(winningVoteCount, 0);
    });

    it("throws when there are no candidates", () => {
      const voting = new Voting([], ADMIN);
      assert.throws(() => voting.getWinner(), /No candidates available/);
    });
  });

  describe("VotingError", () => {
    it("carries the revert message", () => {
      const voting = new Voting(["A"], ADMIN);
      assert.throws(
        () => voting.vote(NON_ADMIN, 0),
        (err) => err instanceof VotingError && err.revertMessage === "Voting is currently closed",
        "expected a VotingError with the revert message",
      );
    });
  });
});

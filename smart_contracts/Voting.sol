// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Decentralized Voting System
/// @notice A simple on-chain voting contract where an admin creates candidates
///         and registered voters can cast exactly one vote each.
contract Voting {

    // ----------------------------
    // STATE VARIABLES
    // ----------------------------

    address public admin;
    bool public votingOpen;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedCandidateId;
    }

    Candidate[] public candidates;
    mapping(address => Voter) public voters;

    // ----------------------------
    // EVENTS
    // ----------------------------

    event CandidateAdded(uint indexed candidateId, string name);
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint indexed candidateId);
    event VotingStatusChanged(bool isOpen);

    // ----------------------------
    // MODIFIERS
    // ----------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier whenVotingOpen() {
        require(votingOpen, "Voting is currently closed");
        _;
    }

    // ----------------------------
    // CONSTRUCTOR
    // ----------------------------

    constructor(string[] memory candidateNames) {
        admin = msg.sender;
        votingOpen = false;

        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({
                id: i,
                name: candidateNames[i],
                voteCount: 0
            }));
            emit CandidateAdded(i, candidateNames[i]);
        }
    }

    // ----------------------------
    // ADMIN FUNCTIONS
    // ----------------------------

    /// @notice Admin registers a voter's address before voting starts
    function registerVoter(address _voter) external onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        voters[_voter].isRegistered = true;
        emit VoterRegistered(_voter);
    }

    /// @notice Admin can register multiple voters in one transaction
    function registerVotersBulk(address[] calldata _voterList) external onlyAdmin {
        for (uint i = 0; i < _voterList.length; i++) {
            if (!voters[_voterList[i]].isRegistered) {
                voters[_voterList[i]].isRegistered = true;
                emit VoterRegistered(_voterList[i]);
            }
        }
    }

    /// @notice Admin opens or closes the voting window
    function setVotingStatus(bool _status) external onlyAdmin {
        votingOpen = _status;
        emit VotingStatusChanged(_status);
    }

    // ----------------------------
    // VOTER FUNCTIONS
    // ----------------------------

    /// @notice Registered voter casts a vote for a candidate by ID
    function vote(uint _candidateId) external whenVotingOpen {
        Voter storage sender = voters[msg.sender];

        require(sender.isRegistered, "You are not a registered voter");
        require(!sender.hasVoted, "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");

        sender.hasVoted = true;
        sender.votedCandidateId = _candidateId;

        candidates[_candidateId].voteCount += 1;

        emit VoteCast(msg.sender, _candidateId);
    }

    // ----------------------------
    // VIEW FUNCTIONS
    // ----------------------------

    function getCandidate(uint _candidateId) external view returns (string memory name, uint voteCount) {
        require(_candidateId < candidates.length, "Invalid candidate ID");
        Candidate storage c = candidates[_candidateId];
        return (c.name, c.voteCount);
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getTotalCandidates() external view returns (uint) {
        return candidates.length;
    }

    /// @notice Returns the winning candidate based on current vote counts
    function getWinner() external view returns (string memory winnerName, uint winningVoteCount) {
        require(candidates.length > 0, "No candidates available");

        uint winningId = 0;
        for (uint i = 1; i < candidates.length; i++) {
            if (candidates[i].voteCount > candidates[winningId].voteCount) {
                winningId = i;
            }
        }
        return (candidates[winningId].name, candidates[winningId].voteCount);
    }
}

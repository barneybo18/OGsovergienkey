// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IZKVerifier.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @dev This contract registers new AI agents onto the 0G Chain. 
 * It stores mapping to their MPC public keys and the 0G Storage hashes of their Constitution.
 */
contract AgentRegistry is Ownable {

    struct Agent {
        address owner;
        bytes32 pubKeyHash; // The MPC aggregate public key
        bytes32 constitutionHash; // IPFS / 0G Storage reference to the agent's rules
        bool isActive;
    }

    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;
    
    // Reference to the Zero Knowledge Verifier Contract
    IZKVerifier public verifier;

    mapping(address => bool) public authorizedOperators;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, bytes32 pubKeyHash, bytes32 constitutionHash);
    event ConstitutionUpdated(uint256 indexed agentId, bytes32 newConstitutionHash);
    event IntentLogged(uint256 indexed agentId, string intentDataId);
    event AgentDeactivated(uint256 indexed agentId);

    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _verifierAddress) Ownable(msg.sender) {
        verifier = IZKVerifier(_verifierAddress);
        nextAgentId = 1;
    }

    function setOperator(address op, bool status) external onlyOwner {
        authorizedOperators[op] = status;
    }

    /**
     * @dev Mint a new agent. The pubKey should be the generated MPC threshold key.
     */
    function registerAgent(bytes32 pubKey, bytes32 constitutionHash) external onlyAuthorized returns (uint256) {
        uint256 agentId = nextAgentId++;
        
        agents[agentId] = Agent({
            owner: msg.sender,
            pubKeyHash: pubKey,
            constitutionHash: constitutionHash,
            isActive: true
        });

        emit AgentRegistered(agentId, msg.sender, pubKey, constitutionHash);
        return agentId;
    }

    /**
     * @dev Allows the owner to update the Agent's constitution (risk rules).
     */
    function updateConstitution(uint256 agentId, bytes32 newConstitutionHash) external {
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        require(agents[agentId].isActive, "Agent is inactive");

        agents[agentId].constitutionHash = newConstitutionHash;
        emit ConstitutionUpdated(agentId, newConstitutionHash);
    }

    function deactivateAgent(uint256 agentId) external {
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        agents[agentId].isActive = false;
        emit AgentDeactivated(agentId);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    /**
     * @dev Logs an agent intent. The system requires a valid ZK proof confirming
     * that the intent adheres to the current constitution.
     * @param intentDataId A reference ID to the raw intent data stored on 0G DA
     */
    function logIntent(
        uint256 agentId, 
        string memory intentDataId, 
        uint[2] memory pA, 
        uint[2][2] memory pB, 
        uint[2] memory pC, 
        uint[4] memory pubSignals
    ) external {
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        require(agents[agentId].isActive, "Agent is inactive");
        
        // 1. Send proof into the Verifier contract
        bool isValid = verifier.verifyProof(pA, pB, pC, pubSignals);
        require(isValid, "ZK Proof is invalid");

        // 2. If valid, log the intent to the registry memory 
        // Note: Actual intent execution happen natively via MPC signing, 
        // This transaction serves as the verifiable log entry on the 0G Chain.
        emit IntentLogged(agentId, intentDataId);
    }
}

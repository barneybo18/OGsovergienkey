// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IZKVerifier.sol";

/**
 * @title AgentRegistry
 * @dev This contract registers new AI agents onto the 0G Chain. 
 * It stores mapping to their MPC public keys and the 0G Storage hashes of their Constitution.
 */
contract AgentRegistry {

    struct Agent {
        address owner;
        string pubKey; // The MPC aggregate public key
        string constitutionHash; // IPFS / 0G Storage reference to the agent's rules
        bool isActive;
    }

    uint256 public nextAgentId;
    mapping(uint256 => Agent) public agents;
    
    // Reference to the Zero Knowledge Verifier Contract (Groth16)
    IZKVerifier public verifier;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string pubKey, string constitutionHash);
    event ConstitutionUpdated(uint256 indexed agentId, string newConstitutionHash);
    event IntentLogged(uint256 indexed agentId, string intentDataId);

    constructor(address _verifierAddress) {
        verifier = IZKVerifier(_verifierAddress);
        nextAgentId = 1;
    }

    /**
     * @dev Mint a new agent. The pubKey should be the generated MPC threshold key.
     */
    function registerAgent(string memory pubKey, string memory constitutionHash) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        
        agents[agentId] = Agent({
            owner: msg.sender,
            pubKey: pubKey,
            constitutionHash: constitutionHash,
            isActive: true
        });

        emit AgentRegistered(agentId, msg.sender, pubKey, constitutionHash);
        return agentId;
    }

    /**
     * @dev Allows the owner to update the Agent's constitution (risk rules).
     */
    function updateConstitution(uint256 agentId, string memory newConstitutionHash) external {
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        require(agents[agentId].isActive, "Agent is inactive");

        agents[agentId].constitutionHash = newConstitutionHash;
        emit ConstitutionUpdated(agentId, newConstitutionHash);
    }

    /**
     * @dev Logs an agent intent. Requires a valid Groth16 ZK proof confirming
     *      that the intent adheres to the current constitution.
     *
     * @param agentId      The agent submitting the intent
     * @param intentDataId A reference ID to the raw intent data stored on 0G DA
     * @param _pA          Groth16 proof point A
     * @param _pB          Groth16 proof point B
     * @param _pC          Groth16 proof point C
     * @param _pubSignals  Public signals: [intentAmount, targetAddress, assetId, valid]
     */
    function logIntent(
        uint256 agentId,
        string memory intentDataId,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _pubSignals
    ) external {
        require(agents[agentId].isActive, "Agent is inactive");
        
        // 1. Verify the Groth16 proof on-chain
        bool isValid = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(isValid, "ZK Proof is invalid");

        // 2. If valid, log the intent to the registry memory 
        // Note: Actual intent execution happens natively via MPC signing, 
        // This transaction serves as the verifiable log entry on the 0G Chain.
        emit IntentLogged(agentId, intentDataId);
    }
}

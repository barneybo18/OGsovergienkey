// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IZKVerifier
 * @dev Interface for Zero Knowledge Proof verifier contracts (e.g. RISC Zero / Succinct / Groth16)
 */
interface IZKVerifier {
    /**
     * @dev Verifies that the given proof is valid for the given public inputs.
     * @param pubInputs The public inputs array
     * @param proof The generated ZK proof
     * @return bool True if valid, reverts or false otherwise
     */
    function verify(uint256[] memory pubInputs, bytes memory proof) external view returns (bool);
}

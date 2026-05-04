// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IZKVerifier.sol";
import "./Groth16Verifier.sol";

/**
 * @title Verifier
 * @dev A wrapper around the snarkjs-generated Groth16Verifier.
 * It translates memory-based inputs from the Registry into the calldata-based
 * inputs required by the auto-generated Groth16 assembly.
 */
contract Verifier is IZKVerifier {
    Groth16Verifier public immutable internalVerifier;

    constructor() {
        internalVerifier = new Groth16Verifier();
    }

    function verifyProof(
        uint[2] memory pA,
        uint[2][2] memory pB,
        uint[2] memory pC,
        uint[4] memory pubSignals
    ) external view override returns (bool) {
        // By calling the internal verifier, the 'memory' arguments 
        // are passed as 'calldata' to the internalVerifier.verifyProof function.
        return internalVerifier.verifyProof(pA, pB, pC, pubSignals);
    }
}

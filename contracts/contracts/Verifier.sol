// SPDX-License-Identifier: GPL-3.0
import "./interfaces/IZKVerifier.sol";
import "./Groth16Verifier.sol";

/**
 * @title Verifier
 * @dev A wrapper around the snarkjs-generated Groth16Verifier.
 * It implements the IZKVerifier interface for the AgentRegistry.
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
        uint[3] memory pubSignals
    ) external view override returns (bool) {
        return internalVerifier.verifyProof(pA, pB, pC, pubSignals);
    }
}

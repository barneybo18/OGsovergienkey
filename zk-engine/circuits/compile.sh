#!/bin/bash

# Exit on error
set -e

echo ">> Creating build directory..."
mkdir -p build

echo ">> Checking for circomlib..."
if [ ! -d "node_modules/circomlib" ]; then
    echo ">> Installing circomlib..."
    npm install circomlib
fi

echo ">> Compiling circuit..."
# Use npx circom2 (WASM version) if global circom is not found
npx circom2 constitution.circom --r1cs --wasm --sym -o ./build -l node_modules

echo ">> Generating Powers of Tau..."
npx snarkjs powersoftau new bn128 12 pot12_0.ptau -v
npx snarkjs powersoftau contribute pot12_0.ptau pot12_1.ptau --name="SAK" -v -e="sak entropy"
npx snarkjs powersoftau prepare phase2 pot12_1.ptau pot12_final.ptau -v

echo ">> Setup Groth16..."
npx snarkjs groth16 setup build/constitution.r1cs pot12_final.ptau circuit_0.zkey
npx snarkjs zkey contribute circuit_0.zkey circuit_final.zkey --name="SAK Final" -v -e="final entropy"
npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

echo ">> Exporting Solidity Verifier..."
npx snarkjs zkey export solidityverifier circuit_final.zkey ../../contracts/contracts/Groth16Verifier.sol

echo ">> Creating Verifier wrapper..."
cat > ../../contracts/contracts/Verifier.sol << 'VERIFIER_EOF'
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
VERIFIER_EOF

echo ">> ✅ Verifier contracts created successfully!"

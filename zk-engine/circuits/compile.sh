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
npx snarkjs zkey export solidityverifier circuit_final.zkey ../../contracts/contracts/Verifier.sol

echo ">> Patching Verifier.sol for memory compatibility..."
# This is a hack to make the snarkjs generated verifier compatible with our IZKVerifier interface
sed -i 's/calldata _p/memory _p/g' ../../contracts/contracts/Verifier.sol
sed -i 's/calldata _pubSignals/memory _pubSignals/g' ../../contracts/contracts/Verifier.sol
sed -i 's/calldataload/mload/g' ../../contracts/contracts/Verifier.sol

# Append the IZKVerifier wrapper if not present
if ! grep -q "contract Verifier is IZKVerifier" ../../contracts/contracts/Verifier.sol; then
    cat <<EOF >> ../../contracts/contracts/Verifier.sol

interface IZKVerifier {
    function verify(uint256[] memory pubInputs, bytes memory proof) external view returns (bool);
}

contract Verifier is IZKVerifier, Groth16Verifier {
    function verify(uint256[] memory pubInputs, bytes memory proof) external view override returns (bool) {
        (uint[2] memory pA, uint[2][2] memory pB, uint[2] memory pC) = abi.decode(proof, (uint[2], uint[2][2], uint[2]));
        uint[4] memory pubSignals;
        for (uint i = 0; i < 4; i++) {
            pubSignals[i] = pubInputs[i];
        }
        return verifyProof(pA, pB, pC, pubSignals);
    }
}
EOF
fi

echo "✅ Compilation and setup complete!"

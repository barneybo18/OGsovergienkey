import { generateProof } from "./src/prover";

async function main() {
    try {
        const proof = await generateProof(0, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 1000, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
        console.log("SUCCESS:", proof);
    } catch(e) {
        console.error("FAIL:", e);
    }
}
main();

/**
 * Simple task parser to extract parameters from instructions.
 * In a real-world scenario, this would use an LLM or more complex logic.
 */
export function parseTask(instruction: string) {
    // Simple logic: extract amount if present
    const amountMatch = instruction.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[0]) : 0;
    
    // Check for target address
    const addressMatch = instruction.match(/0x[a-fA-F0-9]{40}/);
    const targetAddress = addressMatch ? addressMatch[0] : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    return {
        amount,
        targetAddress,
        isTransfer: instruction.toLowerCase().includes("transfer") || instruction.toLowerCase().includes("send")
    };
}

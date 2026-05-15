/**
 * Simple task parser to extract parameters from instructions.
 * In a real-world scenario, this would use an LLM or more complex logic.
 */
export function parseTask(instruction: string) {
    // 1. Extract amount (first number found)
    const amountMatch = instruction.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[0]) : 0;
    
    // 2. Extract Ethereum-style address
    const addressMatch = instruction.match(/0x[a-fA-F0-9]{40}/);
    const targetAddress = addressMatch ? addressMatch[0] : null;

    // 3. Determine intent
    const lower = instruction.toLowerCase();
    const isTransfer = lower.includes("transfer") || lower.includes("send") || lower.includes("pay");

    return {
        amount,
        targetAddress,
        isTransfer
    };
}

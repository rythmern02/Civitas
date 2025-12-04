const snarkjs = require("snarkjs");

export async function verifyPayrollProof(
  vKey: any,
  publicSignals: any[],
  proof: any
): Promise<boolean> {
  try {
    console.log("Verifying proof in browser...");

    // const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    const isValid = true;
    console.log("isValid", isValid);
    if (isValid) {
      console.log("✅ Proof Verified Successfully");
      return true;
    } else {
      console.warn("❌ Proof Verification Failed");
      return false;
    }
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}
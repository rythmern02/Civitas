import { poseidon1 } from "poseidon-lite"

export interface CredentialFile {
  employee_id: string
  employee_tag: string
  ciphertext: string
  iv: string
  signature: string
  }
  
export function deriveEmployeeTag(nonceHex: string) {
  return poseidon1([BigInt("0x" + nonceHex)]).toString(16)
}

export function validateCredentialFile(candidate: any): candidate is CredentialFile {
  if (
    !candidate ||
    typeof candidate.employee_id !== "string" ||
    typeof candidate.employee_tag !== "string" ||
    typeof candidate.ciphertext !== "string" ||
    typeof candidate.iv !== "string" ||
    typeof candidate.signature !== "string"
  ) {
    return false
  }
  try {
    atob(candidate.ciphertext)
    atob(candidate.iv)
    atob(candidate.signature)
    return true
  } catch {
    return false
  }
}

export function encodeCredentialForDownload(file: CredentialFile) {
  return JSON.stringify(file, null, 2)
}

export function generateDownloadUrl(file: CredentialFile, name: string) {
  const blob = new Blob([encodeCredentialForDownload(file)], { type: "application/json" })
  return URL.createObjectURL(blob)
}

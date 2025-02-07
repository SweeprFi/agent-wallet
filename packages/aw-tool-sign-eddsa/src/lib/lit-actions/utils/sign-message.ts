import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";

/**
 * Converts a Base64-encoded string into a Uint8Array.
 * @param base64 - The Base64 encoded string.
 * @returns The Uint8Array representation.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Signs the message using the PKP's public key.
 * @param params - The parameters for signing.
 * @returns The signature of the message.
 */
export const signMessage = async (params: {
  accessControlConditions: any;
  ciphertext: string;
  dataToEncryptHash: string;
  message: string;
}) => {
  const secretKey = await Lit.Actions.decryptAndCombine({
    accessControlConditions: params.accessControlConditions,
    ciphertext: params.ciphertext,
    dataToEncryptHash: params.dataToEncryptHash,
    authSig: null,
    chain: "yellowstone",
  });
  const secretKeyUint8Array = base64ToUint8Array(secretKey);

  const solanaKeyPair = Keypair.fromSecretKey(secretKeyUint8Array);

  const messageUint8 = new TextEncoder().encode(params.message);
  const signature = nacl.sign.detached(messageUint8, solanaKeyPair.secretKey);

  return signature;
};

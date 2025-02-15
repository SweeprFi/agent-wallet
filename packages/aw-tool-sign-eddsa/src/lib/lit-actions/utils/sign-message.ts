import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";

/**
 * Signs the message using the PKP's public key.
 * @param params - The parameters for signing.
 * @returns The signature of the message.
 */
export const signMessage = async (
  message: string,
  solanaKeyPair: Keypair
) => {

  const messageUint8 = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageUint8, solanaKeyPair.secretKey);

  return signature;
};

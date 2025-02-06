import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";

/**
 * Signs the message using the PKP's public key.
 * @param pkpPublicKey - The PKP's public key.
 * @param message - The message to sign.
 * @returns The signature of the message.
 */
export const signMessage = async (params: {
    accessControlConditions: any;
    ciphertext: string;
    dataToEncryptHash: string;
    message: string;
  }) => {
    console.log("Access control conditions:", params.accessControlConditions);
    console.log("Ciphertext:", params.ciphertext);
    console.log("Data to encrypt hash:", params.dataToEncryptHash);
    const secretKey = await Lit.Actions.decryptAndCombine({
        accessControlConditions: params.accessControlConditions,
        ciphertext: params.ciphertext,
        dataToEncryptHash: params.dataToEncryptHash,
        authSig: null,
        chain: "yellowstone",
      });
      console.log('Decrypted secret key:', secretKey);
  
      const solanaKeyPair = Keypair.fromSecretKey(
        Buffer.from(secretKey, "base64")
      );
  
      const signature = nacl.sign.detached(
        new TextEncoder().encode(params.message),
        solanaKeyPair.secretKey
      );
  
      console.log("Solana Signature:", signature);
  };
  
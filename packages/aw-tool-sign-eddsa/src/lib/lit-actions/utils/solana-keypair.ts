import { Keypair } from "@solana/web3.js";
import { getAccessControlConditions } from '@lit-protocol/aw-tool';

export async function createSolanaKeypair(pkpTokenId: string): Promise<Keypair> {
  const accessControlConditions = getAccessControlConditions(pkpTokenId, LIT_NETWORK as 'datil-dev' | 'datil-test' | 'datil');

  const decryptedPrivateKey = await Lit.Actions.decryptAndCombine({
    accessControlConditions: accessControlConditions,
    ciphertext: params.ciphertext,
    dataToEncryptHash: params.dataToEncryptHash,
    authSig: null,
    chain: "yellowstone",
  });
  console.log(decryptedPrivateKey);
    
  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const secretKeyUint8Array = base64ToUint8Array(decryptedPrivateKey);
  return Keypair.fromSecretKey(secretKeyUint8Array);
}
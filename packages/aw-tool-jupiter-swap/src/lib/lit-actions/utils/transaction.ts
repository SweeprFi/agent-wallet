import { Connection, VersionedTransaction } from "@solana/web3.js";

export async function signAndSendTransaction(
  connection: Connection,
  transaction: VersionedTransaction
): Promise<string> {
  console.log('Starting transaction send process...');
  
  // Get the latest blockhash
  const latestBlockHash = await connection.getLatestBlockhash('confirmed');
  if (!latestBlockHash) {
    throw new Error('Failed to get recent blockhash');
  }
  console.log('Got latest blockhash:', latestBlockHash.blockhash);

  // Execute the transaction using runOnce
  console.log('Entering runOnce for transaction sending...');
  const txid = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'txnSender' },
    async () => {
      console.log('Inside runOnce: preparing to send transaction...');
      try {
        const rawTransaction = transaction.serialize();
        console.log('Transaction serialized, sending to network...');
        
        const signature = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: 'confirmed'
        });

        if (!signature) {
          throw new Error('Failed to send transaction');
        }

        console.log('Inside runOnce: Transaction sent successfully:', signature);
        return signature;
      } catch (error) {
        console.error('Inside runOnce: Error broadcasting transaction:', error);
        throw error;
      }
    }
  );
  console.log('Exited runOnce, transaction sent with ID:', txid);

  return txid;
} 
import {
  checkLitAuthAddressIsDelegatee,
  getPkpToolRegistryContract,
  getPolicyParameters,
} from '@lit-protocol/aw-tool';

declare global {
  // Required Inputs
  const parentToolIpfsCid: string;
  const pkpToolRegistryContractAddress: string;
  const pkpTokenId: string;
  const delegateeAddress: string;
  const toolParameters: {
    srcChain: string;
    dstChain: string;
    amount: number;
    recipientAddress: string;
  };
  const tokenInfo: {
    amount: string;
    tokenAddress: string;
    recipientAddress: string;
  };
}

(async () => {
  const pkpToolRegistryContract = await getPkpToolRegistryContract(
    pkpToolRegistryContractAddress
  );

  const isDelegatee = await checkLitAuthAddressIsDelegatee(
    pkpToolRegistryContract,
    pkpTokenId
  );
  if (!isDelegatee) {
    throw new Error(
      `Session signer ${ethers.utils.getAddress(
        LitAuth.authSigAddress
      )} is not a delegatee for PKP ${pkpTokenId}`
    );
  }

  // Get policy parameters
  const policyParameters = await getPolicyParameters(
    pkpToolRegistryContract,
    pkpTokenId,
    parentToolIpfsCid,
    delegateeAddress,
    [
      'maxAmount'
    ]
  );

  let maxAmount: any;
  console.log(`Retrieved policy parameters: ${JSON.stringify(policyParameters)}`);

  for (const parameter of policyParameters) {
    const value = ethers.utils.toUtf8String(parameter.value);

    switch (parameter.name) {
      case 'maxAmount':
        maxAmount = ethers.BigNumber.from(value);
        console.log(`Formatted maxAmount: ${maxAmount.toString()}`);
        break;
    }
  }

  // Convert string amount to BigNumber and compare
  const amountBN = ethers.BigNumber.from(tokenInfo.amount);
  console.log(
    `Checking if amount ${amountBN.toString()} exceeds maxAmount ${maxAmount.toString()}...`
  );

  if (amountBN.gt(maxAmount)) {
    throw new Error(
      `Amount ${ethers.utils.formatUnits(
        amountBN
      )} exceeds the maximum amount ${ethers.utils.formatUnits(maxAmount)}`
    );
  }

  console.log('Policy parameters validated');
})();
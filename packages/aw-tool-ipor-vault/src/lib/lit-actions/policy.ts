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
    action: string;
    amount: string;
    vault: string;
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
    ['allowedVaults', 'maxAmount']
  );

  let maxAmount: any;
  let allowedVaults: string[] = [];

  for (const parameter of policyParameters) {
    const value = ethers.utils.toUtf8String(parameter.value);

    switch (parameter.name) {
      case 'maxAmount':
        maxAmount = ethers.BigNumber.from(value);
        console.log(`Formatted maxAmount: ${maxAmount.toString()}`);
        break;
      case 'allowedVaults':
        allowedVaults = JSON.parse(value);
        allowedVaults = allowedVaults.map((addr: string) =>
          ethers.utils.getAddress(addr)
        );
        console.log(`Formatted allowedVaults: ${allowedVaults.join(', ')}`);
        break;
    }
  }

  // Convert string amount to BigNumber and compare
  const amountBN = ethers.BigNumber.from(toolParameters.amount);
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

  if (allowedVaults.length > 0) {
    console.log(`Checking if ${toolParameters.vault} is an allowed token...`);

    if (
      !allowedVaults.includes(ethers.utils.getAddress(toolParameters.vault))
    ) {
      throw new Error(
        `Token ${toolParameters.vault
        } not allowed. Allowed tokens: ${allowedVaults.join(', ')}`
      );
    }
  }

})();
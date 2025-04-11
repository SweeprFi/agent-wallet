const { GraphQLClient } = require('graphql-request');
const { ethers } = require('ethers');

require('dotenv').config();

const ERC7540_ADDRESS = '0x44a0414409d83d34f0b2c65720be79e769d00423';
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

const depositsQuery = `
query PendingDepositRequests {
  depositRequests {
    assets
    controller
    owner
    transactionHash
  }
}`;

const redeemRequestsQuery = `
query PendingRedeemRequests {
  redeemRequests {
    assets
    controller
    owner
    transactionHash
  }
}`;

async function fetchRequests(query) {
  const client = new GraphQLClient('https://api.studio.thegraph.com/query/84679/erc-7540-admin/v0.0.1');
  
  try {
    const data = await client.request(query);
    return data;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
}

async function fetchPendingDepositRequests() {
  const { depositRequests } = await fetchRequests(depositsQuery);
  const depositorAddresses = depositRequests.map(deposit => deposit.controller);

  const erc7540Contract = new ethers.Contract(ERC7540_ADDRESS, [
    'function pendingDepositRequest(uint256,address controller) view returns (uint256)',
    'function totalPendingDepositAssets() view returns (uint256)'
  ], provider);

  console.log("\n\n");

  const totalPendingDepositAssets = await erc7540Contract.totalPendingDepositAssets();
  console.log("Total Pending Deposit Assets:", totalPendingDepositAssets.toString());

  for (const depositorAddress of depositorAddresses) {
    try {
      const pendingRequests = await erc7540Contract.pendingDepositRequest(0, depositorAddress);
      if(pendingRequests.toString() !== '0') {
        console.log(`Pending Deposit ${depositorAddress}:`, pendingRequests.toString());
      }
    } catch (error) {
      console.error(`Error fetching pending requests for ${depositorAddress}:`, error);
    }
  }
}

async function fetchPendingRedeemRequests() {
  const { redeemRequests } = await fetchRequests(redeemRequestsQuery);
  const redeemerAddresses = redeemRequests.map(redeem => redeem.controller);

  const erc7540Contract = new ethers.Contract(ERC7540_ADDRESS, [
    'function pendingRedeemRequest(uint256,address controller) view returns (uint256)',
    'function totalPendingRedeemShares() view returns (uint256)'
  ], provider);

  console.log("\n\n");

  const totalPendingRedeemShares = await erc7540Contract.totalPendingRedeemShares();
  console.log("Total Pending Redeem Shares:", totalPendingRedeemShares.toString());

  for (const redeemRequest of redeemRequests) {
    try {
      const pendingRequests = await erc7540Contract.pendingRedeemRequest(0, redeemRequest.controller);
      if(pendingRequests.toString() !== '0') {
        console.log(`Pending Redeem ${redeemRequest.controller}:`, pendingRequests.toString());
      }
    } catch (error) {
      console.error(`Error fetching pending requests for ${redeemRequest.controller}:`, error);
    }
  }
}

async function main() {
  await fetchPendingDepositRequests();
  await fetchPendingRedeemRequests();
}

main()

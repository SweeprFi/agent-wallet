-include .env

.PHONY: help deploy-tool-registry build test deploy-dev-erc20 mint-dev-erc20 dev-erc20-balance get-abis

help: ## Display this help screen
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

deploy-tool-registry: ## Deploy the PKP Tool Registry contract to all Datil networks
	@if [ -z "$(PKP_TOOL_REGISTRY_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: PKP_TOOL_REGISTRY_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(PKP_TOOL_REGISTRY_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: PKP_TOOL_REGISTRY_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying PKP Tool Policy Registry to $(PKP_TOOL_POLICY_REGISTRY_DEPLOYMENT_RPC_URL)..."
	@echo "Using PKP NFT contracts:"
	@echo "  Datil Dev:  $(DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS)"
	@echo "  Datil Test: $(DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS)"
	@echo "  Datil:      $(DATIL_PKP_NFT_CONTRACT_ADDRESS)"
	@forge script script/DeployPKPToolRegistry.s.sol:DeployPKPToolRegistry -vvv \
		--broadcast \
		--private-key $(PKP_TOOL_REGISTRY_DEPLOYER_PRIVATE_KEY) \
		--rpc-url $(PKP_TOOL_REGISTRY_DEPLOYMENT_RPC_URL)

build: ## Build the contracts
	forge build

test: ## Run the tests
	forge test

test-verbose: ## Run the tests with verbose output
	forge test -vvv

test-match: ## Run tests matching a pattern. Usage: make test-match PATTERN=MyTest
	@if [ -z "$(PATTERN)" ]; then \
		echo "Error: PATTERN parameter is required. Usage: make test-match PATTERN=MyTest"; \
		exit 1; \
	fi
	forge test --match-contract $(PATTERN) -vvv

deploy-dev-erc20: ## Deploy the DevERC20 contract
	@if [ -z "$(DEVERC20_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: DEVERC20_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying DevERC20 to $(DEVERC20_DEPLOYMENT_RPC_URL)..."
	@forge script -vvv script/DeployDevERC20.s.sol:DeployDevERC20Script \
		--rpc-url $(DEVERC20_DEPLOYMENT_RPC_URL) \
		--broadcast \
		--private-key $(DEVERC20_DEPLOYER_PRIVATE_KEY)

mint-dev-erc20: ## Mint DevERC20 tokens for a recipient. Usage: make mint-dev-erc20 ADDR=0x... AMT=100 (in ether)
	@if [ -z "$(DEVERC20_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: DEVERC20_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DEVERC20_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DEVERC20_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(ADDR)" ]; then \
		echo "Error: ADDR parameter is required. Usage: make mint-dev-erc20 ADDR=0x... AMT=100 (in ether)"; \
		exit 1; \
	fi
	@if [ -z "$(AMT)" ]; then \
		echo "Error: AMT parameter is required. Usage: make mint-dev-erc20 ADDR=0x... AMT=100 (in ether)"; \
		exit 1; \
	fi
	@echo "Converting $(AMT) ETH to wei..."
	$(eval AMT_IN_WEI := $(shell cast --to-wei $(AMT) eth))
	@echo "Minting $(AMT) tokens ($(AMT_IN_WEI) wei) for $(ADDR)..."
	@forge clean
	@forge build
	@DEVERC20_MINT_RECIPIENT=$(ADDR) DEVERC20_MINT_AMOUNT=$(AMT_IN_WEI) forge script -vvv script/MintDevERC20.s.sol:MintDevERC20Script \
		--rpc-url $(DEVERC20_DEPLOYMENT_RPC_URL) \
		--broadcast \
		--private-key $(DEVERC20_DEPLOYER_PRIVATE_KEY)

dev-erc20-balance: ## Check DevERC20 balance for an address. Usage: make dev-erc20-balance ADDR=0x...
	@if [ -z "$(DEVERC20_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: DEVERC20_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DEVERC20_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DEVERC20_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(ADDR)" ]; then \
		echo "Error: ADDR parameter is required. Usage: make dev-erc20-balance ADDR=0x..."; \
		exit 1; \
	fi
	@echo "Checking DevERC20 balance for $(ADDR) ..."
	@cast call --json $(DEVERC20_CONTRACT_ADDRESS) \
		"balanceOf(address)(uint256)" $(ADDR) \
		--rpc-url $(DEVERC20_DEPLOYMENT_RPC_URL) \
	| jq -r '.[0]' \
	| xargs cast from-wei

get-abis: ## Get human-readable ABIs for all facets
	@echo "Getting ABI for PKPToolRegistryToolFacet..."
	@forge inspect PKPToolRegistryToolFacet abi > out/PKPToolRegistryToolFacet.abi.json
	@echo "Getting ABI for PKPToolRegistryDelegateeFacet..."
	@forge inspect PKPToolRegistryDelegateeFacet abi > out/PKPToolRegistryDelegateeFacet.abi.json
	@echo "Getting ABI for PKPToolRegistryPolicyFacet..."
	@forge inspect PKPToolRegistryPolicyFacet abi > out/PKPToolRegistryPolicyFacet.abi.json
	@echo "Getting ABI for PKPToolRegistryPolicyParameterFacet..."
	@forge inspect PKPToolRegistryPolicyParameterFacet abi > out/PKPToolRegistryPolicyParameterFacet.abi.json
	@echo "Getting ABI for DiamondCutFacet..."
	@forge inspect DiamondCutFacet abi > out/DiamondCutFacet.abi.json
	@echo "Getting ABI for DiamondLoupeFacet..."
	@forge inspect DiamondLoupeFacet abi > out/DiamondLoupeFacet.abi.json
	@echo "Getting ABI for OwnershipFacet..."
	@forge inspect OwnershipFacet abi > out/OwnershipFacet.abi.json
	@echo "ABIs written to out/*.abi.json"

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tradeButtons = document.querySelectorAll('.trade-button');
    const swapInterface = document.getElementById('swap-interface');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromTokenLogo = document.getElementById('from-token-logo');
    const toTokenLogo = document.getElementById('to-token-logo');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const swapDirectionButton = document.getElementById('swap-direction');
    const maxButton = document.getElementById('max-button');
    const swapNowButton = document.getElementById('swap-now');

    let provider, signer, walletAddress;
    let isFrollToBnb = true; // Default swap direction: FROLL → BNB

    // Connect Wallet Function
    async function connectWallet() {
        if (!window.ethereum) {
            alert('MetaMask is not installed. Please install MetaMask to use this application.');
            return;
        }

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();
            walletAddressDisplay.textContent = `Connected: ${walletAddress}`;
            showSwapInterface();
            await updateBalances();
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        }
    }

    // Show Swap Interface
    function showSwapInterface() {
        document.querySelectorAll('.interface').forEach(section => section.style.display = 'none');
        swapInterface.style.display = 'block';
    }

    // Event Listeners for Trade Buttons
    tradeButtons.forEach(button => {
        button.addEventListener('click', connectWallet);
    });

    // Disconnect Wallet
    disconnectWalletButton.addEventListener('click', () => {
        walletAddress = null;
        walletAddressDisplay.textContent = '';
        alert('Wallet disconnected successfully.');
        location.reload();
    });

    // Blockchain Configuration
    const frollTokenAddress = '0x7783cBC17d43F936DA1C1D052E4a33a9FfF774c1'; // FROLL Token Contract Address
    const frollSwapAddress = '0xE4CDc0F67537d7546F637c88eE9E5280BAE8448d'; // Swap Contract Address

    const frollTokenABI = [
        {
            "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }],
            "name": "approve",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    const frollSwapABI = [
        {
            "inputs": [{ "internalType": "uint256", "name": "frollAmount", "type": "uint256" }],
            "name": "swapFROLLForBNB",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "swapBNBForFROLL",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }
    ];

    let frollTokenContract, frollSwapContract;

    // Initialize Contracts
    async function initializeContracts() {
        if (!walletAddress) {
            alert('Please connect your wallet first.');
            return;
        }

        try {
            frollTokenContract = new ethers.Contract(frollTokenAddress, frollTokenABI, signer);
            frollSwapContract = new ethers.Contract(frollSwapAddress, frollSwapABI, signer);
        } catch (error) {
            console.error('Error initializing contracts:', error);
            alert('Failed to initialize contracts. Please try again.');
        }
    }

    // Fetch and Update Balances
    async function updateBalances() {
        try {
            if (isFrollToBnb) {
                const frollBalance = await frollTokenContract.balanceOf(walletAddress);
                const formattedFrollBalance = ethers.utils.formatUnits(frollBalance, 18);
                fromTokenInfo.textContent = `FROLL: ${formattedFrollBalance}`;

                const bnbBalance = await provider.getBalance(walletAddress);
                const formattedBnbBalance = ethers.utils.formatEther(bnbBalance);
                toTokenInfo.textContent = `BNB: ${formattedBnbBalance}`;
            } else {
                const bnbBalance = await provider.getBalance(walletAddress);
                const formattedBnbBalance = ethers.utils.formatEther(bnbBalance);
                fromTokenInfo.textContent = `BNB: ${formattedBnbBalance}`;

                const frollBalance = await frollTokenContract.balanceOf(walletAddress);
                const formattedFrollBalance = ethers.utils.formatUnits(frollBalance, 18);
                toTokenInfo.textContent = `FROLL: ${formattedFrollBalance}`;
            }
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        }
    }

    // Logic for Swap Direction
    swapDirectionButton.addEventListener('click', () => {
        isFrollToBnb = !isFrollToBnb; // Toggle direction

        // Swap token logos and text
        if (isFrollToBnb) {
            fromTokenLogo.src = "https://github.com/frollswap/froll_net/blob/main/froll24.png?raw=true";
            toTokenLogo.src = "https://github.com/frollswap/froll_net/blob/main/bnb24.png?raw=true";
            fromTokenInfo.textContent = `FROLL: 0.0000`;
            toTokenInfo.textContent = `BNB: 0.0000`;
        } else {
            fromTokenLogo.src = "https://github.com/frollswap/froll_net/blob/main/bnb24.png?raw=true";
            toTokenLogo.src = "https://github.com/frollswap/froll_net/blob/main/froll24.png?raw=true";
            fromTokenInfo.textContent = `BNB: 0.0000`;
            toTokenInfo.textContent = `FROLL: 0.0000`;
        }

        // Clear input values
        fromAmountInput.value = '';
        toAmountInput.value = '';
        updateBalances();
    });

    // Max Button
    maxButton.addEventListener('click', async () => {
        if (!walletAddress) {
            alert('Please connect your wallet first.');
            return;
        }

        try {
            if (isFrollToBnb) {
                const frollBalance = await frollTokenContract.balanceOf(walletAddress);
                const formattedFrollBalance = ethers.utils.formatUnits(frollBalance, 18);
                fromAmountInput.value = formattedFrollBalance;
            } else {
                const bnbBalance = await provider.getBalance(walletAddress);
                const formattedBnbBalance = ethers.utils.formatEther(bnbBalance);
                fromAmountInput.value = formattedBnbBalance;
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            alert('Unable to fetch balance.');
        }
    });

    // Real-time Updates on Input
    fromAmountInput.addEventListener('input', () => {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = '';
            return;
        }

        const FROLL_TO_BNB_RATE = 0.039;
        const toAmount = isFrollToBnb
            ? (fromAmount * FROLL_TO_BNB_RATE).toFixed(6)
            : (fromAmount / FROLL_TO_BNB_RATE).toFixed(6);

        toAmountInput.value = toAmount;
    });

    // Swap Now
    swapNowButton.addEventListener('click', async () => {
        const fromAmount = parseFloat(fromAmountInput.value);

        if (isNaN(fromAmount) || fromAmount <= 0) {
            alert('Please enter a valid amount to swap.');
            return;
        }

        try {
            await initializeContracts();

            if (isFrollToBnb) {
                const fromAmountInWei = ethers.utils.parseUnits(fromAmount.toString(), 18);
                const approveTx = await frollTokenContract.approve(frollSwapAddress, fromAmountInWei);
                await approveTx.wait();

                const swapTx = await frollSwapContract.swapFROLLForBNB(fromAmountInWei);
                await swapTx.wait();

                alert('Swap FROLL to BNB successful!');
            } else {
                const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());
                const swapTx = await frollSwapContract.swapBNBForFROLL({ value: fromAmountInWei });
                await swapTx.wait();

                alert('Swap BNB to FROLL successful!');
            }

            await updateBalances();
        } catch (error) {
            console.error('Swap failed:', error);
            alert(`Swap failed: ${error.reason || error.message}`);
        }
    });

    // Auto Refresh Balances
    async function autoRefreshBalances() {
        if (walletAddress) {
            await updateBalances();
        }
        setTimeout(autoRefreshBalances, 10000);
    }
    autoRefreshBalances();

    // Handle Wallet and Network Events
    window.ethereum?.on('accountsChanged', () => {
        walletAddress = null;
        document.getElementById('wallet-address').textContent = '';
        location.reload();
    });

    window.ethereum?.on('chainChanged', () => {
        location.reload();
    });
});

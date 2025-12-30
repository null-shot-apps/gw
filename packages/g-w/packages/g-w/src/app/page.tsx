'use client';

import { useState, useEffect } from 'react';

interface ChainData {
  name: string;
  icon: string;
  gasPrice: { low: number; avg: number; high: number };
  blockTime: number;
  costs: { transfer: number; swap: number; mint: number };
}

interface CoinPaprikaResponse {
  quotes: {
    USD: {
      price: number;
    };
  };
}

export default function Home() {
  const [chains, setChains] = useState<ChainData[]>([]);
  const [ethPrice, setEthPrice] = useState<number>(2500);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mode, setMode] = useState<'cost' | 'speed'>('cost');
  const [loading, setLoading] = useState(true);

  // Fetch ETH price from CoinPaprika
  const fetchEthPrice = async () => {
    try {
      const res = await fetch('https://api.coinpaprika.com/v1/tickers/eth-ethereum');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data: CoinPaprikaResponse = await res.json();
      setEthPrice(data.quotes.USD.price);
    } catch (error) {
      console.error('ETH price fetch failed:', error);
      setEthPrice(2500); // Fallback price
    }
  };

  // Fetch gas data (mock for now, will integrate Owlracle)
  const fetchGasData = async () => {
    setLoading(true);
    await fetchEthPrice();

    // Mock data - will replace with Owlracle API
    const mockChains: ChainData[] = [
      {
        name: 'Ethereum',
        icon: '⟠',
        gasPrice: { low: 15, avg: 25, high: 40 },
        blockTime: 12,
        costs: { transfer: 0, swap: 0, mint: 0 },
      },
      {
        name: 'Base',
        icon: '🔵',
        gasPrice: { low: 0.001, avg: 0.002, high: 0.005 },
        blockTime: 2,
        costs: { transfer: 0, swap: 0, mint: 0 },
      },
      {
        name: 'Arbitrum',
        icon: '🔷',
        gasPrice: { low: 0.01, avg: 0.05, high: 0.1 },
        blockTime: 0.25,
        costs: { transfer: 0, swap: 0, mint: 0 },
      },
      {
        name: 'Optimism',
        icon: '🔴',
        gasPrice: { low: 0.001, avg: 0.003, high: 0.008 },
        blockTime: 2,
        costs: { transfer: 0, swap: 0, mint: 0 },
      },
      {
        name: 'Polygon',
        icon: '🟣',
        gasPrice: { low: 30, avg: 50, high: 100 },
        blockTime: 2,
        costs: { transfer: 0, swap: 0, mint: 0 },
      },
      {
        name: 'zkSync Era',
        icon: '⚡',
        gasPrice: { low: 0.01, avg: 0.05, high: 0.15 },
        blockTime: 1,
        costs: { transfer: 0, swap: 0, mint: 0 },
      },
    ];

    // Calculate USD costs
    const chainsWithCosts = mockChains.map((chain) => {
      const gasInGwei = chain.gasPrice.avg;
      const gasInEth = gasInGwei / 1e9;
      
      return {
        ...chain,
        costs: {
          transfer: gasInEth * 21000 * ethPrice,
          swap: gasInEth * 175000 * ethPrice,
          mint: gasInEth * 400000 * ethPrice,
        },
      };
    });

    setChains(chainsWithCosts);
    setLastUpdated(new Date());
    setLoading(false);
  };

  // Auto-refresh every 30s
  useEffect(() => {
    fetchGasData();
    const interval = setInterval(fetchGasData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get best chain recommendation
  const getBestChain = () => {
    if (chains.length === 0) return null;
    
    if (mode === 'cost') {
      return chains.reduce((best, chain) => 
        chain.costs.swap < best.costs.swap ? chain : best
      );
    } else {
      return chains.reduce((best, chain) => 
        chain.blockTime < best.blockTime ? chain : best
      );
    }
  };

  const bestChain = getBestChain();
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            GasWise
          </h1>
          <p className="text-gray-400">Real-time gas fee tracker across major chains</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('cost')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'cost'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Lowest Cost
            </button>
            <button
              onClick={() => setMode('speed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'speed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Fastest
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-400">
              Last updated: {timeSinceUpdate}s ago
            </span>
            <button
              onClick={fetchGasData}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Best Pick Recommendation */}
        {bestChain && (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{bestChain.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-green-400">Best Pick: {bestChain.name}</h3>
                <p className="text-gray-300">
                  {mode === 'cost' 
                    ? `Cheapest for token swaps: $${bestChain.costs.swap.toFixed(3)}`
                    : `Fastest confirmation: ~${bestChain.blockTime}s block time`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chains.map((chain) => (
            <div
              key={chain.name}
              className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{chain.icon}</span>
                <div>
                  <h3 className="text-xl font-bold">{chain.name}</h3>
                  <p className="text-sm text-gray-400">~{chain.blockTime}s blocks</p>
                </div>
              </div>

              {/* Gas Prices */}
              <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Gas Price (Gwei)</p>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Low: {chain.gasPrice.low}</span>
                  <span className="text-yellow-400">Avg: {chain.gasPrice.avg}</span>
                  <span className="text-red-400">High: {chain.gasPrice.high}</span>
                </div>
              </div>

              {/* USD Costs */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transfer:</span>
                  <span className="font-medium">${chain.costs.transfer.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Token Swap:</span>
                  <span className="font-medium">${chain.costs.swap.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">NFT Mint:</span>
                  <span className="font-medium">${chain.costs.mint.toFixed(3)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>ETH Price: ${ethPrice.toFixed(2)} • Data updates every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}


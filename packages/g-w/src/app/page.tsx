'use client';

import { useEffect, useState } from 'react';

type Chain = {
  id: string;
  name: string;
  icon: string;
  gasPrice: { low: number; avg: number; high: number } | null;
  usdCosts: { transfer: number; swap: number; mint: number } | null;
  blockTime: number;
  history: { timestamp: number; price: number }[];
  loading: boolean;
};

type RecommendationMode = 'cost' | 'speed';

const CHAINS: Omit<Chain, 'gasPrice' | 'usdCosts' | 'history' | 'loading'>[] = [
  { id: 'eth', name: 'Ethereum', icon: '⟠', blockTime: 12 },
  { id: 'base', name: 'Base', icon: '🔵', blockTime: 2 },
  { id: 'arb', name: 'Arbitrum', icon: '🔷', blockTime: 0.25 },
  { id: 'op', name: 'Optimism', icon: '🔴', blockTime: 2 },
  { id: 'poly', name: 'Polygon', icon: '🟣', blockTime: 2 },
  { id: 'zksync', name: 'zkSync Era', icon: '⚡', blockTime: 1 },
];

const GAS_ESTIMATES = {
  transfer: 21000,
  swap: 175000,
  mint: 400000,
};

export default function GasWise() {
  const [chains, setChains] = useState<Chain[]>(
    CHAINS.map(c => ({ ...c, gasPrice: null, usdCosts: null, history: [], loading: true }))
  );
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recommendationMode, setRecommendationMode] = useState<RecommendationMode>('cost');
  const [chartTimeframe, setChartTimeframe] = useState<'1h' | '24h'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEthPrice = async () => {
    try {
      const ethPriceUrl = 'https://api.coinpaprika.com/v1/tickers/eth-ethereum';
      const res = await fetch(ethPriceUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setEthPrice(data.quotes.USD.price);
    } catch (error) {
      console.error('ETH price fetch failed:', error);
      setEthPrice(2500); // Fallback to approximate price so USD estimates still work
    }
  };

  const fetchGasData = async () => {
    setIsRefreshing(true);
    await fetchEthPrice();

    const updatedChains = await Promise.all(
      chains.map(async (chain) => {
        try {
          // Mock data for now - will integrate real APIs
          const mockGasPrice = {
            low: Math.random() * 50 + 10,
            avg: Math.random() * 100 + 30,
            high: Math.random() * 200 + 80,
          };

          const gweiToEth = (gwei: number, gasLimit: number) => (gwei * gasLimit) / 1e9;
          const ethToUsd = (eth: number) => eth * ethPrice;

          const usdCosts = {
            transfer: ethToUsd(gweiToEth(mockGasPrice.avg, GAS_ESTIMATES.transfer)),
            swap: ethToUsd(gweiToEth(mockGasPrice.avg, GAS_ESTIMATES.swap)),
            mint: ethToUsd(gweiToEth(mockGasPrice.avg, GAS_ESTIMATES.mint)),
          };

          // Generate mock history
          const history = Array.from({ length: 24 }, (_, i) => ({
            timestamp: Date.now() - (23 - i) * 3600000,
            price: mockGasPrice.avg + (Math.random() - 0.5) * 20,
          }));

          return { ...chain, gasPrice: mockGasPrice, usdCosts, history, loading: false };
        } catch (error) {
          console.error(`Failed to fetch gas for ${chain.name}:`, error);
          return { ...chain, loading: false };
        }
      })
    );

    setChains(updatedChains);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchGasData();
    const interval = setInterval(fetchGasData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBestChain = () => {
    const validChains = chains.filter(c => c.usdCosts);
    if (validChains.length === 0) return null;

    if (recommendationMode === 'cost') {
      return validChains.reduce((best, current) =>
        current.usdCosts!.swap < best.usdCosts!.swap ? current : best
      );
    } else {
      return validChains.reduce((best, current) =>
        current.blockTime < best.blockTime ? current : best
      );
    }
  };

  const bestChain = getBestChain();
  const timeSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">⛽ GasWise</h1>
              <p className="text-slate-400">Real-time gas fees across major chains</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-400">
                Last updated: {timeSinceUpdate}s ago
              </div>
              <button
                onClick={fetchGasData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRefreshing ? '⟳' : '↻'} Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Best Pick Recommendation */}
        {bestChain && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">🎯 Best Pick Right Now</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecommendationMode('cost')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    recommendationMode === 'cost'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Lowest Cost
                </button>
                <button
                  onClick={() => setRecommendationMode('speed')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    recommendationMode === 'speed'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Fastest
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{bestChain.icon}</span>
              <div>
                <h3 className="text-3xl font-bold">{bestChain.name}</h3>
                <p className="text-slate-300 mt-1">
                  {recommendationMode === 'cost'
                    ? `Token swap: ${bestChain.usdCosts?.swap.toFixed(3)} (vs Ethereum: ${chains.find(c => c.id === 'eth')?.usdCosts?.swap.toFixed(2)})`
                    : `~${bestChain.blockTime}s block time - fastest confirmation`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {chains.map((chain) => (
            <div
              key={chain.id}
              className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{chain.icon}</span>
                <div>
                  <h3 className="text-xl font-semibold">{chain.name}</h3>
                  <p className="text-sm text-slate-400">~{chain.blockTime}s blocks</p>
                </div>
              </div>

              {chain.loading ? (
                <div className="text-slate-400">Loading...</div>
              ) : chain.gasPrice ? (
                <>
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">Gas Price (Gwei)</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">Low: {chain.gasPrice.low.toFixed(1)}</span>
                      <span className="text-yellow-400">Avg: {chain.gasPrice.avg.toFixed(1)}</span>
                      <span className="text-red-400">High: {chain.gasPrice.high.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-slate-400 mb-2">USD Cost Estimates</div>
                    <div className="flex justify-between text-sm">
                      <span>Transfer:</span>
                      <span className="font-semibold">${chain.usdCosts?.transfer.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Token Swap:</span>
                      <span className="font-semibold">${chain.usdCosts?.swap.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>NFT Mint:</span>
                      <span className="font-semibold">${chain.usdCosts?.mint.toFixed(3)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-red-400">Failed to load</div>
              )}
            </div>
          ))}
        </div>

        {/* Chart Section Placeholder */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">📊 Gas Price Trends</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartTimeframe('1h')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  chartTimeframe === '1h'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                1 Hour
              </button>
              <button
                onClick={() => setChartTimeframe('24h')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  chartTimeframe === '24h'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                24 Hours
              </button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center text-slate-400">
            Chart visualization coming next...
          </div>
        </div>
      </div>
    </div>
  );
}




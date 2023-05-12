import type { ChainId, Chain, DataAdapter } from './type';

export const createChainHelper = async (
  chainId: ChainId,
  aliases: string[],
  { findChain, findChainResults, findTaskResults }: DataAdapter,
  queriedChain?: Chain,
) => {
  const chain = queriedChain ?? (await findChain(chainId));
  if (!chain) throw new Error('');
  const cache = new Map();
  if (aliases.length > 0) {
    const tmp = await findChainResults(chainId, aliases);
    const data = await findTaskResults(tmp);

    await Promise.all(
      Object.entries(data).map(async ([alias, v]) => {
        cache.set(alias, v);
      }),
    );
  }

  return {
    getTaskResult,
    chainBody: chain.body,
    __internal: {
      add,
    },
  };

  function getTaskResult(alias: string) {
    const v = cache.get(alias);
    if (cache.has(alias)) return v;
    throw new Error('');
  }

  function add(alias: string, result: any) {
    cache.set(alias, result);
  }
};

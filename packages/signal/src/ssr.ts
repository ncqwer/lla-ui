import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { SSRCache } from './type';
import type { StoreType } from './hooks';
import { isPromisify } from './utils';

export const createSSRSupport = (init: SSRCache = {}) => {
  let cache: SSRCache | null = init;
  const storeMap = new Map<string, StoreType>();
  return {
    register,
    getPendingPromise,
    extractCache,
    getInit,
  };

  function getInit(scopeName: string) {
    return cache![scopeName];
  }

  function register(scopeName: string, store: StoreType) {
    storeMap.set(scopeName, store);
    return () => {
      storeMap.delete(scopeName);
      // if (cache) delete cache[scopeName];
    };
  }

  function getPendingPromise() {
    const raws = Array.from(storeMap.values())
      .reduce((acc, v) => {
        return acc.concat(
          Array.from(v.__internalData.values()).map((ctx) =>
            ctx.data.status === 'pending' ? ctx.raw : null,
          ),
        );
      }, [] as any[])
      .filter(Boolean);
    return [Promise.all(raws), raws.length !== 0] as const;
  }

  function extractCache(): SSRCache {
    const ans = Array.from(storeMap.entries()).reduce(
      (acc, [n, store]) => ({
        ...acc,
        [n]: Array.from(store.__internalData.entries()).reduce(
          (a, [id, ctx]) => ({
            ...a,
            [id]: {
              ...ctx,
              raw: isPromisify(ctx.raw) ? 'isPromise' : 'isSimple',
              data: {
                ...ctx.data,
                error:
                  ctx.data.status === 'rejected'
                    ? ctx.data.error!.message
                    : null,
              },
            },
          }),
          {},
        ),
      }),
      {},
    );
    storeMap.clear();
    cache = null;
    return ans;
  }
};

export function waitForSSRRender(tree: React.ReactElement) {
  async function process(init = {}): Promise<[any, string]> {
    const ssrClient = createSSRSupport(init);
    const element = React.cloneElement(tree, { ssrClient });
    const html = renderToStaticMarkup(element);
    const [promises, hasPending] = ssrClient.getPendingPromise();
    if (hasPending) {
      return promises.then(() => {
        const cache = ssrClient.extractCache();
        return process(cache);
      });
    } else {
      return [init, html];
    }
  }

  return process();
}

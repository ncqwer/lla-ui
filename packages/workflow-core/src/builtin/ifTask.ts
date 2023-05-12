import type { TaskStrategy } from '../type';

export const IfTaskStrategy: TaskStrategy<
  'if',
  {
    result: boolean;
    log: string;
  },
  null,
  boolean,
  {
    code: string;
    aliases?: string[];
  }
> = {
  type: 'if',
  beforeStart({ templateInfo }, { getTaskResult }, needSkip) {
    const { code, aliases } = templateInfo;
    const chainInfo = (aliases || []).reduce(
      (acc, alias) => ({
        ...acc,
        [alias]: getTaskResult(alias),
      }),
      {},
    );
    const logger = createLogger();
    const result = new Function('CHAININFO', `console`, code)(
      chainInfo,
      logger,
    );
    if (!result) needSkip();
    return {
      result: true,
      log: logger.eject(),
    };
  },
  async notifyStart({ chainId, nodeId }, _helper, { endTask }) {
    return endTask({ chainId, nodeId }, null);
  },

  async summary({ info }) {
    return info.result;
  },

  async notifyEnd() {
    return;
  },
};

const createLogger = () => {
  const strs = [] as string[];

  return {
    log: (v: string) => strs.push(v),
    warn: (v: string) => strs.push(`WARNING======>:${v}`),
    error: (v: string) => strs.push(`ERROR=====>:${v}`),
    eject: () => {
      return strs.join('\n');
    },
  };
};

declare module '../type' {
  interface CustomTaskStrategy {
    if: typeof IfTaskStrategy;
  }
}

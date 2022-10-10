import { useEffect, useLayoutEffect } from 'react';

import { isBrowser } from '../helper/isBrowser';

export const useIsomorphicEffect = isBrowser ? useLayoutEffect : useEffect;

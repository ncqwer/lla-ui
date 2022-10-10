export const [getUpdateWrapper, setUpdateWrapper] = (function () {
  let updateWrapper = (cb: () => void) => {
    cb();
  };
  return [
    () => updateWrapper,
    // eslint-disable-next-line no-unused-vars
    (nV: (cb: () => void) => void) => {
      updateWrapper = nV;
    },
  ] as const;
})();

import { Feedback } from './useField';

export const useRules = function <T>(
  ...rules: Array<(v: T) => Promise<Feedback | false>>
) {
  return async (v: T) => {
    let feedback: Feedback | false = false;
    for (const rule of rules) {
      feedback = await rule(v);
      if (feedback && feedback.type !== 'success') break;
    }
    return (
      feedback || {
        type: 'success',
      }
    );
  };
};

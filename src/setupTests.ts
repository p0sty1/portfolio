// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-canvas-mock';

global.fetch = jest.fn().mockResolvedValue({
  ok: false,
  status: 404,
  json: () => Promise.resolve({}),
});

console.error = (message: string) => {
  if (String(message).includes('AggregateError')) return;
  throw new Error(`Console error: ${message}`);
};

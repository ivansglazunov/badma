/**
 * A simple test to make sure Jest is configured correctly with TypeScript
 */
describe('Basic Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });

  it('should work with async functions', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
}); 
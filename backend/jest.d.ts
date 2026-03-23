declare global {
  function describe(name: string, fn: () => void): void;
  function describe(name: string, fn: () => Promise<void>): void;
  function it(name: string, fn: () => void): void;
  function it(name: string, fn: () => Promise<void>): void;
  function test(name: string, fn: () => void): void;
  function test(name: string, fn: () => Promise<void>): void;
  function beforeEach(fn: () => void): void;
  function beforeEach(fn: () => Promise<void>): void;
  function afterEach(fn: () => void): void;
  function afterEach(fn: () => Promise<void>): void;
  function beforeAll(fn: () => void): void;
  function beforeAll(fn: () => Promise<void>): void;
  function afterAll(fn: () => void): void;
  function afterAll(fn: () => Promise<void>): void;
  
  namespace jest {
    function fn(): any;
  }

  interface Matchers<R> {
    toBe(expected: any): R;
    toEqual(expected: any): R;
    toHaveProperty(property: string, value?: any): R;
    toHaveLength(length: number): R;
    toBeDefined(): R;
    toContain(expected: any): R;
    toBeGreaterThan(expected: number): R;
    toBeLessThan(expected: number): R;
    toThrow(expected?: any): R;
    toBeNull(): R;
    toBeUndefined(): R;
    toBeTruthy(): R;
    toBeFalsy(): R;
  }

  function expect(value: any): Matchers<void>;
}

export {};

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * This file is transpiled with metadata when executing "npm run test".
 * The result will be available in dist/test/test.js
 */

class User {
  constructor(public name: string, public friends: Set<User>) {}
}

enum Size {
  Small,
  Medium,
  Big,
}

class Car {
  constructor(public driversMap: Map<string, User>, public size: Size) {}

  public engageAutoPilot(): Promise<boolean> {
    // Asume a long task here
    return Promise.resolve(true)
  }
}

class Test {
  constructor(
    public array0: string[],
    public array1: Array<string>,
    public union0: Array<string> | Array<number>,
    public intersection0: Array<string> & Array<number>,
    public func0: (arg0: string) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public any0: any,
    public unknown0: unknown,
    public optional0: string | null | undefined,
    public optional1?: string
  ) {}
}

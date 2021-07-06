/**
 * This file is transpiled with metadata when executing "npm run test".
 * The result will be available in dist/test/test.js
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyDecorator: any = () => {}

@AnyDecorator //We need to decorate the class to emit metadata
class User {
  constructor(public name: string, public friends: Set<User>) {}
}

enum Size {
  Small,
  Medium,
  Big,
}

@AnyDecorator //We need to decorate the class to emit metadata
class Car {
  constructor(public driversByName: Map<string, User>, public driverNames: string[], public size?: Size) {}

  public engageAutoPilot(): Promise<boolean> {
    // Asume a long task here
    return Promise.resolve(true)
  }
}

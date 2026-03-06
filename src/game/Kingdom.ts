export class Kingdom {
  // Encapsulation: Private attributes
  private _gold: number;
  private _population: number;
  private _flags: Set<string>;

  constructor(initialGold: number = 100, initialPopulation: number = 50) {
    this._gold = initialGold;
    this._population = initialPopulation;
    this._flags = new Set();
  }

  // Getters
  public getGold(): number {
    return this._gold;
  }

  public getPopulation(): number {
    return this._population;
  }

  public hasFlag(flag: string): boolean {
    return this._flags.has(flag);
  }

  public addFlag(flag: string): void {
    this._flags.add(flag);
  }

  public removeFlag(flag: string): void {
    this._flags.delete(flag);
  }

  // Secure modification methods
  public modifyGold(amount: number): void {
    this._gold += amount;
    if (this._gold < 0) this._gold = 0;
  }

  public modifyPopulation(amount: number): void {
    this._population += amount;
    if (this._population < 0) this._population = 0;
  }
}

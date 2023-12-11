export class UserModel {
  constructor(
    public email: string,
    public userId: string,
    private _idToken: string,
    private _expirationDate: Date
  ) {}

  get token() {
    if (!this._expirationDate || new Date() > this._expirationDate) {
      return null;
    }

    return this._idToken;
  }
}

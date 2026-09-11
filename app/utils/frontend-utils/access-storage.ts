class AccessTokenFrontend {
  // Single global frontend access token value for the entire app.
  private accessToken: string | null = null
  constructor() {}
  setAccessToken(token: string) {
    this.accessToken = token
  }
  getAccessToken() {
    return this.accessToken
  }
}
// One global storage instance used by the frontend to read/write the token.
export const accessTokenStorage = new AccessTokenFrontend()

export class WrongAppRoleError extends Error {
  readonly role: string;

  constructor(role: string) {
    super('wrong_app_role');
    this.name = 'WrongAppRoleError';
    this.role = role;
  }
}

export class MfaRequiredError extends Error {
  readonly challengeToken: string;
  readonly email: string;
  readonly role?: string;
  readonly debugCode?: string;

  constructor(opts: { challengeToken: string; email: string; role?: string; debugCode?: string }) {
    super('mfa_required');
    this.name = 'MfaRequiredError';
    this.challengeToken = opts.challengeToken;
    this.email = opts.email;
    this.role = opts.role;
    this.debugCode = opts.debugCode;
  }
}

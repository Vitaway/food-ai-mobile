export class WrongAppRoleError extends Error {
  readonly role: string;

  constructor(role: string) {
    super('wrong_app_role');
    this.name = 'WrongAppRoleError';
    this.role = role;
  }
}

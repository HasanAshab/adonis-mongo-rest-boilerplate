import ValidationException from 'App/Exceptions/Validation/ValidationException'

export default class DuplicateEmailAndUsernameException extends ValidationException {
  public fieldsWithRule = {
    email: 'unique',
    username: 'unique'
  }
}
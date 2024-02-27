import ValidationException from '#app/Exceptions/Validation/ValidationException'

export default class EmailRequiredException extends ValidationException {
  public fieldsWithRule = { 
    email: 'required'
  }
}

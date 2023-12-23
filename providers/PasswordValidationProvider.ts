import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import PasswordStrategyManager from "App/Services/PasswordStrategies/PasswordStrategyManager"
import ComplexPasswordStrategy from "App/Services/PasswordStrategies/ComplexPasswordStrategy"
import StandardPasswordStrategy from "App/Services/PasswordStrategies/StandardPasswordStrategy"
import WeakPasswordStrategy from "App/Services/PasswordStrategies/WeakPasswordStrategy"


export default class PasswordValidationProvider {
  private passwordStrategyManager = new PasswordStrategyManager;

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.passwordStrategyManager.register(new ComplexPasswordStrategy);
    this.passwordStrategyManager.register(new StandardPasswordStrategy);
    this.passwordStrategyManager.register(new WeakPasswordStrategy);
    
    this.app.container.singleton('Adonis/Core/Validator/Rules/Password', () => ({
      PasswordStrategyManager: this.passwordStrategyManager
    }));
  }
  
  public async boot() {
    const { validator } = await import('@ioc:Adonis/Core/Validator');

    validator.rule('password', 
      async (value, [strategyName], options) => {
        const strategy = this.passwordStrategyManager.get(strategyName);
    
        if(await strategy.validate(value)) return;
        
        return options.errorReporter.report(
          options.pointer,
          `password.${strategyName}`,
          strategy.message.replace("{{ field }}", options.field),
          strategy.message,
          options.arrayExpressionPointer
        );
      },
      () => ({ async: true })
    );
  }
}
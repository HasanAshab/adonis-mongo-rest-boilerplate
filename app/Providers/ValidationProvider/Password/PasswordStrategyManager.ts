import { PasswordValidationStrategy } from '@ioc:Adonis/Core/Validator/Rules/Password';

export type PasswordValidationStrategyFactory =
	() => PasswordValidationStrategy;

export default class PasswordStrategyManager {
	protected defaultStrategy?: string;
	protected strategies = new Map<string, PasswordValidationStrategy>();
	protected factories = new Map<string, PasswordValidationStrategyFactory>();

	register(
		name: string,
		strategyFactory: string | PasswordValidationStrategyFactory,
	) {
		if (typeof strategyFactory === 'string') {
			const path = strategyFactory;
			strategyFactory = () => {
				const Strategy = require(path).default;
				return new Strategy();
			};
		}

		this.factories.set(name, strategyFactory);

		const markAsDefault = () => {
			this.defaultStrategy = name;
		};

		return { asDefault: markAsDefault };
	}

	get(name = this.defaultStrategy) {
		if (!name) {
			throw new Error(
				'Must provide a strategy name as no default strategy registered',
			);
		}

		const strategy = this.strategies.get(name) ?? this.resolveStrategy(name);
		return { name, strategy };
	}

	protected resolveStrategy(name: string) {
		const factory = this.factories.get(name);
		if (!factory) {
			throw new Error(
				`Password validation strategy "${name}" was not registered`,
			);
		}

		const strategy = factory();
		if (!strategy) {
			throw new Error(
				`Password strategy factory "${name}" must return a PasswordValidationStrategy class`,
			);
		}

		this.factories.delete(name);
		this.strategies.set(name, strategy);

		return strategy;
	}
}

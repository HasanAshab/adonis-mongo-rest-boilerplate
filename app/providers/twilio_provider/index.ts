import Config from '@ioc:adonis/core/config'
import { ApplicationService } from "@adonisjs/core/types";

export default class TwilioProvider {
  constructor(protected app: ApplicationService) {}

  public register() {
    this.app.container.singleton('Adonis/Addons/Twilio', () => {
      const Twilio = require('./Twilio').default
      return new Twilio(Config.get('twilio'))
    })
  }
}

/*
 * adonis-recaptcha2
 *
 * Source: https://git.io/JnNoc
 */

import env from '#start/env/index'
import { RecaptchaConfig } from '@ioc:Adonis/Addons/Recaptcha2'

const recaptchaConfig: RecaptchaConfig = {
  /*
  |--------------------------------------------------------------------------
  | Site Key
  |--------------------------------------------------------------------------
  |
  | The key for form
  |
  */
  siteKey: env.get('RECAPTCHA_SITE_KEY'),

  /*
  |--------------------------------------------------------------------------
  | Secret Key
  |--------------------------------------------------------------------------
  |
  | The shared key between your site and reCAPTCHA
  | * Don`t tell it to anyone
  |
  */
  secretKey: env.get('RECAPTCHA_SECRET_KEY'),

  /*
  |--------------------------------------------------------------------------
  | SSL (default: true)
  |--------------------------------------------------------------------------
  |
  | Optional
  |
  | Disable if you don't want to access the Google API via a secure connection
  |
  */
  ssl: true,

  /*
   |--------------------------------------------------------------------------
   | Views
   |--------------------------------------------------------------------------
   |
   | Enable if you need use recaptcha in Views
   |
   */
  views: false,
}
export default recaptchaConfig

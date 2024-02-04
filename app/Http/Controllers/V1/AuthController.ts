import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { bind } from '@adonisjs/route-model-binding'
import Route from '@ioc:Adonis/Core/Route'
import Event from '@ioc:Adonis/Core/Event'
import User from 'App/Models/User'
import BasicAuthService from 'App/Services/Auth/BasicAuthService'
import TwoFactorAuthService from 'App/Services/Auth/TwoFactorAuthService'
import SocialAuthService, { SocialAuthData } from 'App/Services/Auth/SocialAuthService'
import PasswordChangedMail from 'App/Mails/PasswordChangedMail'
import RegisterValidator from 'App/Http/Validators/V1/Auth/RegisterValidator'
import LoginValidator from 'App/Http/Validators/V1/Auth/Login/LoginValidator'
import ResendEmailVerificationValidator from 'App/Http/Validators/V1/Auth/ResendEmailVerificationValidator'
import ForgotPasswordValidator from 'App/Http/Validators/V1/Auth/Password/ForgotPasswordValidator'
import ResetPasswordValidator from 'App/Http/Validators/V1/Auth/Password/ResetPasswordValidator'
import SetupTwoFactorAuthValidator from 'App/Http/Validators/V1/Auth/SetupTwoFactorAuthValidator'
import AccountRecoveryValidator from 'App/Http/Validators/V1/Auth/AccountRecoveryValidator'
import SocialAuthTokenLoginValidator from 'App/Http/Validators/V1/Auth/Login/SocialAuthTokenLoginValidator'

export default class AuthController {
  public static readonly VERSION = 'v1'

  constructor(
    private readonly authService = new BasicAuthService(),
    private readonly twoFactorAuthService = new TwoFactorAuthService(),
    private readonly socialAuthService = new SocialAuthService()
  ) {}

  /**
   * @register
   * @responseBody 201 - { "message": "Verification email sent", "data": { "user": <User>, "token": } }
   */
  public async register({ request, response }: HttpContextContract) {
    const registrationData = await request.validate(RegisterValidator)

    const user = await this.authService.register(registrationData)

    Event.emit('registered', {
      version: AuthController.VERSION,
      method: 'internal',
      user,
    })
    //Event.fire(new Registered({}))

    const profileUrl = '' //Route.makeUrl(AuthController.VERSION + ".users.show", [user.username]);

    response.header('Location', profileUrl).created({
      message: 'Verification email sent!',
      data: {
        token: await user.createToken(),
        user,
      },
    })
  }

  /**
   * @login
   * @responseBody 200 - { message: <string>, data: { token: } }
   */
  public async login({ request }: HttpContextContract) {
    const token = await this.authService.attempt({
      ...(await request.validate(LoginValidator)),
      ip: request.ip(),
    })

    return {
      message: 'Logged in successfully!',
      data: { token },
    }
  }

  /**
   * @logout
   * @responseBody 200 - { message: <string> }
   */
  public async logout({ auth }: HttpContextContract) {
    await auth.logout()
    return 'Logged out successfully!'
  }

  /**
   * @verifyEmail
   * @responseBody 301
   */
  @bind()
  public async verifyEmail({ response }, user: User) {
    await user.markAsVerified()
    //await User.where('id', id).update({ verified: true });
    response.redirectToClient('verify.success')
  }

  async resendEmailVerification({ request }: HttpContextContract) {
    const { email } = await request.validate(ResendEmailVerificationValidator)
    await this.authService.sendVerificationMail(email, AuthController.VERSION)
    return 'Verification link sent to email!'
  }

  
  public async forgotPassword({ request, response }: HttpContextContract) {
    const { email } = await request.validate(ForgotPasswordValidator)
    await this.authService.sendResetPasswordMail(email)
    response.accepted('Password reset link sent to your email!')
  }

  @bind()
  public async resetPassword({ request }: HttpContextContract, user: User) {
    const { password, token } = await request.validate(ResetPasswordValidator)
    await this.authService.resetPassword(user, token, password)
    await new PasswordChangedMail(user).sendLater()
    return 'Password changed successfully!'
  }

  public async setupTwoFactorAuth({ request, auth }: HttpContextContract) {
    const { enable = true, method } = await request.validate(SetupTwoFactorAuthValidator)

    if (!enable) {
      await this.twoFactorAuthService.disable(auth.user!)
      return 'Two Factor Auth disabled!'
    }

    return {
      message: 'Two Factor Auth enabled!',
      data: await this.twoFactorAuthService.enable(auth.user!, method),
    }
  }

  /**
   * @generateRecoveryCodes
   * @responseBody 200 - { message: string }
   */
  @bind()
  public async sendOtp({}, user: User) {
    await this.twoFactorAuthService.sendOtp(user)
    return '6 digit OTP code sent to phone number!'
  }
  
  /**
   * @generateRecoveryCodes
   * @responseBody 200 - { data: string[] }
   */
  public generateRecoveryCodes({ auth }: AuthenticRequest) {
    return this.twoFactorAuthService.generateRecoveryCodes(auth.user!)
  }

  public async recoverAccount({ request }: HttpContextContract) {
    const { email, code } = await request.validate(AccountRecoveryValidator)
    const token = await this.twoFactorAuthService.recover(email, code)

    return {
      message: 'Account recovered successfully!',
      data: { token },
    }
  }

  public async loginWithSocialAuthToken({ params, ally, request }: HttpContextContract) {
    let { token, email, username } = await request.validate(SocialAuthTokenLoginValidator)

    const data: SocialAuthData = await ally.use(params.provider).userFromToken(token)
    
    data.username = username
    
    if (email) {
      data.email = email
      data.emailVerificationState = 'unverified'
    }

    const { user, isRegisteredNow } = await this.socialAuthService.upsertUser(params.provider, data)

    if (isRegisteredNow) {
      Event.emit('registered', {
        version: AuthController.VERSION,
        method: 'social',
        user,
      })
    }

    return {
      message: 'Logged in successfully!',
      data: {
        token: await user.createToken(),
        user,
      },
    }
  }

  /* 
  redirectToSocialLoginProvider({ params, ally }: HttpContextContract) {
    return ally.use(params.provider).stateless().redirect();
  }
  
  async loginWithSocialProvider({ request, params, ally }: HttpContextContract) {

    const externalUser = await ally.use(params.provider).user();
    log(externalUser)
    return externalUser.token.token
    const user = await User.findOneAndUpdate(
      { [`externalId.${params.provider}`]: externalUser.id },
      { 
        name: externalUser.name,
        email: externalUser.email,
        verified: true,
        profile: externalUser.picture
      },
      { new: true }
    );
    
    if(user) {
      return Route.makeClientUrl(`/login/social/${params.provider}/success/${user.createToken()}`);
    }
    
    const fields = externalUser.email ? "username" : "email,username";
    const token = await this.createSocialLoginFinalStepToken(params.provider, externalUser);
    
    return Route.makeClientUrl(`/login/social/${params.provider}/final-step/${externalUser.id}/${token}?fields=${fields}`);
  }
*/
}

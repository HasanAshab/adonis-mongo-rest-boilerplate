import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { inject } from "@adonisjs/fold"
import Route from '@ioc:Adonis/Core/Route'
import Event from '@ioc:Adonis/Core/Event'
import User, { UserDocument } from "App/Models/User"
import BasicAuthService from "App/Services/Auth/BasicAuthService";
import RegisterValidator from "App/Http/Validators/V1/Auth/RegisterValidator";
import LoginValidator from "App/Http/Validators/V1/Auth/LoginValidator";
import ForgotPasswordValidator from "App/Http/Validators/V1/Auth/Password/ForgotPasswordValidator";
import ResetPasswordValidator from "App/Http/Validators/V1/Auth/Password/ResetPasswordValidator";


@inject()
export default class AuthController {
  //constructor(private authService: AuthService, private socialAuthService: SocialAuthService) {}
  constructor(private readonly authService: BasicAuthService) {}
  
  async register({ request, response, auth }: HttpContextContract) {
    const userData = await request.validate(RegisterValidator);
    userData.profile = request.file('profile');
    
    const user = await User.create(userData);
    await user.createDefaultSettings();

    Event.emit("user:registered", {
      version: "v1",
      method: "internal",
      user
    });

    const profileUrl = ''//Route.makeUrl("v1_users.show", [user.username]);

    response.header("Location", profileUrl).created({
      message: "Verification email sent!",
      token: await auth.use('api').generate(user),
      data: { user }
    });
  }
  
  async login({ request, response }: HttpContextContract) {
    const { email, password, otp } = await request.validate(LoginValidator);
    const token = await this.authService.login(email, password, otp, request.ip());
    return {
      message: "Logged in successfully!",
      token
    }
  }
  
  async forgotPassword({ request, response }: HttpContextContract){
    const { email } = await request.validate(ForgotPasswordValidator);
    await this.authService.forgotPassword(email);
    response.accepted("Password reset link sent to email!");
  };

  async resetPassword({ request }: HttpContextContract){
    const { id, password, token } = await request.validate(ResetPasswordValidator);
    const user = await User.findByIdOrFail(id);
    await this.authService.resetPassword(user, token, password);
    await Mail.to(user.email).send(new PasswordChangedMail());
    return "Password changed successfully!";
  };
 

  
 /* 
  redirectToSocialLoginProvider({ params, ally }: HttpContextContract) {
    return ally.use(params.provider).stateless().redirect();
  }
  
  async loginWithSocialProvider({ params, ally }: HttpContextContract) {
    const externalUser = await ally.use(params.provider).user();
    console.log(externalUser)
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

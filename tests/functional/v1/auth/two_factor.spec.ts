import { test } from '@japa/runner'
import User from 'App/Models/User'
import TwoFactorAuthService from 'App/Services/Auth/TwoFactor/TwoFactorAuthService'
import Token from 'App/Models/Token'
import Twilio from '@ioc:Adonis/Addons/Twilio'
import TwoFactorAuthRequiredException from 'App/Exceptions/TwoFactorAuthRequiredException'
import PhoneNumberRequiredException from 'App/Exceptions/PhoneNumberRequiredException'
import Otp from 'App/Services/Auth/Otp'


/*
Run this suits:
node ace test functional --files="v1/auth/two_factor.spec.ts"
*/
test.group('Auth/TwoFactor', (group) => {
  const twoFactorAuthService = new TwoFactorAuthService()
  let user: User
  let token: string

  refreshDatabase(group)
  

  group.each.setup(() => {
    Twilio.fake()
  })
  
  test('should recover account with valid recovery code', async ({ client }) => {
    const user = await User.factory().twoFactorAuthEnabled().create()
    const [code] = await twoFactorAuthService.generateRecoveryCodes(user, 1)
    
    const response = await client.post('/api/v1/auth/two-factor/recover').json({
      email: user.email,
      code
    })

    response.assertStatus(200)
    response.assertBodyHaveProperty('data.token')
  })

  test("shouldn't recover account with same recovery code", async ({ client }) => {
    const user = await User.factory().twoFactorAuthEnabled().create()
    const data = {
      email: user.email,
      code: (await twoFactorAuthService.generateRecoveryCodes(user, 1))[0],
    }

    const response1 = await client.post('/api/v1/auth/two-factor/recover').json(data)
    const response2 = await client.post('/api/v1/auth/two-factor/recover').json(data)

    response1.assertStatus(200)
    response2.assertStatus(401)
    response1.assertBodyHaveProperty('data.token')
    response2.assertBodyNotHaveProperty('data.token')
  })

  test("shouldn't recover account with invalid recovery code", async ({ client }) => {
    const user = await User.factory().twoFactorAuthEnabled().create()
    await twoFactorAuthService.generateRecoveryCodes(user, 1)

    const response = await client.post('/api/v1/auth/two-factor/recover').json({
      email: user.email,
      code: 'foo-bar',
    })
    
    response.assertStatus(401)
    response.assertBodyNotHaveProperty('data.token')
  })


  test('Should send otp through {$self}') 
  .with(['sms', 'call'])
  .run(async ({ client }, method) => {
    const user = await User.factory().withPhoneNumber().twoFactorAuthEnabled(method).create()
    const token = await new TwoFactorAuthRequiredException(user).challengeToken()

    const response = await client.post(`/api/v1/auth/two-factor/challenges`)
      .json({
        email: user.email,
        token
      })

    response.assertStatus(200)
    if(method === 'sms') {
      Twilio.assertMessaged(user.phoneNumber)
    }
    else {
      Twilio.assertCalled(user.phoneNumber)
    }
  })

  test('Should not send otp through {$self} to phone numberless user') 
  .with(['sms', 'call'])
  .run(async ({ client }, method) => {
    const user = await User.factory().twoFactorAuthEnabled(method).create()
    const token = await new TwoFactorAuthRequiredException(user).challengeToken()

    const response = await client.post(`/api/v1/auth/two-factor/challenges`)
      .json({
        email: user.email,
        token
      })

    response.assertStatus(400)
    response.assertBodyContainProperty('errors[0]', {
      code: new PhoneNumberRequiredException().code
    })
  })

  
  test('should login a user with valid otp', async ({ client }) => {
    const user = await User.factory().withPhoneNumber().twoFactorAuthEnabled('sms').create()
    const token = await Otp.generate(user.twoFactorSecret)

    const response = await client.post('/api/v1/auth/two-factor/verification').json({
      email: user.email,
      token,
    })

    response.assertStatus(200)
    response.assertBodyHaveProperty('data.token')
  })

  test("shouldn't login a user with invalid OTP", async ({ client }) => {
    const user = await User.factory().withPhoneNumber().twoFactorAuthEnabled().create()
    
    const response = await client.post('/api/v1/auth/two-factor/verification').json({
      email: user.email,
      token: '123456'
    })

    response.assertStatus(401)
    response.assertBodyNotHaveProperty('data.token')
  })
})

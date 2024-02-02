import { test } from '@japa/runner';
import type { AllyUserContract } from '@ioc:Adonis/Addons/Ally'
import User from 'App/Models/User';
import SocialAuthService from 'App/Services/Auth/SocialAuthService';
eda koi
//import EmailAndUsernameRequiredException from 'App/Exceptions/Validation/EmailAndUsernameRequiredException'
import EmailRequiredException from 'App/Exceptions/Validation/EmailRequiredException'
import UsernameRequiredException from 'App/Exceptions/Validation/UsernameRequiredException'
import DuplicateEmailAndUsernameException from 'App/Exceptions/Validation/DuplicateEmailAndUsernameException'
import DuplicateUsernameException from 'App/Exceptions/Validation/DuplicateUsernameException'
import DuplicateEmailException from 'App/Exceptions/Validation/DuplicateEmailException'


/*
Run this suits:
node ace test unit --files="services/auth/social_auth_service.spec.ts"
*/
test.group('Services/Auth/SocialAuthService', group => {
  const service = new SocialAuthService();
  
  refreshDatabase(group);

  //Create
  test('should create a new user', async ({ expect }) => {
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      email: 'test@example.com',
      emailVerificationState: 'verified'
    }
    
    const result = await service.upsertUser('google', allyUser)
    
    expect(result.user.email).toBe(allyUser.email)
    expect(result.user.username).toBe('test')
    expect(result.user.verified).toBe(true)
    expect(result.user.socialAvatarUrl).toBe(allyUser.avatarUrl)
    expect(result.isRegisteredNow).toBe(true)
  })

  test('should create user with verification status "{status}" when email verification state is {state}')
  .with([
    { state: 'verified', status: true },
    { state: 'unverified', status: false },
    { state: 'unsupported', status: false }
  ])
  .run(async ({ expect }, { state, status }) => {
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      email: 'test@example.com',
      emailVerificationState: state
    }
    
    const result = await service.upsertUser('google', allyUser)

    expect(result.user.verified).toBe(status)
  });
 
  test('should generate username from email', async ({ expect }) => {
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerificationState: 'verified'
    }
    
    const result = await service.upsertUser('google', allyUser)
    
    expect(result.user.username).toBe('test')
  })
  
  
  //Update
  test('should update name and avatar', async ({ expect }) => {
    const socialProvider = 'google';

    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      emailVerificationState: 'verified'
    }
    
    const user = await User.create({
      socialId: allyUser.id,
      socialProvider,
      email: allyUser.email,
      username: 'test',
      name: 'Old Name',
      socialAvatarUrl: 'http://example.com/old-avatar.jpg'
    })

    const result = await service.upsertUser(socialProvider, allyUser)
  
    expect(result.user.name).toBe(allyUser.name)
    expect(result.user.socialAvatarUrl).toBe(allyUser.avatarUrl)
  })
  
  test('should not update email', async ({ expect }) => {
    const socialProvider = 'google';

    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      email: 'test.new@example.com',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      emailVerificationState: 'verified'
    }
    
    const user = await User.create({
      socialId: allyUser.id,
      socialProvider,
      email: 'test@example.com',
      username: 'test',
    })

    const result = await service.upsertUser(socialProvider, allyUser)
  
    expect(result.user.email).toBe(user.email);
  })
  
  test('should not update username', async ({ expect }) => {
    const socialProvider = 'google';
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      email: 'test.new@example.com',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      emailVerificationState: 'verified'
    }
    
    const user = await User.create({
      socialId: allyUser.id,
      socialProvider,
      email: 'test@example.com',
      username: 'test',
    })

    const result = await service.upsertUser(socialProvider, allyUser, 'test12')
  
    expect(result.user.username).toBe(user.username);
  })

  
  test('should not update username based on the new email provided by oauth', async ({ expect }) => {
    const socialProvider = 'google';
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      email: 'test.new@example.com',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      emailVerificationState: 'verified'
    }
    
    const user = await User.create({
      socialId: allyUser.id,
      socialProvider,
      email: 'test@example.com',
      username: 'test',
    })

    const result = await service.upsertUser(socialProvider, allyUser)
  
    expect(result.user.username).toBe(user.username);
  })
  

  test('should update user verification status to {status} when oauth provided email is same and email verification state is {state}')
  .with([
    { state: 'verified', status: true },
    { state: 'unverified', status: false },
    { state: 'unsupported', status: false },
  ])
  .run(async ({ expect }, { state, status }) => {
    const socialProvider = 'google';

    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      email: 'test.new@example.com',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      emailVerificationState: state
    }
    
    const user = await User.create({
      socialId: allyUser.id,
      socialProvider,
      email: 'test@example.com',
      username: 'test',
      verified: status
    })

    const result = await service.upsertUser(socialProvider, allyUser)
  
    expect(result.user.verified).toBe(status);
  })
  
  test('should not update user verification status from {status} when social email not match and email verification state is {state}')
  .with([
    { state: 'verified', status: false },
    { state: 'verified', status: true },
    { state: 'unverified', status: false },
    { state: 'unverified', status: true },
    { state: 'unsupported', status: false },
    { state: 'unsupported', status: true },
  ])
  .run(async ({ expect }, { state, status }) => {
    const socialProvider = 'google';

    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      email: 'test.new@example.com',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      emailVerificationState: state
    }
    
    const user = await User.create({
      socialId: allyUser.id,
      socialProvider,
      email: 'test@example.com',
      username: 'test',
      verified: status
    })

    const result = await service.upsertUser(socialProvider, allyUser)
  
    expect(result.user.verified).toBe(status);
  })
  
  
  // Registered Flag
  test('should flag registered when email provided by oauth and unique username genrated successfully', async ({ expect }) => {
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      email: 'test@example.com',
      emailVerificationState: 'verified'
    }
    
    const result = await service.upsertUser('google', allyUser)

    expect(result.isRegisteredNow).toBe(true)
  })

  test('should flag registered for first time only', async ({ expect }) => {
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      email: 'test@example.com',
      emailVerificationState: 'verified'
    }
    
    const result1 = await service.upsertUser('google', allyUser)
    const result2 = await service.upsertUser('google', allyUser)

    expect(result1.isRegisteredNow).toBe(true)
    expect(result2.isRegisteredNow).toBe(false)
  })
  
  
  //Validation Exception
  test('should throw validation exception when email not provided by the oauth provider', async ({ expect, assert }) => {
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      emailVerificationState: 'unsupported'
    }
    const result = service.upsertUser('google', allyUser, 'test')

    await expect(result).rejects.toThrow(EmailRequiredException)
  })

  test('should throw validation exception if email is not unique', async ({ expect }) => {
    const email = 'test@example.com'
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      email,
      emailVerificationState: 'verified'
    }
    
    await User.create({ email })
    const result = service.upsertUser('google', allyUser)

    await expect(result).rejects.toThrow(DuplicateEmailException);
  })

  test('should throw validation exception if failed to generate unique username', async ({ expect }) => {
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      email: 'test@example.com',
      emailVerificationState: 'verified'
    }
    //todo
    User.prototype.generateUsername = () => null
    const result = service.upsertUser('google', allyUser)
    
    await expect(result).rejects.toThrow(UsernameRequiredException);
  })
  
  test('should throw validation exception if provided username is not unique', async ({ expect }) => {
    const username = 'test'
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerificationState: 'verified'
    }
    
    await User.create({ username })
    const result = service.upsertUser('google', allyUser, username)

    await expect(result).rejects.toThrow(DuplicateUsernameException);
  })

  test('should throw validation exception if email and provided username is not unique', async ({ expect }) => {
    const email = 'test@example.com'
    const username = 'test'
    
    const allyUser: Partial<AllyUserContract> = {
      id: '1',
      name: 'Test User',
      avatarUrl: 'http://example.com/avatar.jpg',
      email,
      emailVerificationState: 'verified'
    }
    
    await User.create({ email, username })
    const result = service.upsertUser('google', allyUser, username)

    await expect(result).rejects.toThrow(DuplicateEmailAndUsernameException);
  })
})

	
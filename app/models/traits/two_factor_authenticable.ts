import type { NormalizeConstructor } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import Encryption from '@ioc:adonis/core/encryption'
import RecoveryCode from '#services/auth/two_factor/recovery_code'
import { authenticator } from 'otplib';
import qrcode from 'qrcode';


type TwoFactorEnabled<T> = Required<Pick<T, 'twoFactorMethod' | 'twoFactorSecret'>>;


export default function TwoFactorAuthenticable(Superclass: NormalizeConstructor<typeof BaseModel>) {
  return class extends Superclass {
    public static boot() {
      if (this.booted) return
      super.boot()
      
      column()(this.prototype, 'twoFactorEnabled')
      column()(this.prototype, 'twoFactorMethod')
      column({ serializeAs: null })(this.prototype, 'twoFactorSecret')
      column({ serializeAs: null })(this.prototype, 'twoFactorRecoveryCodes')
    }

    public twoFactorEnabled = false
    public twoFactorMethod: string | null = null
    public twoFactorSecret: string | null = null
    public twoFactorRecoveryCodes: string | null = null
    
    public hasEnabledTwoFactorAuth() {
      return this.twoFactorEnabled
    }
    
    public recoveryCodes() {
      return this.twoFactorRecoveryCodes 
        ? JSON.parse(Encryption.decrypt(this.twoFactorRecoveryCodes))
        : []
    }
    

    public isValidRecoveryCode(code: string) {
      return !!this.recoveryCodes().find(recoveryCode => recoveryCode === code)
    }
    
    public replaceRecoveryCode(code: string) {
      this.twoFactorRecoveryCodes = Encryption.encrypt(
        Encryption.decrypt(this.twoFactorRecoveryCodes).replace(code, RecoveryCode.generate())
      )
      return this.save()
    }
    
    public twoFactorQrCodeUrl() {
      return this.twoFactorSecret
        ? authenticator.keyuri(this.email, this.twoFactorMethod, this.twoFactorSecret)
        : null
    }
    
    public async twoFactorQrCodeSvg() {
      return this.twoFactorSecret
        ? await qrcode.toString(this.twoFactorQrCodeUrl(), { type: 'svg' })
        : null
    }
  }
}
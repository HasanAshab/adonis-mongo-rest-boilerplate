import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import LoggedDevice from '#models/logged_device'

export default function LoginActivityTrackable(Superclass: NormalizeConstructor<typeof BaseModel>) {
  class LoginActivityTrackableModel extends Superclass {
    @manyToMany(() => LoggedDevice, {
      pivotColumns: ['ip_address', 'last_logged_at']
    })
    declare loggedDevices: ManyToMany<typeof LoggedDevice>
    

    createLoginSession(loggedDevice: LoggedDevice, ipAddress: string) {
      const accessToken = await this.createToken()
      await this.related('loginSessions').create({
        accessTokenId: accessToken.identifier,
        loggedDeviceId: loggedDevice.id
      })
      await this.related('loggedDevices').sync(
        {
          [loggedDevice.id]: { 
            last_logged_at: DateTime.local(),
            ip_address: ipAddress
          },
        },
        false
      )
      return accessToken
    }
  }
  return LoginActivityTrackableModel
}

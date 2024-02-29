import router from '@adonisjs/core/services/router'

const SettingsController = () => import("#app/http/controllers/v1/settings_controller")

// User settings management
router.group(() => {
  // Two-factor authentication settings
  router.group(() => {
    router.get('/', [SettingsController, 'twoFactorAuth'])
    router.post('/', [SettingsController, 'enableTwoFactorAuth'])
    router.delete('/', [SettingsController, 'disableTwoFactorAuth'])
    router.patch('/method', [SettingsController, 'updateTwoFactorAuthMethod'])
    router.get('/qr-code', [SettingsController, 'twoFactorAuthQrCode'])
    router.get('/recovery-codes', [SettingsController, 'recoveryCodes'])
    router.post('/recovery-codes', [SettingsController, 'generateRecoveryCodes'])
  })
    .prefix('two-factor-auth')

  // Notification preferences settings
  router.group(() => {
    router.get('/', [SettingsController, 'notificationPreference'])
    router.patch('/', [SettingsController, 'updateNotificationPreference'])
    router.delete('/email-subscription', [SettingsController, 'unsubscribeEmailNotification'])
    router.post('/email-subscription', [SettingsController, 'resubscribeEmailNotification'])
  })
    .prefix('notification-preferences')
})
.middleware(['auth', 'verified'])

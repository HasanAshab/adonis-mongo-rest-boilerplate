import type { HttpContext } from '@adonisjs/core/http'
import { bind } from '@adonisjs/route-model-binding'
import NotificationType from '#app/models/notification_type'
import CreateNotificationTypeValidator from '#app/http/validators/v1/notification_type/create_notification_type_validator'
import UpdateNotificationTypeValidator from '#app/http/validators/v1/notification_type/update_notification_type_validator'
import NotificationTypeCollection from '#app/http/resources/v1/notification_type/notification_type_collection'


export default class NotificationTypesController {
  public async index() {
    return NotificationTypeCollection.make(await NotificationType.all())
  }
  
  public async store({ request, response }: HttpContext) {
    const data = await request.validate(CreateNotificationTypeValidator)
    return response.created(await NotificationType.create(data))
  }

  @bind()
  public show({ params }: HttpContext, notificationType: NotificationType) {
    return notificationType
  }
  
  public async update({ request, params }: HttpContext) {
    const data = await request.validate(UpdateNotificationTypeValidator)
    await NotificationType.updateOrFail(params.id, data)
    
    return 'Notification type updated!'
  }
  
  public async delete({ response, params }: HttpContext) {
    await NotificationType.deleteOrFail(params.id)
    response.noContent()
  }
}
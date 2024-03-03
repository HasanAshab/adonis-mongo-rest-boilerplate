//import ResourceCollection from '@samer/api-resource/resources/resource_collection'
import ListNotificationResource from '#app/http/resources/v1/notification/list_notification_resource'
import { groupBy } from 'lodash'

export default class NotificationCollection extends ResourceCollection {
  protected collects = ListNotificationResource

  public serialize() {
    return {
      data: groupBy(this.collection, (listNotificationResource) => {
        return listNotificationResource.resource.createdAt.startOf('day').toRelative()
      }),
    }
  }
}
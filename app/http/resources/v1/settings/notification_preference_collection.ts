//import JsonResource from '@samer/api-resource/resources/json_resource'
import { groupBy } from 'lodash-es'

export default class NotificationPreferenceCollection extends ResourceCollection {

  public serialize() {
    return {
      data: groupBy(this.collection, 'resource.groupName')
    }
  }
}

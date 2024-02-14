import Client from '@ioc:Adonis/Addons/Client'

Client.addPaths({
  'verify': '/email/verify/:id/:token',
  'password.reset': '/password/reset/:id/:token',
})

//TODO
import JsonResource from '../res_dev/json_resource'
import ResourceCollection from '../res_dev/resource_collection'
globalThis.JsonResource = JsonResource
globalThis.ResourceCollection = ResourceCollection
globalThis.log = console.log



import User from 'App/Models/User'
import DB from '@ioc:Adonis/Lucid/Database'
import NotificationService from 'App/Services/NotificationService'
import OptInNotification from 'App/Notifications/OptInNotification'


(async () => {
 // MzQ.elKc5me03sIQa6OVkYdGBNlxN_7r2XveilYKMG1Fr2HnqLXD0B3FE1sLKeHY 
  const user = await User.factory().create()
  //const user = await User.firstOrFail()
// return log((await user.createToken()).token)
  log(await NotificationPreference.all())
  await user.syncNotificationPreference({
    [1]: {
      email: true,
      app: true
    }
  })
  

    await user.syncNotificationPreference()
    
  const notif = new OptInNotification()
  notif.notificationType = 'announcement'
  log(await notif.via(user))
  
//log((await user.createToken()).token)
//MQ.Kf6_q3-Ea4MkmqQxbNo7xCpqg3NFIRw8dA88vSdr8Fu0OkmHSEHnpAvXtOa0
  //const c =  await Contact.search('project')

  //const c =  await Contact.query().where('search_vector', '@@', DB.raw("to_tsquery('project')")).select('subject', 'message').pojo()
  //log(c)
})

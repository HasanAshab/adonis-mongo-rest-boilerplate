import Config from '@ioc:adonis/core/config'
import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
  protected tableName = 'notification_types'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', Config.get('app.constraints.notificationType.name.maxLength')).unique().notNullable()
      table.string('display_text', Config.get('app.constraints.notificationType.displayText.maxLength')).notNullable()
      table.string('group_name', Config.get('app.constraints.notificationType.groupName.maxLength')).notNullable()
      table.string('description', Config.get('app.constraints.notificationType.description.maxLength')).notNullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}

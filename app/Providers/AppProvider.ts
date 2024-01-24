import type { ApplicationContract } from '@ioc:Adonis/Core/Application';
import { getStatusText } from 'http-status-codes';

export default class AppProvider {
	constructor(protected app: ApplicationContract) {}

	private extendModelQueryBuilder() {
	  const { ModelQueryBuilder } = this.app.container.use('Adonis/Lucid/Database');
    const { BaseModel } = this.app.container.use('Adonis/Lucid/Orm');


    ModelQueryBuilder.macro('whereEqual', function (fields: Record<string, any>) {
      for(const name in fields) {
	      this.where(name, fields[name]);
	    }
	    return this;
    });
    
    ModelQueryBuilder.macro('exists', async function () {
	    return !!await this.first();
    });
    
    ModelQueryBuilder.macro('except', function (modelOrId: BaseModel | number) {
	    const id = modelOrId instanceof BaseModel
  	    ? modelOrId.id
  	    : modelOrId;
	    return this.whereNot('id', id);
    });
    
    ModelQueryBuilder.macro('when', function(condition: boolean, cb: QueryBuilderCallback) {
	    if(condition) {
	      cb(this);
	    }
	    return this;
    });
	}

	private extendHttpResponse() {
		const Response = this.app.container.use('Adonis/Core/Response');
		const { types } = this.app.container.use('Adonis/Core/Helpers');

		Response.getter('isSuccessful', function () {
			return this.response.statusCode >= 200 && this.response.statusCode < 300;
		});

		Response.getter('standardMessage', function () {
			return getStatusText(this.response.statusCode);
		});

		Response.macro('sendOriginal', Response.prototype.send);

		Response.macro(
			'send',
			function (
				body: null | string | Record<string, any> | any[] = {},
				generateEtag = this.config.etag,
			) {
				const acceptsJson = this.request.headers.accept === 'application/json';
				if (acceptsJson) {
					if (types.isNull(body)) {
						body = {};
					} 
					else if (types.isString(body)) {
						body = { message: body };
					} 
					else if(body.toJSON) {
				    body = body.toJSON()
				  }
					else if (types.isArray(body)) {
						body = { data: body };
					}

					if (!body.success) {
						body.success = this.isSuccessful;
					}

					if (!body.message) {
						body.message = this.standardMessage;
					}
				}

				return this.sendOriginal(body, generateEtag);
			},
		);

		Response.macro('sendStatus', function (code: number) {
			this.status(code).send({});
			return this;
		});

		Response.macro('setHeaders', function (data: object) {
			for (const key in data) {
				this.header(key, data[key]);
			}
			return this;
		});

		Response.macro('safeHeaders', function (data: object) {
			for (const key in data) {
				this.safeHeader(key, data[key]);
			}
			return this;
		});
	}
	
	
	public boot() {
		this.extendModelQueryBuilder();
		this.extendHttpResponse();
	}
}

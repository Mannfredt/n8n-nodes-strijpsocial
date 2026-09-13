import {
	NodeApiError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type JsonObject,
} from 'n8n-workflow';

/**
 * postReceive handler shared by every operation. Requires
 * `ignoreHttpStatusErrors: true` on requestDefaults so non-2xx responses reach
 * here instead of throwing generically. Maps StrijpSocial API errors to
 * readable n8n errors.
 */
export async function handleErrors(
	this: IExecuteSingleFunctions,
	data: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = response.statusCode;
	if (status < 400) {
		return data;
	}

	const body = (response.body ?? {}) as IDataObject;
	const apiMessage =
		(body.message as string) || (body.error as string) || (body.detail as string);

	let message: string;
	switch (status) {
		case 401:
			message = 'Invalid API key — check your StrijpSocial credentials.';
			break;
		case 403:
			message = "Your API key doesn't have the required scope for this operation.";
			break;
		case 422:
			message = apiMessage || 'Validation failed. Check the values you sent to StrijpSocial.';
			break;
		default:
			message = apiMessage || `StrijpSocial API request failed with status ${status}.`;
	}

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		message,
		httpCode: String(status),
	});
}

/** Split a comma-separated string into a trimmed, non-empty array. */
export function splitTags(raw: string): string[] {
	return raw
		.split(',')
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
}

interface VariantOverride {
	channelId: string;
	body: string;
}

interface CreateAdditionalFields {
	timezone?: string;
	variants?: { variant?: VariantOverride[] };
}

/**
 * preSend for Post → Create. Assembles the full request body: builds one
 * variant per selected channel (applying per-channel body overrides), splits
 * tags, computes the status default, and always stamps source: "n8n".
 */
export async function buildCreateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = this.getNodeParameter('body') as string;
	const channelIds = this.getNodeParameter('channelIds', []) as string[];
	const status = this.getNodeParameter('status', 'draft') as string;
	const scheduledAt = this.getNodeParameter('scheduledAt', '') as string;
	const tagsRaw = this.getNodeParameter('tags', '') as string;
	const label = this.getNodeParameter('label', '') as string;
	const additional = this.getNodeParameter('additionalFields', {}) as CreateAdditionalFields;

	const overrides = new Map<string, string>();
	for (const v of additional.variants?.variant ?? []) {
		if (v.channelId) {
			overrides.set(v.channelId, v.body);
		}
	}

	const variants = channelIds.map((channelId) => ({
		channel_id: channelId,
		body: overrides.get(channelId) ?? body,
	}));

	// Default: "scheduled" when a time is set and the user left the default "draft".
	const finalStatus = scheduledAt && status === 'draft' ? 'scheduled' : status;

	const payload: IDataObject = {
		body,
		status: finalStatus,
		source: 'n8n',
		variants,
	};
	if (label) payload.label = label;
	if (scheduledAt) payload.scheduled_at = scheduledAt;
	if (additional.timezone) payload.timezone = additional.timezone;
	const tags = splitTags(tagsRaw);
	if (tags.length > 0) payload.tags = tags;

	requestOptions.body = payload;
	return requestOptions;
}

interface UpdateFields {
	body?: string;
	label?: string;
	scheduledAt?: string;
	tags?: string;
}

/** preSend for Post → Update. Sends only the fields the user filled in. */
export async function buildUpdateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const fields = this.getNodeParameter('updateFields', {}) as UpdateFields;

	const payload: IDataObject = {};
	if (fields.body !== undefined && fields.body !== '') payload.body = fields.body;
	if (fields.label !== undefined && fields.label !== '') payload.label = fields.label;
	if (fields.scheduledAt) payload.scheduled_at = fields.scheduledAt;
	if (fields.tags) payload.tags = splitTags(fields.tags);

	requestOptions.body = payload;
	return requestOptions;
}

import {
	NodeConnectionTypes,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { postDescription } from './resources/post';
import { channelDescription } from './resources/channel';

interface Channel {
	id: string;
	platform: string;
	display_name: string;
	handle?: string;
	status?: string;
}

export class StrijpSocial implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'StrijpSocial',
		name: 'strijpSocial',
		icon: { light: 'file:strijpsocial.svg', dark: 'file:strijpsocial.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Schedule and publish posts across multiple social platforms',
		defaults: {
			name: 'StrijpSocial',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'strijpsocialApi', required: true }],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			// Let non-2xx responses through so handleErrors can map them to
			// readable messages instead of a generic HTTP error.
			ignoreHttpStatusErrors: true,
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Post', value: 'post' },
					{ name: 'Channel', value: 'channel' },
				],
				default: 'post',
			},
			...postDescription,
			...channelDescription,
		],
	};

	methods = {
		loadOptions: {
			async getChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('strijpsocialApi');
				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'strijpsocialApi',
					{
						method: 'GET',
						baseURL: credentials.baseUrl as string,
						url: '/channels',
					},
				)) as Channel[] | { data: Channel[] };

				const channels = Array.isArray(response) ? response : (response.data ?? []);

				return channels.map((channel) => ({
					name: `${channel.display_name} (${channel.platform})`,
					value: channel.id,
				}));
			},
		},
	};
}

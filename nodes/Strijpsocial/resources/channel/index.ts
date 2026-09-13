import type { INodeProperties } from 'n8n-workflow';
import { handleErrors } from '../../shared/utils';

const showOnlyForChannels = {
	resource: ['channel'],
};

export const channelDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForChannels,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many channels',
				description: 'List many connected social channels',
				routing: {
					request: {
						method: 'GET',
						url: '/channels',
					},
					output: {
						postReceive: [handleErrors],
					},
				},
			},
		],
		default: 'getAll',
	},
];

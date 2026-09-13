import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPostGet = {
	operation: ['get'],
	resource: ['post'],
};

export const postGetDescription: INodeProperties[] = [
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForPostGet },
		description: 'The ID of the post to retrieve',
	},
];

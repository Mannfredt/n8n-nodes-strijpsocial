import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPostDelete = {
	operation: ['delete'],
	resource: ['post'],
};

export const postDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForPostDelete },
		description: 'The ID of the post to delete',
	},
];

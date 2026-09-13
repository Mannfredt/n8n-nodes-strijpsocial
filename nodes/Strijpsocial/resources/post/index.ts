import type { INodeProperties } from 'n8n-workflow';
import { handleErrors, buildCreateBody, buildUpdateBody } from '../../shared/utils';
import { postCreateDescription } from './create';
import { postGetDescription } from './get';
import { postGetManyDescription } from './getAll';
import { postUpdateDescription } from './update';
import { postRescheduleDescription } from './reschedule';
import { postDeleteDescription } from './delete';

const showOnlyForPosts = {
	resource: ['post'],
};

export const postDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForPosts,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a post',
				description: 'Create and schedule a post across channels',
				routing: {
					send: {
						preSend: [buildCreateBody],
					},
					request: {
						method: 'POST',
						url: '/posts',
					},
					output: {
						postReceive: [handleErrors],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a post',
				description: 'Get a single post by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/posts/{{$parameter.postId}}',
					},
					output: {
						postReceive: [handleErrors],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many posts',
				description: 'List posts with optional filters',
				routing: {
					request: {
						method: 'GET',
						url: '/posts',
					},
					output: {
						postReceive: [
							handleErrors,
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
						],
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a post',
				description: 'Update body, label, schedule, or tags of a post',
				routing: {
					send: {
						preSend: [buildUpdateBody],
					},
					request: {
						method: 'PATCH',
						url: '=/posts/{{$parameter.postId}}',
					},
					output: {
						postReceive: [handleErrors],
					},
				},
			},
			{
				name: 'Reschedule',
				value: 'reschedule',
				action: 'Reschedule a post',
				description: 'Change only the scheduled time of a post',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/posts/{{$parameter.postId}}/schedule',
					},
					output: {
						postReceive: [handleErrors],
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a post',
				description: 'Cancel or delete a post by ID',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/posts/{{$parameter.postId}}',
					},
					output: {
						postReceive: [handleErrors],
					},
				},
			},
		],
		default: 'create',
	},
	...postCreateDescription,
	...postGetDescription,
	...postGetManyDescription,
	...postUpdateDescription,
	...postRescheduleDescription,
	...postDeleteDescription,
];

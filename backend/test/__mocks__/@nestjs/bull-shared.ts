/**
 * Manual mock for @nestjs/bull-shared.
 * This package is a transitive dependency of @nestjs/bullmq that also ships as ESM.
 */

export const getQueueToken = (name: string): string => `BullQueue_${name}`;
export const getQueueOptionsToken = (name: string): string => `BullQueueOptions_${name}`;
export const JOB_REF = 'JOB_REF';

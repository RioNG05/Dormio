/**
 * Manual mock for @nestjs/bullmq.
 *
 * @nestjs/bullmq ships as ESM-only which ts-jest (CommonJS) cannot process.
 * This mock provides stub implementations of the decorators and helpers used
 * in the Dormio codebase so unit tests can run without touching the real package.
 *
 * The queue injection token format mirrors BullMQ's real implementation:
 * `BullQueue_<name>` — used by NotificationsService tests to register mockQueue.
 *
 * IMPORTANT: InjectQueue must call the real @nestjs/common Inject() so that
 * NestJS DI can resolve the token in TestingModule. We can't use a no-op here.
 */

import { Inject } from '@nestjs/common';

export const getQueueToken = (name: string): string => `BullQueue_${name}`;
export const getQueueOptionsToken = (name: string): string => `BullQueueOptions_${name}`;
export const JOB_REF = 'JOB_REF';

// InjectQueue must delegate to the real Inject() so NestJS DI can resolve it.
export const InjectQueue = (name: string) => Inject(getQueueToken(name));
export const InjectFlowProducer = (name: string) => Inject(`BullFlowProducer_${name}`);

// Class-level decorators that are no-ops in unit tests
export const Processor = (_name?: string) => (_target: Function) => {};
export const QueueEventsListener = (_name: string) => (_target: Function) => {};
export const OnWorkerEvent = (_event: string) => (_target: object, _key: string, _descriptor: PropertyDescriptor) => _descriptor;
export const OnQueueEvent = (_event: string) => (_target: object, _key: string, _descriptor: PropertyDescriptor) => _descriptor;

// Base classes — extend as plain classes in tests
export class WorkerHost {
  async process(_job: unknown): Promise<unknown> {
    return undefined;
  }
}
export class QueueEventsHost {}

export const BullModule = {
  forRoot: jest.fn().mockReturnValue({ module: class BullRootModule {} }),
  forRootAsync: jest.fn().mockReturnValue({ module: class BullRootModule {} }),
  registerQueue: jest.fn().mockReturnValue({ module: class BullQueueModule {} }),
  registerQueueAsync: jest.fn().mockReturnValue({ module: class BullQueueModule {} }),
  registerFlowProducer: jest.fn().mockReturnValue({ module: class BullFlowModule {} }),
};

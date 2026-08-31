/**
 * Manual mock for @nestjs/schedule.
 *
 * @nestjs/schedule ships as ESM-only which ts-jest (CommonJS) cannot process.
 * This mock provides stub implementations of the decorators and enums used
 * in the Dormio codebase so unit tests run without importing the real package.
 *
 * @Cron() is a no-op decorator in tests — the cron methods are called
 * directly by the test (service.runDailyBillingCron()) rather than waiting
 * for the scheduler to trigger them.
 */

export enum CronExpression {
  EVERY_SECOND = '* * * * * *',
  EVERY_MINUTE = '0 * * * * *',
  EVERY_HOUR = '0 0 * * * *',
  EVERY_DAY_AT_6AM = '0 0 6 * * *',
  EVERY_DAY_AT_MIDNIGHT = '0 0 0 * * *',
  EVERY_WEEK = '0 0 0 * * 0',
  EVERY_MONTH = '0 0 0 1 * *',
}

// Decorator no-op — @Cron() just annotates the method; no scheduling in tests.
export const Cron = (_cronTime: string | CronExpression) =>
  (_target: object, _key: string, _descriptor: PropertyDescriptor) =>
    _descriptor;

export const Interval = (_ms: number) =>
  (_target: object, _key: string, _descriptor: PropertyDescriptor) =>
    _descriptor;

export const Timeout = (_ms: number) =>
  (_target: object, _key: string, _descriptor: PropertyDescriptor) =>
    _descriptor;

export const SchedulerRegistry = class {
  getCronJob = jest.fn();
  addCronJob = jest.fn();
  deleteCronJob = jest.fn();
};

export const ScheduleModule = {
  forRoot: jest.fn().mockReturnValue({ module: class ScheduleRootModule {} }),
};

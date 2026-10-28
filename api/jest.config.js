/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    // @prisma (exact) is a tsconfig path alias → generated Prisma client.
    // In unit tests we use a stub so the real client (which needs a DB) isn't loaded.
    // NOTE: do NOT add `^@prisma/(.*)$` here — that would intercept real npm packages
    // like @prisma/adapter-pg which must be resolved normally.
    '^@prisma$': '<rootDir>/../test/__mocks__/@prisma/index.ts',
    // @nestjs/bullmq ships as ESM-only and cannot be processed by ts-jest
    // in a CommonJS Jest environment. We mock it at the module level so
    // decorators (InjectQueue, Processor, etc.) are replaced with no-ops
    // and queue behaviour is tested via the mockQueue stub.
    '^@nestjs/bullmq$': '<rootDir>/../test/__mocks__/@nestjs/bullmq.ts',
    '^@nestjs/bull-shared$': '<rootDir>/../test/__mocks__/@nestjs/bull-shared.ts',
    // @nestjs/schedule also ships as ESM-only. @Cron() becomes a no-op so
    // cron methods are called directly in tests.
    '^@nestjs/schedule$': '<rootDir>/../test/__mocks__/@nestjs/schedule.ts',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};


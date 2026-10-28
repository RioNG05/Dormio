import { ArgumentsHost, BadRequestException, HttpStatus, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { HttpExceptionFilter } from './http-exception.filter'
import { BusinessErrorCode } from '../enums/business-error-code.enum'
import {
  BusinessBadRequestException,
  BusinessNotFoundException,
} from '../exceptions/business.exception'

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter
  let mockJson: jest.Mock
  let mockStatus: jest.Mock
  let mockGetResponse: jest.Mock
  let mockGetRequest: jest.Mock
  let mockHost: ArgumentsHost

  beforeEach(() => {
    filter = new HttpExceptionFilter()
    mockJson = jest.fn()
    mockStatus = jest.fn().mockImplementation(() => ({ json: mockJson }))
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus })
    mockGetRequest = jest.fn().mockReturnValue({ url: '/api/v1/test' })
    mockHost = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
    } as unknown as ArgumentsHost
  })

  it('should format BusinessBadRequestException with explicit business code', () => {
    const exception = new BusinessBadRequestException(
      BusinessErrorCode.AUTH_INVALID_CREDENTIALS,
      'Invalid credentials provided',
    )

    filter.catch(exception, mockHost)

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        code: BusinessErrorCode.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid credentials provided',
        path: '/api/v1/test',
      }),
    )
  })

  it('should format BusinessNotFoundException with explicit business code', () => {
    const exception = new BusinessNotFoundException(
      BusinessErrorCode.ROOM_NOT_FOUND,
      'Room not found',
    )

    filter.catch(exception, mockHost)

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        code: BusinessErrorCode.ROOM_NOT_FOUND,
        message: 'Room not found',
      }),
    )
  })

  it('should assign COMMON_VALIDATION_ERROR to class-validator validation arrays', () => {
    const exception = new BadRequestException({
      message: ['phone must be valid', 'password must not be empty'],
      error: 'Bad Request',
      statusCode: 400,
    })

    filter.catch(exception, mockHost)

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        code: BusinessErrorCode.COMMON_VALIDATION_ERROR,
        message: 'phone must be valid. password must not be empty',
      }),
    )
  })

  it('should assign AUTH_UNAUTHORIZED to untyped UnauthorizedException', () => {
    const exception = new UnauthorizedException('Session expired')

    filter.catch(exception, mockHost)

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        code: BusinessErrorCode.AUTH_UNAUTHORIZED,
      }),
    )
  })

  it('should assign COMMON_INTERNAL_ERROR to unhandled unexpected errors', () => {
    const error = new Error('Database connection crashed')

    filter.catch(error, mockHost)

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: BusinessErrorCode.COMMON_INTERNAL_ERROR,
      }),
    )
  })
})


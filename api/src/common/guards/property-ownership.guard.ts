import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtPayload } from '../../modules/auth/types/jwt-payload.type'

/** UUID v4 regex used to validate boarding house IDs before hitting the DB */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Guard that verifies the authenticated landlord actually owns the boarding house
 * specified in the `X-Boarding-House-Id` request header.
 *
 * MUST be applied on every BHMS (landlord-facing) endpoint.
 * Always apply AFTER JwtAuthGuard so req.user is populated.
 *
 * @example
 * @UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
 * @Controller('rooms')
 */
interface GuardRequest {
  user?: JwtPayload
  headers: Record<string, string | string[] | undefined>
  params?: Record<string, string | undefined>
  query?: Record<string, string | undefined>
  baseUrl?: string
  originalUrl?: string
  url?: string
  boardingHouseId?: string
  boardingHouse?: { id: string; name: string }
}

@Injectable()
export class PropertyOwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<GuardRequest>()

    const className = context.getClass?.()?.name
    const isBoardingHouseRoute =
      className === 'BoardingHousesController' ||
      Boolean(req.baseUrl?.includes('boarding-houses') || req.originalUrl?.includes('/boarding-houses/'))

    const rawHeader = req.headers?.['x-boarding-house-id']
    const headerId = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
    const queryId = typeof req.query?.boardingHouseId === 'string' ? req.query.boardingHouseId : undefined
    const paramPropertyId = req.params?.boardingHouseId

    let rawId: string | undefined

    if (isBoardingHouseRoute) {
      // For boarding-house specific endpoints, the route param :id identifies the house
      rawId = req.params?.id || paramPropertyId || headerId || queryId
    } else {
      // For all resource controllers (rooms, contracts, invoices...), x-boarding-house-id header
      // is the primary context. Route param :id is the resource ID (roomId, contractId...) and
      // must NOT override the header!
      rawId = headerId || paramPropertyId || queryId || (className ? undefined : req.params?.id)
    }

    rawId = rawId?.trim()

    if (!rawId) {
      throw new BadRequestException('X-Boarding-House-Id header is required')
    }

    // In case multiple headers were joined into a comma-separated string by Node.js, take the first value
    if (rawId.includes(',')) {
      rawId = rawId.split(',')[0].trim()
    }

    // Reject non-UUID values early to avoid PostgreSQL cast errors (500)
    if (!UUID_REGEX.test(rawId)) {
      throw new BadRequestException('X-Boarding-House-Id must be a valid UUID')
    }

    const userId = req.user?.id
    if (!userId) {
      return false
    }

    const house = await this.prisma.boardingHouse.findFirst({
      where: { id: rawId, ownerId: userId },
      select: { id: true, name: true },
    })

    if (!house) {
      throw new ForbiddenException('You do not have access to this boarding house')
    }

    // Attach validated property context to request object for downstream use
    req.boardingHouseId = house.id
    req.boardingHouse = house
    req.headers['x-boarding-house-id'] = house.id

    return true
  }
}

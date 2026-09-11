import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
} from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import {
  ExpensesListResponseDto,
  ExpenseItemDto,
} from './dto/expense-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Landlord Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('landlord/expenses')
export class ExpensesController {
  private readonly logger = new Logger(ExpensesController.name);

  constructor(private readonly expensesService: ExpensesService) {}

  // ─── POST /api/v1/landlord/expenses ─────────────────────────────────────────

  @Post()
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create Expense (UC-L-17)',
    description:
      'Creates a new expense item (property-wide or room-specific) for the active boarding house context.',
  })
  @ApiCreatedResponse({
    description: 'Expense item created successfully',
    type: ExpenseItemDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not authorized for this boarding house',
  })
  async createExpense(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: ExpenseItemDto }> {
    this.logger.log(
      `POST /landlord/expenses called by user ${user?.id} for house ${boardingHouseId} (name="${dto.name}", amount=${dto.amount})`,
    );
    const data = await this.expensesService.createExpense(
      user.id,
      boardingHouseId,
      dto,
    );
    return { success: true, data };
  }

  // ─── GET /api/v1/landlord/expenses ──────────────────────────────────────────

  @Get()
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Landlord Expenses (UC-L-17)',
    description:
      'Retrieves paginated expenses for the active boarding house context with category, status, room, and search filters alongside financial summary metrics.',
  })
  @ApiOkResponse({
    description: 'Expenses list retrieved successfully',
    type: ExpensesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User is not authorized for this boarding house',
  })
  async getExpenses(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryExpensesDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ExpensesListResponseDto> {
    this.logger.log(
      `GET /landlord/expenses called by user ${user?.id} for house ${boardingHouseId} (page=${query.page}, category=${query.category}, status=${query.status})`,
    );
    return this.expensesService.getExpenses(
      boardingHouseId,
      query,
      user.id,
    );
  }

  // ─── GET /api/v1/landlord/expenses/:id ──────────────────────────────────────

  @Get(':id')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Expense Detail (UC-L-17)',
    description: 'Retrieves details of a specific expense by UUID.',
  })
  @ApiOkResponse({
    description: 'Expense detail retrieved successfully',
    type: ExpenseItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found in this boarding house',
  })
  async getExpenseDetail(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: ExpenseItemDto }> {
    this.logger.log(
      `GET /landlord/expenses/${id} called by user ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.expensesService.getExpenseDetail(
      boardingHouseId,
      id,
    );
    return { success: true, data };
  }

  // ─── PATCH /api/v1/landlord/expenses/:id ────────────────────────────────────

  @Patch(':id')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Expense (UC-L-17)',
    description: 'Updates attributes of an existing expense item.',
  })
  @ApiOkResponse({
    description: 'Expense updated successfully',
    type: ExpenseItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found in this boarding house',
  })
  async updateExpense(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; data: ExpenseItemDto }> {
    this.logger.log(
      `PATCH /landlord/expenses/${id} called by user ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.expensesService.updateExpense(
      boardingHouseId,
      id,
      dto,
      user.id,
    );
    return { success: true, data };
  }

  // ─── DELETE /api/v1/landlord/expenses/:id ───────────────────────────────────

  @Delete(':id')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete Expense (UC-L-17)',
    description: 'Deletes an expense item from the active boarding house.',
  })
  @ApiOkResponse({
    description: 'Expense deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Expense not found in this boarding house',
  })
  async deleteExpense(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `DELETE /landlord/expenses/${id} called by user ${user?.id} for house ${boardingHouseId}`,
    );
    return this.expensesService.deleteExpense(
      boardingHouseId,
      id,
      user.id,
    );
  }
}

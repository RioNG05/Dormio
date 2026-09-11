import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportContractResponseDto {
  @ApiProperty({
    description: 'Contract document UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  documentId: string;

  @ApiProperty({
    description: 'Associated contract UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  contractId: string;

  @ApiProperty({
    description: 'Document resource path or storage URL',
    example: 'contracts/123e4567-e89b-12d3-a456-426614174001/doc_abc123.html',
  })
  url: string;

  @ApiProperty({
    description: 'API endpoint path to download the rendered contract file',
    example: '/api/v1/landlord/contracts/123e4567-e89b-12d3-a456-426614174001/documents/123e4567-e89b-12d3-a456-426614174000/download',
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'Direct browser print URL triggering print dialog',
    example: '/api/v1/landlord/contracts/123e4567-e89b-12d3-a456-426614174001/print?autoPrint=true',
  })
  printUrl: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-09-11T08:30:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Full rendered HTML of the contract (included for direct client consumption if desired)',
  })
  html?: string;
}

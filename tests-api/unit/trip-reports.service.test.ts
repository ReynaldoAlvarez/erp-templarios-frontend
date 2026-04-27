// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundError } from '../../src/core/middleware/error.middleware';
import { TripReport, Trip, Prisma } from '@prisma/client';

// Create mock functions
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCount = jest.fn();
const mockAggregate = jest.fn();

// Mock PrismaService
jest.mock('../../src/core/database/prisma.service', () => ({
  PrismaService: {
    getInstance: () => ({
      tripReport: {
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        count: mockCount,
        aggregate: mockAggregate,
      },
      trip: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      documentType: {
        findMany: jest.fn(),
      },
    }),
  },
}));

// Import the service after mocking
import TripReportsService from '../../src/modules/trip-reports/trip-reports.service';

describe('TripReportsService', () => {
  const mockTripReport: TripReport = {
    id: '11111111-1111-1111-1111-111111111111',
    tripId: '22222222-2222-2222-2222-222222222222',
    micDta: 'MIC-2024-001',
    blNumber: 'BL-2024-001',
    lineNumber: 1,
    clientId: '33333333-3333-3333-3333-333333333333',
    clientName: 'CLIENTE TEST S.R.L.',
    clientNit: '123456789',
    origin: 'Matarani',
    destination: 'Cochabamba',
    tramoCode: 'MAT-CBA',
    truckPlate: 'ABC-123',
    trailerPlate: 'XYZ-456',
    driverName: 'Juan Perez',
    driverCi: '12345678',
    isSupportTruck: false,
    weightKg: new Prisma.Decimal(25000.00),
    unitCount: 1,
    freightAmount: new Prisma.Decimal(1200.00),
    retentionPercent: new Prisma.Decimal(7.00),
    retentionAmount: new Prisma.Decimal(84.00),
    netAmount: new Prisma.Decimal(1116.00),
    documentsComplete: true,
    documentsPending: 0,
    missingDocuments: null,
    isPaymentBlocked: false,
    paymentStatus: 'pending',
    departureDate: new Date('2024-01-15'),
    arrivalDate: null,
    documentDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated trip reports', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      const result = await TripReportsService.getAll({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by paymentStatus', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        paymentStatus: 'pending',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { paymentStatus: 'pending' },
        })
      );
    });

    it('should filter by documentsComplete', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        documentsComplete: true,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentsComplete: true },
        })
      );
    });

    it('should filter by isPaymentBlocked', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        isPaymentBlocked: true,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPaymentBlocked: true },
        })
      );
    });

    it('should filter by search term', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        search: 'MIC-2024',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { micDta: { contains: 'MIC-2024', mode: 'insensitive' } },
              { blNumber: { contains: 'MIC-2024', mode: 'insensitive' } },
              { clientName: { contains: 'MIC-2024', mode: 'insensitive' } },
              { truckPlate: { contains: 'MIC-2024', mode: 'insensitive' } },
              { driverName: { contains: 'MIC-2024', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should filter by blNumber', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        blNumber: 'BL-2024-001',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            blNumber: { contains: 'BL-2024-001', mode: 'insensitive' },
          },
        })
      );
    });

    it('should filter by clientId', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        clientId: '33333333-3333-3333-3333-333333333333',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: '33333333-3333-3333-3333-333333333333' },
        })
      );
    });

    it('should filter by origin', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        origin: 'Matarani',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            origin: { contains: 'Matarani', mode: 'insensitive' },
          },
        })
      );
    });

    it('should filter by destination', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      await TripReportsService.getAll({
        page: 1,
        limit: 10,
        destination: 'Cochabamba',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            destination: { contains: 'Cochabamba', mode: 'insensitive' },
          },
        })
      );
    });

    it('should calculate correct pagination for multiple pages', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(25);

      const result = await TripReportsService.getAll({
        page: 2,
        limit: 10,
      });

      expect(result.meta.totalPages).toBe(3);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('getById', () => {
    it('should return trip report by ID', async () => {
      mockFindUnique.mockResolvedValue(mockTripReport);

      const result = await TripReportsService.getById(mockTripReport.id);

      expect(result.id).toBe(mockTripReport.id);
      expect(result.micDta).toBe(mockTripReport.micDta);
    });

    it('should throw NotFoundError when trip report not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TripReportsService.getById('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByTripId', () => {
    it('should return trip report by tripId', async () => {
      mockFindUnique.mockResolvedValue(mockTripReport);

      const result = await TripReportsService.getByTripId(mockTripReport.tripId);

      expect(result.tripId).toBe(mockTripReport.tripId);
    });

    it('should throw NotFoundError when trip report not found by tripId', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TripReportsService.getByTripId('non-existent-trip-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByMicDta', () => {
    it('should return trip report by MIC/DTA', async () => {
      mockFindUnique.mockResolvedValue(mockTripReport);

      const result = await TripReportsService.getByMicDta('MIC-2024-001');

      expect(result.micDta).toBe('MIC-2024-001');
    });

    it('should throw NotFoundError when MIC/DTA not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TripReportsService.getByMicDta('INVALID-MIC')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update an existing trip report', async () => {
      mockFindUnique.mockResolvedValue(mockTripReport);
      mockUpdate.mockResolvedValue({
        ...mockTripReport,
        lineNumber: 2,
      });

      const result = await TripReportsService.update(mockTripReport.id, {
        lineNumber: 2,
      });

      expect(result.lineNumber).toBe(2);
    });

    it('should update paymentStatus', async () => {
      mockFindUnique.mockResolvedValue(mockTripReport);
      mockUpdate.mockResolvedValue({
        ...mockTripReport,
        paymentStatus: 'paid',
      });

      const result = await TripReportsService.update(mockTripReport.id, {
        paymentStatus: 'paid',
      });

      expect(result.paymentStatus).toBe('paid');
    });

    it('should throw NotFoundError when trip report not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TripReportsService.update('non-existent-id', { lineNumber: 2 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a trip report', async () => {
      mockFindUnique.mockResolvedValue(mockTripReport);
      mockDelete.mockResolvedValue(mockTripReport);

      const result = await TripReportsService.delete(mockTripReport.id);

      expect(result.id).toBe(mockTripReport.id);
      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: mockTripReport.id },
      });
    });

    it('should throw NotFoundError when trip report not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TripReportsService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByBlNumber', () => {
    it('should return trip reports by BL number', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);

      const result = await TripReportsService.getByBlNumber('BL-2024-001');

      expect(result).toHaveLength(1);
      expect(result[0].blNumber).toBe('BL-2024-001');
    });
  });

  describe('getByClientId', () => {
    it('should return paginated trip reports by client ID', async () => {
      mockFindMany.mockResolvedValue([mockTripReport]);
      mockCount.mockResolvedValue(1);

      const result = await TripReportsService.getByClientId(
        '33333333-3333-3333-3333-333333333333',
        { page: 1, limit: 10 }
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getBlockedPayments', () => {
    it('should return trip reports with blocked payments', async () => {
      const blockedReport = { ...mockTripReport, isPaymentBlocked: true };
      mockFindMany.mockResolvedValue([blockedReport]);
      mockCount.mockResolvedValue(1);

      const result = await TripReportsService.getBlockedPayments({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPaymentBlocked: true },
        })
      );
    });
  });

  describe('getIncompleteDocuments', () => {
    it('should return trip reports with incomplete documents', async () => {
      const incompleteReport = {
        ...mockTripReport,
        documentsComplete: false,
        documentsPending: 2,
      };
      mockFindMany.mockResolvedValue([incompleteReport]);
      mockCount.mockResolvedValue(1);

      const result = await TripReportsService.getIncompleteDocuments({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { documentsComplete: false },
        })
      );
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      mockCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      mockAggregate
        .mockResolvedValueOnce({ _sum: { freightAmount: new Prisma.Decimal(10000) } })
        .mockResolvedValueOnce({ _sum: { retentionAmount: new Prisma.Decimal(700) } })
        .mockResolvedValueOnce({ _sum: { netAmount: new Prisma.Decimal(9300) } });

      const stats = await TripReportsService.getStats();

      expect(stats).toEqual({
        total: 10,
        complete: 8,
        incomplete: 2,
        blockedPayments: 3,
        pendingPayments: 5,
        partialPayments: 2,
        paidPayments: 3,
        totalFreight: 10000,
        totalRetention: 700,
        totalNet: 9300,
      });
    });
  });

  describe('getBlSummary', () => {
    it('should return BL summary with aggregated data', async () => {
      mockFindMany.mockResolvedValue([
        mockTripReport,
        { ...mockTripReport, lineNumber: 2, weightKg: new Prisma.Decimal(20000) },
      ]);

      const summary = await TripReportsService.getBlSummary('BL-2024-001');

      expect(summary.blNumber).toBe('BL-2024-001');
      expect(summary.totalTrips).toBe(2);
      expect(summary.totalWeight).toBe(45000);
      expect(summary.completeDocs).toBe(2);
      expect(summary.incompleteDocs).toBe(0);
    });

    it('should return empty summary for non-existent BL', async () => {
      mockFindMany.mockResolvedValue([]);

      const summary = await TripReportsService.getBlSummary('NON-EXISTENT');

      expect(summary.totalTrips).toBe(0);
      expect(summary.totalWeight).toBe(0);
      expect(summary.trips).toHaveLength(0);
    });
  });

  describe('regenerate', () => {
    it('should throw NotFoundError when trip report not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TripReportsService.regenerate('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

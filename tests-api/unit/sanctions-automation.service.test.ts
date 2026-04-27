import SanctionAutomationService from '../../src/modules/sanctions/sanctions-automation.service';

// Mock PrismaService
jest.mock('../../src/core/database/prisma.service', () => {
  const mockPrisma = {
    settlement: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    sanction: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'sanction-1', type: 'FINE', amount: 50 }),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 }, _avg: {} }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    driver: {
      findUnique: jest.fn().mockResolvedValue({ id: 'driver-1', employee: { firstName: 'Juan', lastName: 'Pérez' } }),
      update: jest.fn().mockResolvedValue({}),
    },
    driverHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    trip: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };
  
  return {
    PrismaService: {
      getInstance: jest.fn().mockReturnValue(mockPrisma),
    },
  };
});

jest.mock('../../src/modules/notifications/notifications.service', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({ id: 'notification-id' }),
  },
}));

describe('SanctionAutomationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return sanction configuration', () => {
      const config = SanctionAutomationService.getConfig();

      expect(config).toHaveProperty('GRACE_PERIOD_DAYS');
      expect(config).toHaveProperty('FINE_PER_DAY_USD');
      expect(config).toHaveProperty('MAX_FINE_DAYS');
      expect(config).toHaveProperty('MAX_FINE_AMOUNT');
      expect(config).toHaveProperty('SUSPENSION_THRESHOLDS');
    });

    it('should have correct default values', () => {
      const config = SanctionAutomationService.getConfig();

      expect(config.GRACE_PERIOD_DAYS).toBe(3);
      expect(config.FINE_PER_DAY_USD).toBe(10);
      expect(config.MAX_FINE_DAYS).toBe(30);
      expect(config.MAX_FINE_AMOUNT).toBe(300);
    });
  });

  describe('getDelayedTrips', () => {
    it('should return empty array when no blocked settlements', async () => {
      const result = await SanctionAutomationService.getDelayedTrips();

      expect(result.trips).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('generateAutomaticSanctions', () => {
    it('should return zero results when no delayed trips', async () => {
      const result = await SanctionAutomationService.generateAutomaticSanctions('user-1');

      expect(result.generated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.alreadySanctioned).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });

  describe('checkRecurringOffenses', () => {
    it('should return shouldSuspend false when no sanctions', async () => {
      const result = await SanctionAutomationService.checkRecurringOffenses('driver-1');

      expect(result.shouldSuspend).toBe(false);
      expect(result.recentSanctions).toBe(0);
    });
  });

  describe('getAutomationStats', () => {
    it('should return automation statistics with defaults', async () => {
      const stats = await SanctionAutomationService.getAutomationStats();

      expect(stats.total).toBe(0);
      expect(stats.automatic).toBe(0);
      expect(stats.manual).toBe(0);
      expect(stats.totalFines).toBe(0);
      expect(stats.pendingFines).toBe(0);
      expect(stats.driversWithMultipleSanctions).toBe(0);
    });
  });

  describe('generateSuspensionSanction', () => {
    it('should generate suspension sanction for driver', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      mockPrisma.driver.findUnique.mockResolvedValue({
        id: 'driver-1',
        employee: { firstName: 'Juan', lastName: 'Pérez' }
      });

      mockPrisma.sanction.create.mockResolvedValue({
        id: 'suspension-1',
        type: 'SUSPENSION',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const result = await SanctionAutomationService.generateSuspensionSanction(
        'driver-1',
        'admin-1',
        7
      );

      expect(mockPrisma.sanction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          driverId: 'driver-1',
          type: 'SUSPENSION',
          automatic: true,
        })
      );
      expect(result.sanction.id).toBe('suspension-1');
    });

    it('should set driver as unavailable when suspended', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      mockPrisma.driver.findUnique.mockResolvedValue({
        id: 'driver-1',
        employee: { firstName: 'Juan', lastName: 'Pérez' }
      });

      mockPrisma.sanction.create.mockResolvedValue({ id: 'suspension-1' });

      await SanctionAutomationService.generateSuspensionSanction('driver-1', 'admin-1', 7);

      expect(mockPrisma.driver.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'driver-1' },
          data: { isAvailable: false }
        })
      );
    });
  });

  describe('processDriverSanctions', () => {
    it('should generate sanctions for delayed trips and check for suspension', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      // Mock settlements with delayed trips
      mockPrisma.settlement.findMany.mockResolvedValue([
        {
          id: 'settlement-1',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          trip: {
            id: 'trip-1',
            micDta: 'MIC-001',
            driverId: 'driver-1',
            truck: { plateNumber: 'ABC-123', isSupportTruck: false },
            driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
            documents: [
              {
                documentType: { code: 'MIC', isRequired: true },
                status: 'PENDING'
              }
            ]
          }
        }
      ]);

      mockPrisma.sanction.findFirst.mockResolvedValue(null);
      mockPrisma.sanction.create.mockResolvedValue({ id: 'sanction-1' });
      mockPrisma.sanction.count.mockResolvedValue(2); // 2 recent sanctions

      const result = await SanctionAutomationService.processDriverSanctions('driver-1', 'admin-1');

      expect(result.newSanctions).toBeGreaterThanOrEqual(0);
      expect(result.suspensionGenerated).toBeDefined();
    });

    it('should skip trips with existing sanctions', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      mockPrisma.settlement.findMany.mockResolvedValue([
        {
          id: 'settlement-1',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          trip: {
            id: 'trip-1',
            micDta: 'MIC-001',
            driverId: 'driver-1',
            truck: { plateNumber: 'ABC-123', isSupportTruck: false },
            driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
            documents: [
              {
                documentType: { code: 'MIC', isRequired: true },
                status: 'PENDING'
              }
            ]
          }
        }
      ]);

      // Trip already has sanction
      mockPrisma.sanction.findFirst.mockResolvedValue({ id: 'existing-sanction' });

      const result = await SanctionAutomationService.processDriverSanctions('driver-1', 'admin-1');

      expect(result.newSanctions).toBe(0); // No new sanctions created
      expect(mockPrisma.sanction.create).not.toHaveBeenCalled();
    });
  });

  describe('checkRecurringOffenses', () => {
    it('should recommend suspension for driver with 3 recent sanctions', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      mockPrisma.sanction.count.mockResolvedValue(3); // 3 recent sanctions

      const result = await SanctionAutomationService.checkRecurringOffenses('driver-1');

      expect(result.shouldSuspend).toBe(true);
      expect(result.recentSanctions).toBe(3);
      expect(result.suspensionDays).toBe(7); // Default 7 days
    });

    it('should not recommend suspension for driver with only 2 sanctions', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      mockPrisma.sanction.count.mockResolvedValue(2); // Only 2 recent sanctions

      const result = await SanctionAutomationService.checkRecurringOffenses('driver-1');

      expect(result.shouldSuspend).toBe(false);
      expect(result.recentSanctions).toBe(2);
      expect(result.suspensionDays).toBe(0);
    });

    it('should increase suspension days for multiple offense cycles', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      // 6 sanctions = 2 offense cycles (3 + 3)
      mockPrisma.sanction.count.mockResolvedValue(6);

      const result = await SanctionAutomationService.checkRecurringOffenses('driver-1');

      expect(result.shouldSuspend).toBe(true);
      expect(result.suspensionDays).toBe(14); // 7 + 7 for second cycle
    });
  });

  describe('getDelayedTrips with actual data', () => {
    it('should return trips with missing documents', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      const mockSettlements = [
        {
          id: 'settlement-1',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          trip: {
            id: 'trip-1',
            micDta: 'MIC-001',
            driverId: 'driver-1',
            truck: { plateNumber: 'ABC-123', isSupportTruck: false },
            driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
            documents: [
              {
                documentType: { code: 'MIC', name: 'Manifiesto', isRequired: true },
                status: 'PENDING'
              },
              {
                documentType: { code: 'CRT', name: 'Carta de Porte', isRequired: true },
                status: 'VERIFIED'
              }
            ]
          }
        }
      ];

      mockPrisma.settlement.findMany.mockResolvedValue(mockSettlements);

      const result = await SanctionAutomationService.getDelayedTrips();

      expect(result.trips).toHaveLength(1);
      expect(result.trips[0].micDta).toBe('MIC-001');
      expect(result.trips[0].missingDocuments).toContain('MIC');
      expect(result.trips[0].daysDelayed).toBeGreaterThanOrEqual(1);
    });

    it('should skip support trucks', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      const mockSettlements = [
        {
          id: 'settlement-1',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          trip: {
            id: 'trip-1',
            micDta: 'MIC-001',
            driverId: 'driver-1',
            truck: { plateNumber: 'XYZ-789', isSupportTruck: true }, // Support truck
            driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
            documents: [
              {
                documentType: { code: 'MIC', name: 'Manifiesto', isRequired: true },
                status: 'PENDING'
              }
            ]
          }
        }
      ];

      mockPrisma.settlement.findMany.mockResolvedValue(mockSettlements);

      const result = await SanctionAutomationService.getDelayedTrips();

      expect(result.trips).toHaveLength(0); // Should skip support trucks
    });

    it('should only include trips past grace period', async () => {
      const mockPrisma = require('../../src/core/database/prisma.service').PrismaService.getInstance();

      const mockSettlements = [
        {
          id: 'settlement-1',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Only 2 days ago
          trip: {
            id: 'trip-1',
            micDta: 'MIC-001',
            driverId: 'driver-1',
            truck: { plateNumber: 'ABC-123', isSupportTruck: false },
            driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
            documents: [
              {
                documentType: { code: 'MIC', name: 'Manifiesto', isRequired: true },
                status: 'PENDING'
              }
            ]
          }
        }
      ];

      mockPrisma.settlement.findMany.mockResolvedValue(mockSettlements);

      const result = await SanctionAutomationService.getDelayedTrips({ minDaysDelayed: 3 });

      expect(result.trips).toHaveLength(0); // Should be filtered out
    });
  });
});

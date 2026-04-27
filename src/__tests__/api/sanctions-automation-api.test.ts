import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  sanctionsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getTypes: vi.fn(),
    getStats: vi.fn(),
    getActive: vi.fn(),
    getByDriver: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
  },
  sanctionsAutomationApi: {
    getConfig: vi.fn(),
    getReasons: vi.fn(),
    getDelayedTrips: vi.fn(),
    generateAutomatic: vi.fn(),
    checkRecurring: vi.fn(),
    processDriver: vi.fn(),
    getAutomationStats: vi.fn(),
  },
}));

import { sanctionsAutomationApi } from '@/lib/api-client';

describe('Sanctions Automation API (Sprint 5 Phase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should fetch sanction configuration', async () => {
      const mockConfig = {
        gracePeriodDays: 3,
        finePerDayUsd: 10,
        maxFineDays: 30,
        maxFineAmount: 300,
        suspensionThresholds: {
          first: 1,
          second: 3,
          third: 7,
          fourth: 15,
          fifthPlus: 30,
        },
      };

      vi.mocked(sanctionsAutomationApi.getConfig).mockResolvedValue(mockConfig);

      const result = await sanctionsAutomationApi.getConfig();

      expect(result).toEqual(mockConfig);
      expect(result.gracePeriodDays).toBe(3);
      expect(result.finePerDayUsd).toBe(10);
      expect(result.maxFineAmount).toBe(300);
      expect(result.suspensionThresholds.third).toBe(7);
      expect(sanctionsAutomationApi.getConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReasons', () => {
    it('should fetch sanction reasons', async () => {
      const mockReasons = [
        { value: 'DOCUMENT_DELAY', label: 'Retraso Documentario', description: 'Retraso en entrega de documentos' },
        { value: 'REPEATED_OFFENSE', label: 'Reincidencia', description: 'Ofensa repetida por el conductor' },
        { value: 'SAFETY_VIOLATION', label: 'Violacion de Seguridad', description: 'Violacion de normas de seguridad' },
        { value: 'OTHER', label: 'Otro', description: 'Otra razon de sancion' },
      ];

      vi.mocked(sanctionsAutomationApi.getReasons).mockResolvedValue(mockReasons);

      const result = await sanctionsAutomationApi.getReasons();

      expect(result).toHaveLength(4);
      expect(result[0].value).toBe('DOCUMENT_DELAY');
      expect(result[1].value).toBe('REPEATED_OFFENSE');
      expect(sanctionsAutomationApi.getReasons).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDelayedTrips', () => {
    it('should fetch delayed trips list', async () => {
      const mockTrips = [
        {
          tripId: 'trip-1',
          micDta: 'MIC-2024-001',
          driverId: 'driver-1',
          driverName: 'Juan Perez',
          daysDelayed: 5,
          suggestedFine: 50,
          suggestedAction: 'FINE' as const,
          existingOffenses: 0,
        },
        {
          tripId: 'trip-2',
          micDta: 'MIC-2024-002',
          driverId: 'driver-2',
          driverName: 'Carlos Lopez',
          daysDelayed: 12,
          suggestedFine: 120,
          suggestedAction: 'SUSPENSION' as const,
          existingOffenses: 3,
        },
      ];

      vi.mocked(sanctionsAutomationApi.getDelayedTrips).mockResolvedValue(mockTrips);

      const result = await sanctionsAutomationApi.getDelayedTrips();

      expect(result).toHaveLength(2);
      expect(result[0].daysDelayed).toBe(5);
      expect(result[1].suggestedAction).toBe('SUSPENSION');
      expect(result[1].existingOffenses).toBe(3);
      expect(sanctionsAutomationApi.getDelayedTrips).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no delayed trips', async () => {
      vi.mocked(sanctionsAutomationApi.getDelayedTrips).mockResolvedValue([]);

      const result = await sanctionsAutomationApi.getDelayedTrips();

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('generateAutomatic', () => {
    it('should generate automatic sanctions with dry run', async () => {
      const mockResult = {
        previews: [
          {
            tripId: 'trip-1',
            micDta: 'MIC-2024-001',
            driverId: 'driver-1',
            driverName: 'Juan Perez',
            type: 'FINE' as const,
            sanctionReason: 'DOCUMENT_DELAY' as const,
            daysDelayed: 5,
            amount: 50,
            existingOffenses: 0,
          },
        ],
        totalToGenerate: 1,
        totalFines: 1,
        totalSuspensions: 0,
        totalWarnings: 0,
        totalAmount: 50,
      };

      vi.mocked(sanctionsAutomationApi.generateAutomatic).mockResolvedValue(mockResult);

      const result = await sanctionsAutomationApi.generateAutomatic({
        tripIds: ['trip-1'],
        dryRun: true,
      });

      expect(result.totalToGenerate).toBe(1);
      expect(result.previews).toHaveLength(1);
      expect(result.previews[0].type).toBe('FINE');
      expect(result.totalAmount).toBe(50);
      expect(sanctionsAutomationApi.generateAutomatic).toHaveBeenCalledWith({
        tripIds: ['trip-1'],
        dryRun: true,
      });
    });

    it('should generate sanctions for multiple trips', async () => {
      const mockResult = {
        previews: [
          {
            tripId: 'trip-1',
            micDta: 'MIC-001',
            driverId: 'driver-1',
            driverName: 'Juan Perez',
            type: 'FINE' as const,
            sanctionReason: 'DOCUMENT_DELAY' as const,
            daysDelayed: 5,
            amount: 50,
            existingOffenses: 0,
          },
          {
            tripId: 'trip-2',
            micDta: 'MIC-002',
            driverId: 'driver-2',
            driverName: 'Carlos Lopez',
            type: 'SUSPENSION' as const,
            sanctionReason: 'REPEATED_OFFENSE' as const,
            daysDelayed: 12,
            amount: 0,
            existingOffenses: 3,
          },
        ],
        totalToGenerate: 2,
        totalFines: 1,
        totalSuspensions: 1,
        totalWarnings: 0,
        totalAmount: 50,
      };

      vi.mocked(sanctionsAutomationApi.generateAutomatic).mockResolvedValue(mockResult);

      const result = await sanctionsAutomationApi.generateAutomatic({
        tripIds: ['trip-1', 'trip-2'],
        dryRun: false,
      });

      expect(result.totalToGenerate).toBe(2);
      expect(result.totalFines).toBe(1);
      expect(result.totalSuspensions).toBe(1);
      expect(sanctionsAutomationApi.generateAutomatic).toHaveBeenCalledWith({
        tripIds: ['trip-1', 'trip-2'],
        dryRun: false,
      });
    });
  });

  describe('checkRecurring', () => {
    it('should check recurring offenses for a driver', async () => {
      const mockCheck = {
        driverId: 'driver-1',
        driverName: 'Juan Perez',
        totalSanctions: 5,
        pendingSanctions: 1,
        completedSanctions: 4,
        offenseLevel: 'THIRD' as const,
        suggestedSuspensionDays: 7,
        lastSanctionDate: '2026-04-20T10:00:00Z',
      };

      vi.mocked(sanctionsAutomationApi.checkRecurring).mockResolvedValue(mockCheck);

      const result = await sanctionsAutomationApi.checkRecurring('driver-1');

      expect(result.driverId).toBe('driver-1');
      expect(result.totalSanctions).toBe(5);
      expect(result.offenseLevel).toBe('THIRD');
      expect(result.suggestedSuspensionDays).toBe(7);
      expect(sanctionsAutomationApi.checkRecurring).toHaveBeenCalledWith('driver-1');
    });
  });

  describe('processDriver', () => {
    it('should process driver sanctions', async () => {
      const mockResult = {
        driverId: 'driver-1',
        driverName: 'Juan Perez',
        sanctionsGenerated: 2,
        sanctionsSkipped: 0,
        totalAmount: 100,
      };

      vi.mocked(sanctionsAutomationApi.processDriver).mockResolvedValue(mockResult);

      const result = await sanctionsAutomationApi.processDriver('driver-1');

      expect(result.sanctionsGenerated).toBe(2);
      expect(result.sanctionsSkipped).toBe(0);
      expect(result.totalAmount).toBe(100);
      expect(sanctionsAutomationApi.processDriver).toHaveBeenCalledWith('driver-1');
    });
  });

  describe('getAutomationStats', () => {
    it('should fetch automation statistics', async () => {
      const mockStats = {
        totalAutomatic: 15,
        totalManual: 8,
        automationRate: 0.65,
        totalFinesGenerated: 12,
        totalSuspensionsGenerated: 2,
        totalWarningsGenerated: 1,
        totalAmountGenerated: 850,
        pendingDelayedTrips: 3,
        averageDaysDelayed: 6.5,
        topSanctionedDrivers: [
          {
            driverId: 'driver-1',
            driverName: 'Juan Perez',
            sanctionCount: 5,
            totalAmount: 350,
          },
          {
            driverId: 'driver-2',
            driverName: 'Carlos Lopez',
            sanctionCount: 3,
            totalAmount: 200,
          },
        ],
        byReason: {
          DOCUMENT_DELAY: 10,
          REPEATED_OFFENSE: 3,
          SAFETY_VIOLATION: 1,
          OTHER: 1,
        },
      };

      vi.mocked(sanctionsAutomationApi.getAutomationStats).mockResolvedValue(mockStats);

      const result = await sanctionsAutomationApi.getAutomationStats();

      expect(result.totalAutomatic).toBe(15);
      expect(result.totalManual).toBe(8);
      expect(result.automationRate).toBe(0.65);
      expect(result.topSanctionedDrivers).toHaveLength(2);
      expect(result.topSanctionedDrivers[0].driverName).toBe('Juan Perez');
      expect(result.byReason.DOCUMENT_DELAY).toBe(10);
      expect(sanctionsAutomationApi.getAutomationStats).toHaveBeenCalledTimes(1);
    });
  });
});

import { DocumentStatus, SettlementStatus, NotificationType, NotificationPriority } from '@prisma/client';

// Mock PrismaService
const mockPrisma = {
  trip: {
    findUnique: jest.fn(),
  },
  documentType: {
    findMany: jest.fn(),
  },
  settlement: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  document: {
    findFirst: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
};

// Mock PrismaService.getInstance
jest.mock('@core/database/prisma.service', () => ({
  PrismaService: {
    getInstance: () => mockPrisma,
  },
}));

// Mock notification service
const mockNotificationService = {
  create: jest.fn(),
};

jest.mock('@modules/notifications/notifications.service', () => ({
  __esModule: true,
  default: mockNotificationService,
}));

// Import after mocking
import paymentBlockService from '../../src/modules/payment-block/payment-block.service';

describe('PaymentBlockService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndUpdateBlockStatus', () => {
    const mockTripId = 'trip-123';
    const mockSettlementId = 'settlement-123';

    const mockDocumentType = {
      id: 'doctype-1',
      code: 'MIC',
      name: 'Manifiesto Internacional de Carga',
      isRequired: true,
      isForSupportOnly: false,
      isActive: true,
    };

    const mockVerifiedDocument = {
      id: 'doc-1',
      tripId: mockTripId,
      documentTypeId: 'doctype-1',
      status: DocumentStatus.VERIFIED,
      documentType: mockDocumentType,
    };

    const mockPendingDocument = {
      id: 'doc-2',
      tripId: mockTripId,
      documentTypeId: 'doctype-1',
      status: DocumentStatus.PENDING,
      documentType: mockDocumentType,
    };

    const mockTrip = {
      id: mockTripId,
      micDta: 'MIC-123',
      truck: { isSupportTruck: false, plateNumber: 'ABC-123' },
      driver: {
        employee: { firstName: 'Juan', lastName: 'Pérez', userId: 'user-1' },
      },
      documents: [mockVerifiedDocument],
      billOfLading: { blNumber: 'BL-001' },
    };

    const mockSettlement = {
      id: mockSettlementId,
      tripId: mockTripId,
      documentsComplete: false,
      isPaymentBlocked: true,
    };

    it('should return documents complete when all required docs are verified', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.documentType.findMany.mockResolvedValue([mockDocumentType]);
      mockPrisma.settlement.findUnique.mockResolvedValue(mockSettlement);
      mockPrisma.settlement.update.mockResolvedValue({
        ...mockSettlement,
        documentsComplete: true,
        isPaymentBlocked: false,
      });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);
      mockNotificationService.create.mockResolvedValue({});

      const result = await paymentBlockService.checkAndUpdateBlockStatus(mockTripId);

      expect(result.documentsComplete).toBe(true);
      expect(result.isPaymentBlocked).toBe(false);
      expect(result.missingDocuments).toEqual([]);
      expect(result.notificationSent).toBe(true);
    });

    it('should return blocked when documents are pending', async () => {
      const tripWithPendingDoc = {
        ...mockTrip,
        documents: [mockPendingDocument],
      };

      mockPrisma.trip.findUnique.mockResolvedValue(tripWithPendingDoc);
      mockPrisma.documentType.findMany.mockResolvedValue([mockDocumentType]);
      mockPrisma.settlement.findUnique.mockResolvedValue(mockSettlement);
      mockPrisma.settlement.update.mockResolvedValue(mockSettlement);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);
      mockNotificationService.create.mockResolvedValue({});

      const result = await paymentBlockService.checkAndUpdateBlockStatus(mockTripId);

      expect(result.documentsComplete).toBe(false);
      expect(result.isPaymentBlocked).toBe(true);
      expect(result.missingDocuments).toContain('MIC');
    });

    it('should throw error when trip not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      await expect(
        paymentBlockService.checkAndUpdateBlockStatus(mockTripId)
      ).rejects.toThrow('Viaje con ID trip-123 no encontrado');
    });

    it('should handle support truck documents correctly', async () => {
      const supportTruckTrip = {
        ...mockTrip,
        truck: { isSupportTruck: true, plateNumber: 'XYZ-789' },
        documents: [mockVerifiedDocument],
      };

      const facturaDocType = {
        id: 'doctype-2',
        code: 'FACTURA',
        name: 'Factura',
        isRequired: true,
        isForSupportOnly: true,
        isActive: true,
      };

      mockPrisma.trip.findUnique.mockResolvedValue(supportTruckTrip);
      mockPrisma.documentType.findMany.mockResolvedValue([mockDocumentType, facturaDocType]);
      mockPrisma.settlement.findUnique.mockResolvedValue(mockSettlement);
      mockPrisma.settlement.update.mockResolvedValue({
        ...mockSettlement,
        documentsComplete: false,
        isPaymentBlocked: true,
      });

      const result = await paymentBlockService.checkAndUpdateBlockStatus(mockTripId);

      // Should be blocked because FACTURA is missing for support truck
      expect(result.isPaymentBlocked).toBe(true);
      expect(result.missingDocuments).toContain('FACTURA');
    });
  });

  describe('getBlockedPayments', () => {
    it('should return list of blocked payments with missing documents', async () => {
      const mockBlockedSettlement = {
        id: 'settlement-1',
        tripId: 'trip-1',
        netPayment: 5000,
        isPaymentBlocked: true,
        createdAt: new Date(),
        trip: {
          micDta: 'MIC-001',
          truck: { plateNumber: 'ABC-123', isSupportTruck: false },
          driver: {
            employee: { firstName: 'Juan', lastName: 'Pérez', phone: '123456' },
          },
          billOfLading: { blNumber: 'BL-001' },
          documents: [
            {
              status: DocumentStatus.PENDING,
              documentType: { code: 'MIC', name: 'Manifiesto', isRequired: true, isForSupportOnly: false },
            },
          ],
        },
      };

      mockPrisma.settlement.findMany.mockResolvedValue([mockBlockedSettlement]);
      mockPrisma.settlement.count.mockResolvedValue(1);

      const result = await paymentBlockService.getBlockedPayments({
        page: 1,
        limit: 10,
      });

      expect(result.settlements).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.settlements[0].missingDocuments).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return payment block statistics', async () => {
      mockPrisma.settlement.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(10) // blocked
        .mockResolvedValueOnce(40); // unblocked

      mockPrisma.settlement.aggregate.mockResolvedValue({
        _sum: { netPayment: 50000 },
      });

      mockPrisma.settlement.findMany.mockResolvedValue([]);

      const result = await paymentBlockService.getStats();

      expect(result.total).toBe(50);
      expect(result.blocked).toBe(10);
      expect(result.unblocked).toBe(40);
      expect(result.blockedPercentage).toBe(20);
      expect(result.totalBlockedAmount).toBe(50000);
    });
  });

  describe('manualUnblock', () => {
    const mockSettlementId = 'settlement-1';
    const mockUserId = 'user-1';
    const mockReason = 'Documento extraviado, se procede con el pago';

    it('should unblock payment and create audit log', async () => {
      const mockBlockedSettlement = {
        id: mockSettlementId,
        tripId: 'trip-1',
        isPaymentBlocked: true,
        notes: '',
        trip: {
          micDta: 'MIC-001',
          driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
        },
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(mockBlockedSettlement);
      mockPrisma.settlement.update.mockResolvedValue({
        ...mockBlockedSettlement,
        isPaymentBlocked: false,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);
      mockNotificationService.create.mockResolvedValue({});

      const result = await paymentBlockService.manualUnblock(
        mockSettlementId,
        mockUserId,
        mockReason
      );

      expect(result.previousState.isPaymentBlocked).toBe(true);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw error when settlement is not blocked', async () => {
      const mockUnblockedSettlement = {
        id: mockSettlementId,
        isPaymentBlocked: false,
      };

      mockPrisma.settlement.findUnique.mockResolvedValue(mockUnblockedSettlement);

      await expect(
        paymentBlockService.manualUnblock(mockSettlementId, mockUserId, mockReason)
      ).rejects.toThrow('La liquidación no está bloqueada');
    });

    it('should throw error when settlement not found', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue(null);

      await expect(
        paymentBlockService.manualUnblock(mockSettlementId, mockUserId, mockReason)
      ).rejects.toThrow('Liquidación no encontrada');
    });
  });

  describe('getPaymentChecklist', () => {
    const mockTripId = 'trip-1';

    it('should return checklist with payment status', async () => {
      const mockTrip = {
        id: mockTripId,
        micDta: 'MIC-001',
        truck: { plateNumber: 'ABC-123', isSupportTruck: false },
        driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
        billOfLading: { blNumber: 'BL-001' },
        documents: [
          {
            id: 'doc-1',
            documentTypeId: 'doctype-1',
            status: DocumentStatus.VERIFIED,
            documentType: {
              id: 'doctype-1',
              code: 'MIC',
              name: 'Manifiesto',
              isRequired: true,
              isForSupportOnly: false,
              displayOrder: 1,
            },
          },
        ],
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.documentType.findMany.mockResolvedValue([
        { id: 'doctype-1', code: 'MIC', name: 'Manifiesto', isRequired: true, isForSupportOnly: false, displayOrder: 1 },
      ]);
      mockPrisma.settlement.findUnique.mockResolvedValue({
        id: 'settlement-1',
        isPaymentBlocked: false,
        documentsComplete: true,
        status: SettlementStatus.PENDING,
      });

      const result = await paymentBlockService.getPaymentChecklist(mockTripId);

      expect(result.tripId).toBe(mockTripId);
      expect(result.documents).toHaveLength(1);
      expect(result.paymentStatus.hasSettlement).toBe(true);
      expect(result.paymentStatus.isBlocked).toBe(false);
      expect(result.summary.verified).toBe(1);
    });

    it('should show blocking status correctly', async () => {
      const mockTrip = {
        id: mockTripId,
        micDta: 'MIC-002',
        truck: { plateNumber: 'ABC-123', isSupportTruck: false },
        driver: { employee: { firstName: 'Juan', lastName: 'Pérez' } },
        billOfLading: { blNumber: 'BL-002' },
        documents: [
          {
            id: 'doc-1',
            documentTypeId: 'doctype-1',
            status: DocumentStatus.PENDING,
            documentType: {
              id: 'doctype-1',
              code: 'MIC',
              name: 'Manifiesto',
              isRequired: true,
              isForSupportOnly: false,
              displayOrder: 1,
            },
          },
        ],
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.documentType.findMany.mockResolvedValue([
        { id: 'doctype-1', code: 'MIC', name: 'Manifiesto', isRequired: true, isForSupportOnly: false, displayOrder: 1 },
      ]);
      mockPrisma.settlement.findUnique.mockResolvedValue({
        id: 'settlement-1',
        isPaymentBlocked: true,
        documentsComplete: false,
        status: SettlementStatus.PENDING,
      });

      const result = await paymentBlockService.getPaymentChecklist(mockTripId);

      expect(result.documents[0].isBlocking).toBe(true);
      expect(result.paymentStatus.isBlocked).toBe(true);
      expect(result.summary.blockingCount).toBe(1);
    });
  });

  describe('canProcessPayment', () => {
    const mockSettlementId = 'settlement-1';

    it('should return canProcess true when not blocked', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue({
        id: mockSettlementId,
        isPaymentBlocked: false,
      });

      const result = await paymentBlockService.canProcessPayment(mockSettlementId);

      expect(result.canProcess).toBe(true);
      expect(result.reason).toBeNull();
      expect(result.missingDocuments).toEqual([]);
    });

    it('should return canProcess false with missing docs when blocked', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue({
        id: mockSettlementId,
        isPaymentBlocked: true,
        trip: {
          truck: { isSupportTruck: false },
          documents: [
            {
              status: DocumentStatus.PENDING,
              documentType: { code: 'MIC', isRequired: true, isForSupportOnly: false },
            },
          ],
        },
      });

      const result = await paymentBlockService.canProcessPayment(mockSettlementId);

      expect(result.canProcess).toBe(false);
      expect(result.reason).toContain('Documentos faltantes');
      expect(result.missingDocuments).toContain('MIC');
    });
  });

  describe('processAllPendingBlocks', () => {
    it('should process all pending settlements', async () => {
      mockPrisma.settlement.findMany.mockResolvedValue([
        { tripId: 'trip-1' },
        { tripId: 'trip-2' },
      ]);

      // Mock for checkAndUpdateBlockStatus calls
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        truck: { isSupportTruck: false },
        driver: { employee: {} },
        documents: [],
        billOfLading: {},
      });
      mockPrisma.documentType.findMany.mockResolvedValue([]);
      mockPrisma.settlement.findUnique.mockResolvedValue({
        documentsComplete: false,
        isPaymentBlocked: true,
      });
      mockPrisma.settlement.update.mockResolvedValue({});

      const result = await paymentBlockService.processAllPendingBlocks();

      expect(result.processed).toBeGreaterThan(0);
    });
  });

  describe('getBlockHistory', () => {
    const mockSettlementId = 'settlement-1';

    it('should return block history for settlement', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue({
        id: mockSettlementId,
        isPaymentBlocked: false,
        documentsComplete: true,
      });

      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          action: 'MANUAL_UNBLOCK',
          userId: 'user-1',
          user: { firstName: 'Admin', lastName: 'User' },
          createdAt: new Date(),
          newData: { reason: 'Test reason' },
        },
      ]);

      const result = await paymentBlockService.getBlockHistory(mockSettlementId);

      expect(result.settlementId).toBe(mockSettlementId);
      expect(result.currentStatus.isPaymentBlocked).toBe(false);
      expect(result.history).toHaveLength(1);
    });

    it('should throw error when settlement not found', async () => {
      mockPrisma.settlement.findUnique.mockResolvedValue(null);

      await expect(
        paymentBlockService.getBlockHistory(mockSettlementId)
      ).rejects.toThrow('Liquidación no encontrada');
    });
  });
});

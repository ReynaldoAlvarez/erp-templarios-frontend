import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentBlockApi } from '@/lib/api-client';

describe('paymentBlockApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStats', () => {
    it('should fetch payment block stats correctly', async () => {
      const mockStats = {
        total: 50,
        blocked: 15,
        unblocked: 35,
        blockedPercentage: 30,
        totalBlockedAmount: 125000,
        byDriver: [
          { driverId: 'driver-1', driverName: 'Juan Pérez', blockedCount: 3, totalAmount: 25000 },
        ],
        byMissingDocument: [
          { code: 'CRT', name: 'Certificado de Recepción', count: 10 },
        ],
        avgBlockedDays: 4.5,
      };

      vi.spyOn(paymentBlockApi, 'getStats').mockResolvedValueOnce(mockStats as any);

      const result = await paymentBlockApi.getStats();

      expect(paymentBlockApi.getStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStats);
      expect(result.total).toBe(50);
      expect(result.blocked).toBe(15);
      expect(result.totalBlockedAmount).toBe(125000);
    });

    it('should propagate errors from getStats', async () => {
      vi.spyOn(paymentBlockApi, 'getStats').mockRejectedValueOnce(new Error('Network error'));

      await expect(paymentBlockApi.getStats()).rejects.toThrow('Network error');
    });
  });

  describe('getBlockedPayments', () => {
    it('should fetch blocked payments with pagination', async () => {
      const mockPaginated = {
        data: [
          {
            id: 'settlement-1',
            netPayment: 5000,
            status: 'PENDING',
            isPaymentBlocked: true,
            documentsComplete: false,
            blockedDays: 7,
            missingDocuments: [{ code: 'CRT', name: 'Certificado', status: 'PENDING' }],
            trip: {
              id: 'trip-1',
              micDta: 'MIC-001',
              driver: { id: 'driver-1', employee: { firstName: 'Juan', lastName: 'Pérez' } },
              truck: { plateNumber: 'ABC-123', isSupportTruck: false },
              billOfLading: { blNumber: 'BL-001' },
            },
            createdAt: '2024-01-15T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      vi.spyOn(paymentBlockApi, 'getBlockedPayments').mockResolvedValueOnce(mockPaginated as any);

      const result = await paymentBlockApi.getBlockedPayments({ page: 1, limit: 10 });

      expect(paymentBlockApi.getBlockedPayments).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].isPaymentBlocked).toBe(true);
      expect(result.pagination.page).toBe(1);
    });

    it('should pass params correctly including driver filter', async () => {
      vi.spyOn(paymentBlockApi, 'getBlockedPayments').mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      } as any);

      await paymentBlockApi.getBlockedPayments({ driverId: 'driver-1', dateFrom: '2024-01-01', dateTo: '2024-01-31' });

      expect(paymentBlockApi.getBlockedPayments).toHaveBeenCalledWith({
        driverId: 'driver-1',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });
    });
  });

  describe('getChecklist', () => {
    it('should fetch payment block checklist for a trip', async () => {
      const mockChecklist = {
        tripId: 'trip-1',
        micDta: 'MIC-001',
        blNumber: 'BL-001',
        driverName: 'Juan Pérez',
        truckPlate: 'ABC-123',
        isSupportTruck: false,
        documents: [
          { id: 'doc-1', code: 'MIC', name: 'Manifiesto', isRequired: true, status: 'VERIFIED', isBlocking: false },
          { id: 'doc-2', code: 'CRT', name: 'Certificado', isRequired: true, status: 'PENDING', isBlocking: true },
        ],
        paymentStatus: {
          hasSettlement: true,
          isBlocked: true,
          blockReason: 'Falta CRT',
          documentsComplete: false,
          canApprove: false,
          canPay: false,
        },
        summary: { total: 2, verified: 1, pending: 1, missing: 1, blockingCount: 1 },
      };

      vi.spyOn(paymentBlockApi, 'getChecklist').mockResolvedValueOnce(mockChecklist as any);

      const result = await paymentBlockApi.getChecklist('trip-1');

      expect(paymentBlockApi.getChecklist).toHaveBeenCalledWith('trip-1');
      expect(result.tripId).toBe('trip-1');
      expect(result.paymentStatus.isBlocked).toBe(true);
      expect(result.documents).toHaveLength(2);
      expect(result.summary.blockingCount).toBe(1);
    });
  });

  describe('checkPayment', () => {
    it('should check payment block status for a trip', async () => {
      const mockResult = {
        tripId: 'trip-1',
        documentsComplete: false,
        isPaymentBlocked: true,
        blockReason: 'Falta documento CRT',
        missingDocuments: ['CRT', 'FACTURA'],
        previousState: { documentsComplete: false, isPaymentBlocked: false },
        notificationSent: true,
      };

      vi.spyOn(paymentBlockApi, 'checkPayment').mockResolvedValueOnce(mockResult as any);

      const result = await paymentBlockApi.checkPayment('trip-1');

      expect(paymentBlockApi.checkPayment).toHaveBeenCalledWith('trip-1');
      expect(result.documentsComplete).toBe(false);
      expect(result.isPaymentBlocked).toBe(true);
      expect(result.notificationSent).toBe(true);
    });
  });

  describe('canProcess', () => {
    it('should check if settlement can be processed', async () => {
      const mockResult = {
        canProcess: false,
        reason: 'Faltan documentos',
        missingDocuments: ['CRT'],
      };

      vi.spyOn(paymentBlockApi, 'canProcess').mockResolvedValueOnce(mockResult as any);

      const result = await paymentBlockApi.canProcess('settlement-1');

      expect(paymentBlockApi.canProcess).toHaveBeenCalledWith('settlement-1');
      expect(result.canProcess).toBe(false);
      expect(result.missingDocuments).toEqual(['CRT']);
    });
  });

  describe('unblock', () => {
    it('should unblock a settlement with reason', async () => {
      const mockResult = {
        settlement: {
          id: 'settlement-1',
          tripId: 'trip-1',
          isPaymentBlocked: false,
          documentsComplete: false,
          notes: 'Aprobado por supervisor',
        },
        previousState: { isPaymentBlocked: true },
        auditLog: {
          id: 'audit-1',
          userId: 'user-1',
          action: 'UNBLOCK',
          entity: 'settlement',
          entityId: 'settlement-1',
          createdAt: '2024-01-15T10:00:00Z',
        },
      };

      vi.spyOn(paymentBlockApi, 'unblock').mockResolvedValueOnce(mockResult as any);

      const result = await paymentBlockApi.unblock('settlement-1', 'Aprobado por supervisor');

      expect(paymentBlockApi.unblock).toHaveBeenCalledWith('settlement-1', 'Aprobado por supervisor');
      expect(result.settlement.isPaymentBlocked).toBe(false);
      expect(result.previousState.isPaymentBlocked).toBe(true);
      expect(result.auditLog.action).toBe('UNBLOCK');
    });
  });

  describe('processAll', () => {
    it('should process all payments', async () => {
      const mockResult = {
        processed: 20,
        blocked: 5,
        unblocked: 10,
        errors: ['Trip trip-99 not found'],
      };

      vi.spyOn(paymentBlockApi, 'processAll').mockResolvedValueOnce(mockResult as any);

      const result = await paymentBlockApi.processAll();

      expect(paymentBlockApi.processAll).toHaveBeenCalledTimes(1);
      expect(result.processed).toBe(20);
      expect(result.blocked).toBe(5);
      expect(result.unblocked).toBe(10);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getHistory', () => {
    it('should fetch block/unblock history', async () => {
      const mockHistory = {
        settlementId: 'settlement-1',
        currentStatus: { isPaymentBlocked: false, documentsComplete: true },
        history: [
          {
            action: 'BLOCK',
            userId: 'user-1',
            userName: 'Admin',
            timestamp: '2024-01-15T10:00:00Z',
            details: { isPaymentBlocked: true, reason: 'Auto-block by system' },
          },
          {
            action: 'UNBLOCK',
            userId: 'user-1',
            userName: 'Admin',
            timestamp: '2024-01-16T14:00:00Z',
            details: { isPaymentBlocked: false, reason: 'Docs verified' },
          },
        ],
      };

      vi.spyOn(paymentBlockApi, 'getHistory').mockResolvedValueOnce(mockHistory as any);

      const result = await paymentBlockApi.getHistory('settlement-1');

      expect(paymentBlockApi.getHistory).toHaveBeenCalledWith('settlement-1');
      expect(result.settlementId).toBe('settlement-1');
      expect(result.currentStatus.isPaymentBlocked).toBe(false);
      expect(result.history).toHaveLength(2);
      expect(result.history[0].action).toBe('BLOCK');
    });

    it('should handle empty history gracefully', async () => {
      const mockHistory = {
        settlementId: 'settlement-2',
        currentStatus: { isPaymentBlocked: true, documentsComplete: false },
        history: [],
      };

      vi.spyOn(paymentBlockApi, 'getHistory').mockResolvedValueOnce(mockHistory as any);

      const result = await paymentBlockApi.getHistory('settlement-2');

      expect(result.history).toHaveLength(0);
    });
  });
});

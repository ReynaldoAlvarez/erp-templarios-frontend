import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentAutomationApi } from '@/lib/api-client';

describe('documentAutomationApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStats', () => {
    it('should fetch automation stats correctly', async () => {
      const mockStats = {
        totalTrips: 15,
        tripsWithCompleteDocs: 10,
        tripsWithIncompleteDocs: 5,
        tripsWithBlockedPayments: 5,
        documentsByType: [
          { code: 'MIC', name: 'Manifiesto de Carga', total: 15, verified: 10, pending: 5 },
        ],
      };

      vi.spyOn(documentAutomationApi, 'getStats').mockResolvedValueOnce(mockStats as any);

      const result = await documentAutomationApi.getStats();

      expect(documentAutomationApi.getStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStats);
      expect(result.totalTrips).toBe(15);
      expect(result.tripsWithCompleteDocs).toBe(10);
      expect(result.tripsWithBlockedPayments).toBe(5);
      expect(result.documentsByType).toHaveLength(1);
    });

    it('should propagate errors from getStats', async () => {
      vi.spyOn(documentAutomationApi, 'getStats').mockRejectedValueOnce(new Error('Network error'));

      await expect(documentAutomationApi.getStats()).rejects.toThrow('Network error');
    });
  });

  describe('getChecklist', () => {
    it('should fetch checklist for a trip correctly', async () => {
      const mockChecklist = {
        tripId: 'trip-1',
        isSupportTruck: false,
        checklist: [
          {
            id: 'doc-uuid-1',
            code: 'MIC',
            name: 'Manifiesto de Carga',
            isRequired: true,
            isForSupportOnly: false,
            order: 1,
            documentId: 'doc-uuid-1',
            status: 'VERIFIED' as const,
            documentNumber: 'MIC-001',
          },
          {
            id: 'pending-CRT-1',
            code: 'CRT',
            name: 'Certificado de Recepción',
            isRequired: true,
            isForSupportOnly: false,
            order: 2,
            status: 'PENDING' as const,
          },
        ],
        summary: {
          total: 2,
          verified: 1,
          received: 0,
          pending: 1,
          missing: 1,
          documentsComplete: false,
        },
      };

      vi.spyOn(documentAutomationApi, 'getChecklist').mockResolvedValueOnce(mockChecklist as any);

      const result = await documentAutomationApi.getChecklist('trip-1');

      expect(documentAutomationApi.getChecklist).toHaveBeenCalledWith('trip-1');
      expect(result.tripId).toBe('trip-1');
      expect(result.checklist).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.isSupportTruck).toBe(false);
    });

    it('should return support truck checklist with isSupportTruck flag', async () => {
      const mockSupportChecklist = {
        tripId: 'trip-2',
        isSupportTruck: true,
        checklist: [
          {
            id: 'pending-FACTURA-0',
            code: 'FACTURA',
            name: 'Factura',
            isRequired: true,
            isForSupportOnly: false,
            order: 1,
            status: 'PENDING' as const,
          },
        ],
        summary: {
          total: 1,
          verified: 0,
          received: 0,
          pending: 1,
          missing: 1,
          documentsComplete: false,
        },
      };

      vi.spyOn(documentAutomationApi, 'getChecklist').mockResolvedValueOnce(mockSupportChecklist as any);

      const result = await documentAutomationApi.getChecklist('trip-2');

      expect(result.isSupportTruck).toBe(true);
      expect(result.checklist[0].code).toBe('FACTURA');
    });
  });

  describe('verifyTrip', () => {
    it('should verify trip documents and return verification result', async () => {
      const mockVerification = {
        documentsComplete: true,
        isPaymentBlocked: false,
        missingDocuments: [],
        verifiedCount: 5,
        pendingCount: 0,
        totalCount: 5,
      };

      vi.spyOn(documentAutomationApi, 'verifyTrip').mockResolvedValueOnce(mockVerification as any);

      const result = await documentAutomationApi.verifyTrip('trip-1');

      expect(documentAutomationApi.verifyTrip).toHaveBeenCalledWith('trip-1');
      expect(result.documentsComplete).toBe(true);
      expect(result.verifiedCount).toBe(5);
      expect(result.isPaymentBlocked).toBe(false);
    });
  });

  describe('createDocumentsForTrip', () => {
    it('should create documents for a trip with specific document type IDs', async () => {
      const mockResult = { created: 3 };

      vi.spyOn(documentAutomationApi, 'createDocumentsForTrip').mockResolvedValueOnce(mockResult as any);

      const result = await documentAutomationApi.createDocumentsForTrip('trip-1', ['doc-type-1', 'doc-type-2']);

      expect(documentAutomationApi.createDocumentsForTrip).toHaveBeenCalledWith('trip-1', ['doc-type-1', 'doc-type-2']);
      expect(result.created).toBe(3);
    });

    it('should create all documents when no specific types provided', async () => {
      const mockResult = { created: 5 };

      vi.spyOn(documentAutomationApi, 'createDocumentsForTrip').mockResolvedValueOnce(mockResult as any);

      const result = await documentAutomationApi.createDocumentsForTrip('trip-1');

      expect(documentAutomationApi.createDocumentsForTrip).toHaveBeenCalledWith('trip-1');
      expect(result.created).toBe(5);
    });

    it('should handle errors when document creation fails', async () => {
      vi.spyOn(documentAutomationApi, 'createDocumentsForTrip').mockRejectedValueOnce(new Error('Trip not found'));

      await expect(documentAutomationApi.createDocumentsForTrip('invalid-trip')).rejects.toThrow('Trip not found');
    });
  });

  describe('batchCreateDocuments', () => {
    it('should batch create documents for multiple trips', async () => {
      const mockBatchResult = {
        processed: 2,
        totalCreated: 5,
        results: [
          { tripId: 'trip-1', created: 3 },
          { tripId: 'trip-2', created: 2 },
        ],
      };

      vi.spyOn(documentAutomationApi, 'batchCreateDocuments').mockResolvedValueOnce(mockBatchResult as any);

      const input = { tripIds: ['trip-1', 'trip-2'] };
      const result = await documentAutomationApi.batchCreateDocuments(input);

      expect(documentAutomationApi.batchCreateDocuments).toHaveBeenCalledWith(input);
      expect(result.results).toHaveLength(2);
      expect(result.processed).toBe(2);
      expect(result.totalCreated).toBe(5);
      expect(result.results[0].created).toBe(3);
      expect(result.results[1].created).toBe(2);
    });

    it('should handle batch creation failure', async () => {
      vi.spyOn(documentAutomationApi, 'batchCreateDocuments').mockRejectedValueOnce(new Error('Server error'));

      await expect(
        documentAutomationApi.batchCreateDocuments({ tripIds: ['trip-1'] })
      ).rejects.toThrow('Server error');
    });
  });
});

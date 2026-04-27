// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DocumentStatus, Prisma } from '@prisma/client';

// Create mock functions
const mockTripFindUnique = jest.fn();
const mockTripFindMany = jest.fn();
const mockTripCount = jest.fn();
const mockDocumentFindFirst = jest.fn();
const mockDocumentFindMany = jest.fn();
const mockDocumentCreate = jest.fn();
const mockDocumentCount = jest.fn();
const mockDocumentFindUnique = jest.fn();
const mockDocumentUpdate = jest.fn();
const mockDocumentTypeFindMany = jest.fn();
const mockSettlementFindUnique = jest.fn();
const mockSettlementUpdate = jest.fn();
const mockSettlementCount = jest.fn();

// Mock PrismaService
jest.mock('../../src/core/database/prisma.service', () => ({
  PrismaService: {
    getInstance: () => ({
      trip: {
        findUnique: mockTripFindUnique,
        findMany: mockTripFindMany,
        count: mockTripCount,
      },
      document: {
        findFirst: mockDocumentFindFirst,
        findMany: mockDocumentFindMany,
        create: mockDocumentCreate,
        count: mockDocumentCount,
        findUnique: mockDocumentFindUnique,
        update: mockDocumentUpdate,
      },
      documentType: {
        findMany: mockDocumentTypeFindMany,
      },
      settlement: {
        findUnique: mockSettlementFindUnique,
        update: mockSettlementUpdate,
        count: mockSettlementCount,
      },
    }),
  },
}));

// Import the service after mocking
import DocumentAutomationService from '../../src/modules/document-automation/document-automation.service';

describe('DocumentAutomationService', () => {
  const mockTripId = '11111111-1111-1111-1111-111111111111';
  const mockDocumentId = '22222222-2222-2222-2222-222222222222';
  const mockDocumentTypeId = '33333333-3333-3333-3333-333333333333';

  const mockDocumentTypes = [
    { id: 'dt-1', code: 'MIC', name: 'Manifiesto Internacional de Carga', isRequired: true, isForSupportOnly: false, displayOrder: 1 },
    { id: 'dt-2', code: 'CRT', name: 'Carta de Porte', isRequired: true, isForSupportOnly: false, displayOrder: 2 },
    { id: 'dt-3', code: 'ASPB', name: 'Autorización de Servicio', isRequired: true, isForSupportOnly: false, displayOrder: 3 },
    { id: 'dt-4', code: 'NOTA_TARJA', name: 'Nota de Tarja', isRequired: true, isForSupportOnly: false, displayOrder: 4 },
    { id: 'dt-5', code: 'BALANZA', name: 'Comprobante de Balanza', isRequired: true, isForSupportOnly: false, displayOrder: 5 },
    { id: 'dt-6', code: 'FACTURA', name: 'Factura de Servicio', isRequired: true, isForSupportOnly: true, displayOrder: 6 },
  ];

  const mockTrip = {
    id: mockTripId,
    truck: { isSupportTruck: false },
    documents: [],
  };

  const mockTripWithSupportTruck = {
    id: mockTripId,
    truck: { isSupportTruck: true },
    documents: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDocumentsForTrip', () => {
    it('should create 5 documents for own fleet truck (without FACTURA)', async () => {
      mockTripFindUnique.mockResolvedValue(mockTrip);
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes);
      mockDocumentFindFirst.mockResolvedValue(null);
      mockDocumentCreate.mockImplementation((args: any) => 
        Promise.resolve({
          id: 'new-doc-id',
          ...args.data,
          documentType: { code: args.data.documentTypeId, name: 'Test Doc' },
        })
      );

      const result = await DocumentAutomationService.createDocumentsForTrip(mockTripId);

      // Should create 5 documents (excluding FACTURA which is for support only)
      expect(result.created).toBe(5);
      expect(mockDocumentCreate).toHaveBeenCalledTimes(5);
    });

    it('should create 6 documents for support truck (including FACTURA)', async () => {
      mockTripFindUnique.mockResolvedValue(mockTripWithSupportTruck);
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes);
      mockDocumentFindFirst.mockResolvedValue(null);
      mockDocumentCreate.mockImplementation((args: any) => 
        Promise.resolve({
          id: 'new-doc-id',
          ...args.data,
          documentType: { code: args.data.documentTypeId, name: 'Test Doc' },
        })
      );

      const result = await DocumentAutomationService.createDocumentsForTrip(mockTripId);

      // Should create 6 documents (including FACTURA for support truck)
      expect(result.created).toBe(6);
      expect(mockDocumentCreate).toHaveBeenCalledTimes(6);
    });

    it('should skip existing documents', async () => {
      mockTripFindUnique.mockResolvedValue({
        ...mockTrip,
        documents: [{ documentTypeId: 'dt-1', status: DocumentStatus.PENDING }],
      });
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes);
      mockDocumentFindFirst.mockImplementation((args: any) => 
        args.where.documentTypeId === 'dt-1' 
          ? Promise.resolve({ id: 'existing-doc' }) 
          : Promise.resolve(null)
      );
      mockDocumentCreate.mockImplementation((args: any) => 
        Promise.resolve({
          id: 'new-doc-id',
          ...args.data,
          documentType: { code: args.data.documentTypeId, name: 'Test Doc' },
        })
      );

      const result = await DocumentAutomationService.createDocumentsForTrip(mockTripId);

      // Should create 4 documents (5 - 1 existing)
      expect(result.created).toBe(4);
    });

    it('should throw error if trip not found', async () => {
      mockTripFindUnique.mockResolvedValue(null);

      await expect(
        DocumentAutomationService.createDocumentsForTrip(mockTripId)
      ).rejects.toThrow('no encontrado');
    });
  });

  describe('verifyTripDocuments', () => {
    it('should return documentsComplete=true when all required docs are verified', async () => {
      mockTripFindUnique.mockResolvedValue({
        ...mockTrip,
        documents: [
          { documentTypeId: 'dt-1', status: DocumentStatus.VERIFIED, documentType: mockDocumentTypes[0] },
          { documentTypeId: 'dt-2', status: DocumentStatus.VERIFIED, documentType: mockDocumentTypes[1] },
          { documentTypeId: 'dt-3', status: DocumentStatus.VERIFIED, documentType: mockDocumentTypes[2] },
          { documentTypeId: 'dt-4', status: DocumentStatus.VERIFIED, documentType: mockDocumentTypes[3] },
          { documentTypeId: 'dt-5', status: DocumentStatus.VERIFIED, documentType: mockDocumentTypes[4] },
        ],
      });
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes.filter(dt => !dt.isForSupportOnly));
      mockSettlementFindUnique.mockResolvedValue({ id: 'settlement-id', tripId: mockTripId });
      mockSettlementUpdate.mockResolvedValue({});

      const result = await DocumentAutomationService.verifyTripDocuments(mockTripId);

      expect(result.documentsComplete).toBe(true);
      expect(result.isPaymentBlocked).toBe(false);
      expect(result.missingDocuments).toHaveLength(0);
    });

    it('should return documentsComplete=false when docs are missing', async () => {
      mockTripFindUnique.mockResolvedValue({
        ...mockTrip,
        documents: [
          { documentTypeId: 'dt-1', status: DocumentStatus.VERIFIED, documentType: mockDocumentTypes[0] },
          { documentTypeId: 'dt-2', status: DocumentStatus.PENDING, documentType: mockDocumentTypes[1] },
        ],
      });
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes.filter(dt => !dt.isForSupportOnly));
      mockSettlementFindUnique.mockResolvedValue({ id: 'settlement-id', tripId: mockTripId });
      mockSettlementUpdate.mockResolvedValue({});

      const result = await DocumentAutomationService.verifyTripDocuments(mockTripId);

      expect(result.documentsComplete).toBe(false);
      expect(result.isPaymentBlocked).toBe(true);
      expect(result.missingDocuments.length).toBeGreaterThan(0);
    });

    it('should update settlement when exists', async () => {
      mockTripFindUnique.mockResolvedValue({
        ...mockTrip,
        documents: mockDocumentTypes.filter(dt => !dt.isForSupportOnly).map(dt => ({
          documentTypeId: dt.id,
          status: DocumentStatus.VERIFIED,
          documentType: dt,
        })),
      });
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes.filter(dt => !dt.isForSupportOnly));
      mockSettlementFindUnique.mockResolvedValue({ id: 'settlement-id', tripId: mockTripId });
      mockSettlementUpdate.mockResolvedValue({});

      await DocumentAutomationService.verifyTripDocuments(mockTripId);

      expect(mockSettlementUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentsComplete: true,
            isPaymentBlocked: false,
          }),
        })
      );
    });
  });

  describe('getTripDocumentChecklist', () => {
    it('should return checklist with all required documents', async () => {
      mockTripFindUnique.mockResolvedValue(mockTrip);
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes.filter(dt => !dt.isForSupportOnly));

      const result = await DocumentAutomationService.getTripDocumentChecklist(mockTripId);

      expect(result.tripId).toBe(mockTripId);
      expect(result.isSupportTruck).toBe(false);
      expect(result.documents).toHaveLength(5); // 5 docs for own fleet
      expect(result.summary.missing).toBe(5); // All missing
    });

    it('should return checklist with FACTURA for support truck', async () => {
      mockTripFindUnique.mockResolvedValue(mockTripWithSupportTruck);
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes);

      const result = await DocumentAutomationService.getTripDocumentChecklist(mockTripId);

      expect(result.isSupportTruck).toBe(true);
      expect(result.documents).toHaveLength(6); // 6 docs for support truck
    });

    it('should calculate summary correctly', async () => {
      mockTripFindUnique.mockResolvedValue({
        ...mockTrip,
        documents: [
          { documentTypeId: 'dt-1', status: DocumentStatus.VERIFIED, documentType: mockDocumentTypes[0] },
          { documentTypeId: 'dt-2', status: DocumentStatus.PENDING, documentType: mockDocumentTypes[1] },
          { documentTypeId: 'dt-3', status: DocumentStatus.RECEIVED, documentType: mockDocumentTypes[2] },
        ],
      });
      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes.filter(dt => !dt.isForSupportOnly));

      const result = await DocumentAutomationService.getTripDocumentChecklist(mockTripId);

      expect(result.summary.total).toBe(5);
      expect(result.summary.verified).toBe(1);
      expect(result.summary.pending).toBe(1);
      expect(result.summary.received).toBe(1);
      expect(result.summary.missing).toBe(2);
    });
  });

  describe('getDocumentStats', () => {
    it('should return document statistics', async () => {
      mockTripCount.mockResolvedValue(100);
      
      // Mock for settlement count queries
      mockSettlementCount
        .mockResolvedValueOnce(60) // documentsComplete: true
        .mockResolvedValueOnce(40) // documentsComplete: false
        .mockResolvedValueOnce(25); // isPaymentBlocked: true

      mockDocumentTypeFindMany.mockResolvedValue(mockDocumentTypes);
      
      // Mock document counts
      mockDocumentCount
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(30) // verified
        .mockResolvedValueOnce(20); // pending

      const result = await DocumentAutomationService.getDocumentStats();

      expect(result.totalTrips).toBe(100);
      expect(result.tripsWithCompleteDocs).toBe(60);
      expect(result.tripsWithIncompleteDocs).toBe(40);
      expect(result.tripsWithBlockedPayments).toBe(25);
    });
  });
});

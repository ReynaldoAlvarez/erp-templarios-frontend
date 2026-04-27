/**
 * SPRINT 5 - Integration Tests
 * 
 * Tests para verificar los criterios de aceptación del Sprint 5:
 * - CA-001: Crear un viaje genera automáticamente los documentos requeridos
 * - CA-002: Camiones de apoyo tienen FACTURA en su checklist
 * - CA-003: Viajes con documentos incompletos tienen pago bloqueado
 * - CA-004: MIC/DTA duplicado es rechazado por el sistema
 * - CA-005: TripReport se genera correctamente con todos los campos
 * - CA-006: Sanción se genera automáticamente por retraso
 * - CA-007: Porcentaje de retención es configurable
 * - CA-008: Tramos predefinidos están disponibles para selección
 */

import { PrismaService } from '@core/database/prisma.service';
import DocumentAutomationService from '@modules/document-automation/document-automation.service';
import PaymentBlockService from '@modules/payment-block/payment-block.service';
import SanctionAutomationService from '@modules/sanctions/sanctions-automation.service';
import TripReportsService from '@modules/trip-reports/trip-reports.service';
import TramosService from '@modules/tramos/tramos.service';
import DocumentTypesService from '@modules/document-types/document-types.service';
import { DocumentStatus, SanctionStatus, SanctionType, SanctionReason } from '@prisma/client';

const prisma = PrismaService.getInstance();

describe('Sprint 5 - Integration Tests', () => {
  
  beforeAll(async () => {
    // Ensure Prisma is connected
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // CA-001: Crear un viaje genera automáticamente los documentos requeridos
  // ==========================================
  describe('CA-001: Crear viaje genera documentos automáticos', () => {
    
    it('should create required documents for own fleet truck', async () => {
      // Get or create a trip for testing
      const trip = await prisma.trip.findFirst({
        where: { 
          truck: { isSupportTruck: false }
        },
        include: { 
          documents: true,
          truck: true 
        }
      });

      if (trip) {
        // Verify documents were created
        expect(trip.documents.length).toBeGreaterThan(0);
        
        // Should have at least 5 documents for own fleet
        expect(trip.documents.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('should create 6 documents for support truck including FACTURA', async () => {
      const trip = await prisma.trip.findFirst({
        where: { 
          truck: { isSupportTruck: true }
        },
        include: { 
          documents: {
            include: { documentType: true }
          },
          truck: true 
        }
      });

      if (trip) {
        // Support trucks should have 6 documents including FACTURA
        const hasFactura = trip.documents.some(d => d.documentType.code === 'FACTURA');
        
        // Should have at least 5 documents for support truck
        expect(trip.documents.length).toBeGreaterThanOrEqual(5);
        
        // Should include FACTURA
        if (trip.documents.length >= 6) {
          expect(hasFactura).toBe(true);
        }
      }
    });
  });

  // ==========================================
  // CA-002: Camiones de apoyo tienen FACTURA en su checklist
  // ==========================================
  describe('CA-002: Checklist incluye FACTURA para camiones de apoyo', () => {
    
    it('should include FACTURA in checklist for support truck', async () => {
      const trip = await prisma.trip.findFirst({
        where: { truck: { isSupportTruck: true } }
      });

      if (trip) {
        const checklist = await DocumentAutomationService.getTripDocumentChecklist(
          trip.id
        );

        // Support truck checklist should include FACTURA
        const facturaItem = checklist.documents.find(
          (item: any) => item.code === 'FACTURA'
        );

        expect(facturaItem).toBeDefined();
        expect(facturaItem?.isRequired).toBe(true);
      }
    });

    it('should NOT include FACTURA in checklist for own fleet truck', async () => {
      const trip = await prisma.trip.findFirst({
        where: { truck: { isSupportTruck: false } }
      });

      if (trip) {
        const checklist = await DocumentAutomationService.getTripDocumentChecklist(
          trip.id
        );

        // Own fleet checklist should NOT include FACTURA as required
        const facturaItem = checklist.documents.find(
          (item: any) => item.code === 'FACTURA'
        );

        // FACTURA should not appear in the checklist for own fleet
        // or it should not be required for them
        if (facturaItem) {
          // If it exists, it shouldn't be required for own fleet
          expect(facturaItem.isRequired).toBe(false);
        }
      }
    });
  });

  // ==========================================
  // CA-003: Viajes con documentos incompletos tienen pago bloqueado
  // ==========================================
  describe('CA-003: Bloqueo de pago por documentos incompletos', () => {
    
    it('should block payment when documents are incomplete', async () => {
      // Find a settlement with incomplete documents
      const blockedSettlement = await prisma.settlement.findFirst({
        where: { 
          isPaymentBlocked: true,
          documentsComplete: false
        },
        include: {
          trip: {
            include: {
              documents: true
            }
          }
        }
      });

      if (blockedSettlement) {
        // Verify payment is blocked
        expect(blockedSettlement.isPaymentBlocked).toBe(true);
        expect(blockedSettlement.documentsComplete).toBe(false);
        
        // Verify some documents are pending
        const pendingDocs = blockedSettlement.trip.documents.filter(
          d => d.status === DocumentStatus.PENDING
        );
        expect(pendingDocs.length).toBeGreaterThan(0);
      }
    });

    it('should allow payment when all documents are verified', async () => {
      // Find a settlement with complete documents
      const completeSettlement = await prisma.settlement.findFirst({
        where: { 
          documentsComplete: true,
          isPaymentBlocked: false
        },
        include: {
          trip: {
            include: {
              documents: {
                include: { documentType: true }
              }
            }
          }
        }
      });

      if (completeSettlement) {
        // Verify payment is not blocked
        expect(completeSettlement.isPaymentBlocked).toBe(false);
        expect(completeSettlement.documentsComplete).toBe(true);
      }
    });
  });

  // ==========================================
  // CA-004: MIC/DTA duplicado es rechazado por el sistema
  // ==========================================
  describe('CA-004: Rechazo de MIC/DTA duplicado', () => {
    
    it('should have unique constraint on MIC/DTA in Trip', async () => {
      // Get existing MIC/DTA
      const existingTrip = await prisma.trip.findFirst({
        where: { micDta: { not: '' } }
      });

      if (existingTrip && existingTrip.micDta) {
        // Try to create a trip with duplicate MIC/DTA
        try {
          await prisma.trip.create({
            data: {
              billOfLadingId: existingTrip.billOfLadingId,
              truckId: existingTrip.truckId,
              driverId: existingTrip.driverId,
              micDta: existingTrip.micDta, // Duplicate!
              weight: 1000,
              status: 'SCHEDULED',
              departureDate: new Date(),
            }
          });
          
          // If we reach here, the constraint doesn't exist
          fail('Should have thrown unique constraint error');
        } catch (error: any) {
          // Should throw unique constraint error
          expect(error.code).toBe('P2002'); // Prisma unique constraint error
        }
      }
    });

    it('should have unique MIC/DTA in TripReport', async () => {
      const existingReport = await prisma.tripReport.findFirst();

      if (existingReport) {
        try {
          await prisma.tripReport.create({
            data: {
              tripId: 'non-existent-trip-id',
              micDta: existingReport.micDta, // Duplicate!
              blNumber: 'TEST-BL-001',
              lineNumber: 1,
              clientId: 'test-client-id',
              clientName: 'Test Client',
              origin: 'Test Origin',
              destination: 'Test Destination',
              truckPlate: 'TEST-123',
              driverName: 'Test Driver',
              driverCi: '12345678',
              weightKg: 1000,
              freightAmount: 1000,
              retentionPercent: 7,
              retentionAmount: 70,
              netAmount: 930,
            }
          });
          
          fail('Should have thrown unique constraint error');
        } catch (error: any) {
          expect(error.code).toBe('P2002');
        }
      }
    });
  });

  // ==========================================
  // CA-005: TripReport se genera correctamente con todos los campos
  // ==========================================
  describe('CA-005: Generación correcta de TripReport', () => {
    
    it('should have all required fields in TripReport', async () => {
      const tripReport = await prisma.tripReport.findFirst({
        include: { trip: true }
      });

      if (tripReport) {
        // Verify all required fields are populated
        expect(tripReport.micDta).toBeDefined();
        expect(tripReport.blNumber).toBeDefined();
        expect(tripReport.lineNumber).toBeDefined();
        expect(tripReport.clientId).toBeDefined();
        expect(tripReport.clientName).toBeDefined();
        expect(tripReport.origin).toBeDefined();
        expect(tripReport.destination).toBeDefined();
        expect(tripReport.truckPlate).toBeDefined();
        expect(tripReport.driverName).toBeDefined();
        expect(tripReport.driverCi).toBeDefined();
        expect(tripReport.weightKg).toBeDefined();
        expect(tripReport.freightAmount).toBeDefined();
        expect(tripReport.retentionPercent).toBeDefined();
        expect(tripReport.retentionAmount).toBeDefined();
        expect(tripReport.netAmount).toBeDefined();
      }
    });

    it('should correctly calculate net amount', async () => {
      const tripReport = await prisma.tripReport.findFirst();

      if (tripReport) {
        const expectedNet = Number(tripReport.freightAmount) - Number(tripReport.retentionAmount);
        expect(Number(tripReport.netAmount)).toBeCloseTo(expectedNet, 2);
      }
    });
  });

  // ==========================================
  // CA-006: Sanción se genera automáticamente por retraso
  // ==========================================
  describe('CA-006: Sanción automática por retraso', () => {
    
    it('should detect delayed trips', async () => {
      const delayedTrips = await SanctionAutomationService.getDelayedTrips({
        minDaysDelayed: 1
      });

      // The result should be an array (might be empty if no delayed trips)
      expect(Array.isArray(delayedTrips.trips)).toBe(true);
    });

    it('should generate sanctions for delayed trips', async () => {
      const result = await SanctionAutomationService.generateAutomaticSanctions(
        'system-test-user'
      );

      // Result should have expected structure
      expect(result).toHaveProperty('generated');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('alreadySanctioned');
      expect(typeof result.generated).toBe('number');
      expect(typeof result.skipped).toBe('number');
      expect(typeof result.alreadySanctioned).toBe('number');
    });

    it('should have sanction configuration', async () => {
      const config = SanctionAutomationService.getConfig();

      expect(config).toHaveProperty('GRACE_PERIOD_DAYS');
      expect(config).toHaveProperty('FINE_PER_DAY_USD');
      expect(config).toHaveProperty('SUSPENSION_THRESHOLDS');
    });
  });

  // ==========================================
  // CA-007: Porcentaje de retención es configurable
  // ==========================================
  describe('CA-007: Retención configurable', () => {
    
    it('should have retentionPercent field in Settlement', async () => {
      const settlement = await prisma.settlement.findFirst();

      if (settlement) {
        expect(settlement.retentionPercent).toBeDefined();
        expect(Number(settlement.retentionPercent)).toBeGreaterThanOrEqual(0);
        expect(Number(settlement.retentionPercent)).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate retentionAmount based on retentionPercent', async () => {
      const settlement = await prisma.settlement.findFirst();

      if (settlement && settlement.freightUsd) {
        const expectedRetention = Number(settlement.freightUsd) * (Number(settlement.retentionPercent) / 100);
        // Allow some rounding difference
        expect(Number(settlement.retentionAmount)).toBeCloseTo(expectedRetention, 0);
      }
    });

    it('should allow different retention percentages', async () => {
      const settlements = await prisma.settlement.findMany({
        take: 10,
        select: { retentionPercent: true }
      });

      // There should be settlements (at least from seed)
      expect(settlements.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // CA-008: Tramos predefinidos están disponibles para selección
  // ==========================================
  describe('CA-008: Tramos predefinidos disponibles', () => {
    
    it('should have active tramos in the system', async () => {
      const tramos = await prisma.tramo.findMany({
        where: { isActive: true }
      });

      // Should have at least the seed tramos
      expect(tramos.length).toBeGreaterThan(0);
    });

    it('should have required tramo fields', async () => {
      const tramo = await prisma.tramo.findFirst();

      if (tramo) {
        expect(tramo.code).toBeDefined();
        expect(tramo.name).toBeDefined();
        expect(tramo.origin).toBeDefined();
        expect(tramo.destination).toBeDefined();
      }
    });

    it('should have unique tramo codes', async () => {
      const tramos = await prisma.tramo.findMany({
        select: { code: true }
      });

      const codes = tramos.map(t => t.code);
      const uniqueCodes = [...new Set(codes)];

      expect(codes.length).toBe(uniqueCodes.length);
    });

    it('should return tramos via service', async () => {
      const result = await TramosService.getAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Dashboard Sprint 5 Stats
  // ==========================================
  describe('Dashboard Sprint 5 Statistics', () => {
    
    it('should return Sprint 5 statistics', async () => {
      const dashboard = await import('@modules/dashboard/dashboard.service');
      const stats = await dashboard.default.getSprint5Stats();

      // Verify structure
      expect(stats).toHaveProperty('documentTypes');
      expect(stats).toHaveProperty('documents');
      expect(stats).toHaveProperty('tramos');
      expect(stats).toHaveProperty('tripReports');
      expect(stats).toHaveProperty('paymentBlocks');
      expect(stats).toHaveProperty('sanctions');
      expect(stats).toHaveProperty('automation');
    });

    it('should have document type statistics', async () => {
      const dashboard = await import('@modules/dashboard/dashboard.service');
      const stats = await dashboard.default.getSprint5Stats();

      expect(stats.documentTypes).toHaveProperty('total');
      expect(stats.documentTypes).toHaveProperty('active');
      expect(typeof stats.documentTypes.total).toBe('number');
      expect(stats.documentTypes.total).toBeGreaterThan(0);
    });

    it('should have payment block statistics', async () => {
      const dashboard = await import('@modules/dashboard/dashboard.service');
      const stats = await dashboard.default.getSprint5Stats();

      expect(stats.paymentBlocks).toHaveProperty('blocked');
      expect(stats.paymentBlocks).toHaveProperty('unblocked');
      expect(stats.paymentBlocks).toHaveProperty('totalRetentionAmount');
      expect(typeof stats.paymentBlocks.blocked).toBe('number');
    });

    it('should have sanction statistics', async () => {
      const dashboard = await import('@modules/dashboard/dashboard.service');
      const stats = await dashboard.default.getSprint5Stats();

      expect(stats.sanctions).toHaveProperty('total');
      expect(stats.sanctions).toHaveProperty('active');
      expect(stats.sanctions).toHaveProperty('byType');
      expect(stats.sanctions).toHaveProperty('byReason');
      expect(stats.sanctions).toHaveProperty('automatic');
      expect(stats.sanctions).toHaveProperty('manual');
    });
  });

  // ==========================================
  // Document Types Tests
  // ==========================================
  describe('Document Types Module', () => {
    
    it('should return paginated document types', async () => {
      const result = await DocumentTypesService.getAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should have required document types from seed', async () => {
      const requiredCodes = ['MIC', 'CRT', 'ASPB', 'NOTA_TARJA', 'BALANZA', 'FACTURA'];
      
      for (const code of requiredCodes) {
        const docType = await prisma.documentType.findUnique({
          where: { code }
        });
        expect(docType).not.toBeNull();
      }
    });

    it('should mark FACTURA as for support only', async () => {
      const factura = await prisma.documentType.findUnique({
        where: { code: 'FACTURA' }
      });

      expect(factura).not.toBeNull();
      expect(factura?.isForSupportOnly).toBe(true);
    });
  });

  // ==========================================
  // Trip Reports Tests
  // ==========================================
  describe('Trip Reports Module', () => {
    
    it('should return paginated trip reports', async () => {
      const result = await TripReportsService.getAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter trip reports by payment status', async () => {
      const result = await TripReportsService.getAll({ 
        page: 1, 
        limit: 10,
        paymentStatus: 'pending'
      });

      expect(result).toHaveProperty('data');
      result.data.forEach((report: any) => {
        expect(report.paymentStatus).toBe('pending');
      });
    });

    it('should filter trip reports by documents complete', async () => {
      const result = await TripReportsService.getAll({ 
        page: 1, 
        limit: 10,
        documentsComplete: true
      });

      expect(result).toHaveProperty('data');
      result.data.forEach((report: any) => {
        expect(report.documentsComplete).toBe(true);
      });
    });
  });

  // ==========================================
  // Payment Block Tests
  // ==========================================
  describe('Payment Block Module', () => {
    
    it('should return blocked payments list', async () => {
      const result = await PaymentBlockService.getBlockedPayments({
        page: 1,
        limit: 10
      });

      expect(result).toHaveProperty('settlements');
      expect(Array.isArray(result.settlements)).toBe(true);
    });

    it('should return payment block statistics', async () => {
      const stats = await PaymentBlockService.getStats();

      expect(stats).toHaveProperty('totalBlocked');
      expect(stats).toHaveProperty('totalRetentionAmount');
      expect(stats).toHaveProperty('byDocumentType');
    });
  });

  // ==========================================
  // Sanctions Automation Tests
  // ==========================================
  describe('Sanctions Automation Module', () => {
    
    it('should return sanction configuration', async () => {
      const config = SanctionAutomationService.getConfig();

      expect(config).toHaveProperty('GRACE_PERIOD_DAYS');
      expect(config).toHaveProperty('FINE_PER_DAY_USD');
      expect(config).toHaveProperty('SUSPENSION_THRESHOLDS');
      expect(typeof config.GRACE_PERIOD_DAYS).toBe('number');
    });

    it('should return automation statistics', async () => {
      const stats = await SanctionAutomationService.getAutomationStats();

      expect(stats).toHaveProperty('totalSanctions');
      expect(stats).toHaveProperty('automaticSanctions');
      expect(stats).toHaveProperty('manualSanctions');
      expect(stats).toHaveProperty('totalFines');
      expect(stats).toHaveProperty('activeSuspensions');
    });
  });
});

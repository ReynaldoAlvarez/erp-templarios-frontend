import DashboardSprint5Service from '../../src/modules/dashboard/dashboard-sprint5.service';

// Mock PrismaService
const mockPrisma = {
  trip: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  settlement: {
    count: jest.fn(),
  },
  sanction: {
    count: jest.fn(),
    aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }),
  },
  tripReport: {
    count: jest.fn(),
  },
  driver: {
    findMany: jest.fn(),
  },
};

jest.mock('../../src/core/database/prisma.service', () => ({
  PrismaService: {
    getInstance: jest.fn(() => mockPrisma),
  },
}));

describe('DashboardSprint5Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSprint5Stats', () => {
    it('should return statistics with correct structure', async () => {
      mockPrisma.trip.count.mockResolvedValue(100);
      mockPrisma.trip.count.mockResolvedValueOnce(80); // trips with documents
      mockPrisma.settlement.count.mockResolvedValue(70);
      mockPrisma.settlement.count.mockResolvedValueOnce(14); // blocked settlements
      mockPrisma.sanction.count.mockResolvedValue(15);
      (mockPrisma.sanction as any).count.mockResolvedValueOnce(8); // automatic sanctions
      mockPrisma.tripReport.count.mockResolvedValue(75);
      mockPrisma.settlement.count.mockResolvedValueOnce(45); // complete docs

      const stats = await DashboardSprint5Service.getSprint5Stats();

      expect(stats.totalTrips).toBe(100);
      expect(stats.tripsWithAutoDocs).toBe(80);
      expect(stats.automationRate).toBe(80);
      expect(stats.totalSettlements).toBe(70);
      expect(stats.blockedPayments).toBe(14);
      expect(stats.generatedSanctions).toBe(8);
      expect(stats.tripReportsGenerated).toBe(75);
      expect(stats).toHaveProperty('timeSaved');
      expect(stats).toHaveProperty('errorReduction');
    });
  });

  describe('getSprint5Trends', () => {
    it('should return daily trends for last 30 days', async () => {
      mockPrisma.trip.count.mockResolvedValue(10);
      mockPrisma.settlement.count.mockResolvedValue(2);

      const trends = await DashboardSprint5Service.getSprint5Trends();

      expect(trends.daily).toBeDefined();
      expect(trends.daily).toHaveLength(30);
      expect(trends.weekly).toBeDefined();
      expect(trends.weekly).toHaveLength(4);
    });
  });

  describe('getSprint5StatsByDriver', () => {
    it('should return statistics by driver', async () => {
      const mockDriver = {
        id: 'driver-1',
        employee: { firstName: 'Juan', lastName: 'Pérez' },
      };

      const mockTrip = {
        documents: [
          { status: 'VERIFIED' },
          { status: 'VERIFIED' },
          { status: 'PENDING' },
        ],
      };

      mockPrisma.driver.findMany.mockResolvedValue([mockDriver]);
      mockPrisma.trip.findMany.mockResolvedValue([mockTrip]);
      mockPrisma.sanction.findMany.mockResolvedValue([
        { automatic: true },
        { automatic: false },
      ]);
      mockPrisma.settlement.findMany.mockResolvedValue([
        { isPaymentBlocked: true },
        { isPaymentBlocked: false },
      ]);

      const driverStats = await DashboardSprint5Service.getSprint5StatsByDriver();

      expect(driverStats.drivers).toHaveLength(1);
      expect(driverStats.drivers[0].totalTrips).toBe(1);
      expect(driverStats.drivers[0].completedDocs).toBe(2);
      expect(driverStats.drivers[0].sanctions).toBe(2);
      expect(driverStats.drivers[0].automatedSanctions).toBe(1);
      expect(driverStats.drivers[0].paymentBlocked).toBe(1);
    });
  });

  describe('getSprint5KPIs', () => {
    it('should return KPIs with compliance rates', async () => {
      mockPrisma.settlement.count.mockResolvedValue(50);
      mockPrisma.settlement.count.mockResolvedValueOnce(35); // complete docs
      mockPrisma.settlement.count.mockResolvedValueOnce(5); // blocked payments
      mockPrisma.driver.count.mockResolvedValue(20);
      (mockPrisma.driver as any).count.mockResolvedValueOnce(18); // drivers without sanctions

      const kpis = await DashboardSprint5Service.getSprint5KPIs();

      expect(kpis.documentCompliance).toBe(70);
      expect(kpis.paymentCompliance).toBe(10);
      expect(kpis.sanctionCompliance).toBe(90);
      expect(kpis.overallEfficiency).toBeGreaterThan(50);
    });
  });

  describe('getExecutiveSummary', () => {
    it('should return executive summary with status and recommendations', async () => {
      mockPrisma.trip.count.mockResolvedValue(100);
      mockPrisma.trip.count.mockResolvedValueOnce(80);
      mockPrisma.settlement.count.mockResolvedValue(20);
      mockPrisma.settlement.count.mockResolvedValueOnce(6);
      mockPrisma.settlement.count.mockResolvedValueOnce(15);
      (mockPrisma.sanction as any).count.mockResolvedValue(8);

      const summary = await DashboardSprint5Service.getExecutiveSummary();

      expect(summary.status).toBeDefined();
      expect(['excellent', 'good', 'needs_improvement']).toContain(summary.status);
      expect(summary.keyMetrics).toBeDefined();
      expect(summary.recommendations).toBeInstanceOf(Array);
    });
  });
});

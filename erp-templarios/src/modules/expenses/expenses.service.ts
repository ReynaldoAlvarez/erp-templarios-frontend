import { PrismaService } from '../../core/database/prisma.service';
import { NotFoundError, ValidationError } from '../../core/middleware/error.middleware';
import { ExpenseCategory } from '@prisma/client';

const prisma = PrismaService.getInstance();

interface GetAllParams {
  page: number;
  limit: number;
  search?: string;
  driverId?: string;
  tripId?: string;
  category?: ExpenseCategory;
  dateFrom?: Date;
  dateTo?: Date;
}

class ExpensesService {
  async getAll(params: GetAllParams) {
    const { page, limit, search, driverId, tripId, category, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by driver
    if (driverId) {
      where.driverId = driverId;
    }

    // Filter by trip
    if (tripId) {
      where.tripId = tripId;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = dateFrom;
      if (dateTo) where.expenseDate.lte = dateTo;
    }

    // Search filter
    if (search) {
      where.OR = [
        { concept: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        include: {
          driver: {
            include: {
              employee: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          trip: {
            select: {
              id: true,
              micDta: true,
              billOfLading: {
                select: { blNumber: true },
              },
            },
          },
        },
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.expense.count({ where }),
    ]);

    // Calculate totals by category
    const totalsByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
    });

    const totalAmount = totalsByCategory.reduce((sum, t) => sum + Number(t._sum.amount || 0), 0);

    return {
      expenses: expenses.map(expense => ({
        id: expense.id,
        driverId: expense.driverId,
        driverName: `${expense.driver.employee.firstName} ${expense.driver.employee.lastName}`,
        tripId: expense.tripId,
        tripMicDta: expense.trip?.micDta,
        category: expense.category,
        concept: expense.concept,
        amount: Number(expense.amount),
        receiptUrl: expense.receiptUrl,
        expenseDate: expense.expenseDate,
        notes: expense.notes,
        createdAt: expense.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalAmount,
        byCategory: totalsByCategory.map(t => ({
          category: t.category,
          total: Number(t._sum.amount || 0),
        })),
      },
    };
  }

  async getById(id: string) {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            employee: true,
          },
        },
        trip: {
          include: {
            truck: { select: { plateNumber: true } },
            billOfLading: { select: { blNumber: true } },
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundError('Gasto no encontrado');
    }

    return {
      ...expense,
      amount: Number(expense.amount),
    };
  }

  async create(data: any) {
    // Verify driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: data.driverId },
    });

    if (!driver) {
      throw new NotFoundError('Conductor no encontrado');
    }

    // If tripId provided, verify trip exists
    if (data.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: data.tripId },
      });
      if (!trip) {
        throw new NotFoundError('Viaje no encontrado');
      }
    }

    const expense = await prisma.expense.create({
      data: {
        driverId: data.driverId,
        tripId: data.tripId,
        category: data.category,
        concept: data.concept,
        amount: data.amount,
        receiptUrl: data.receiptUrl,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
        notes: data.notes,
      },
      include: {
        driver: {
          include: {
            employee: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return expense;
  }

  async update(id: string, data: any) {
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new NotFoundError('Gasto no encontrado');
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        category: data.category,
        concept: data.concept,
        amount: data.amount,
        receiptUrl: data.receiptUrl,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
        notes: data.notes,
      },
    });

    return expense;
  }

  async delete(id: string) {
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new NotFoundError('Gasto no encontrado');
    }

    await prisma.expense.delete({
      where: { id },
    });

    return { message: 'Gasto eliminado correctamente' };
  }

  async getByDriver(driverId: string, params: { limit?: number }) {
    const expenses = await prisma.expense.findMany({
      where: { driverId },
      take: params.limit || 20,
      orderBy: { expenseDate: 'desc' },
      include: {
        trip: {
          select: { micDta: true },
        },
      },
    });

    // Get totals
    const totals = await prisma.expense.aggregate({
      where: { driverId },
      _sum: { amount: true },
      _count: true,
    });

    return {
      expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
      summary: {
        total: Number(totals._sum.amount || 0),
        count: totals._count,
      },
    };
  }

  async getByTrip(tripId: string) {
    const expenses = await prisma.expense.findMany({
      where: { tripId },
      orderBy: { expenseDate: 'desc' },
      include: {
        driver: {
          include: {
            employee: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      expenses: expenses.map(e => ({ ...e, amount: Number(e.amount) })),
      total,
    };
  }

  async getStats(params: { driverId?: string; dateFrom?: Date; dateTo?: Date }) {
    const where: any = {};

    if (params.driverId) {
      where.driverId = params.driverId;
    }

    if (params.dateFrom || params.dateTo) {
      where.expenseDate = {};
      if (params.dateFrom) where.expenseDate.gte = params.dateFrom;
      if (params.dateTo) where.expenseDate.lte = params.dateTo;
    }

    // Get totals by category
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get totals by driver
    const byDriver = await prisma.expense.groupBy({
      by: ['driverId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // Get driver names
    const driverIds = byDriver.map(d => d.driverId);
    const drivers = await prisma.driver.findMany({
      where: { id: { in: driverIds } },
      include: {
        employee: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const driverMap = new Map(drivers.map(d => [d.id, `${d.employee.firstName} ${d.employee.lastName}`]));

    const total = byCategory.reduce((sum, c) => sum + Number(c._sum.amount || 0), 0);

    return {
      total,
      byCategory: byCategory.map(c => ({
        category: c.category,
        total: Number(c._sum.amount || 0),
        count: c._count,
      })),
      byDriver: byDriver.map(d => ({
        driverId: d.driverId,
        driverName: driverMap.get(d.driverId) || 'Desconocido',
        total: Number(d._sum.amount || 0),
        count: d._count,
      })),
    };
  }

  async getCategories() {
    const labels: Record<ExpenseCategory, string> = {
      FUEL: 'Combustible',
      FOOD: 'Alimentación',
      TOLL: 'Peajes',
      MAINTENANCE: 'Mantenimiento',
      OTHER: 'Otros',
    };

    return Object.values(ExpenseCategory).map(cat => ({
      value: cat,
      label: labels[cat] || cat,
    }));
  }
}

export default new ExpensesService();

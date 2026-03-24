import { PrismaService } from '../../core/database/prisma.service';
import { NotFoundError, ConflictError, ValidationError } from '../../core/middleware/error.middleware';
import { ContractType } from '@prisma/client';

const prisma = PrismaService.getInstance();

interface GetAllParams {
  page: number;
  limit: number;
  search?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  contractType?: ContractType;
}

class DriversService {
  async getAll(params: GetAllParams) {
    const { page, limit, search, isAvailable, isActive, contractType } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by availability
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filter by contract type
    if (contractType) {
      where.contractType = contractType;
    }

    // Search filter
    if (search) {
      where.OR = [
        { employee: { firstName: { contains: search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: search, mode: 'insensitive' } } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { employee: { identityCard: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            include: {
              branch: {
                select: { id: true, name: true },
              },
              company: {
                select: { id: true, name: true },
              },
            },
          },
          _count: {
            select: { trips: true, sanctions: true, expenses: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driver.count({ where }),
    ]);

    return {
      drivers: drivers.map(driver => ({
        id: driver.id,
        employeeId: driver.employeeId,
        fullName: `${driver.employee.firstName} ${driver.employee.lastName}`,
        identityCard: driver.employee.identityCard,
        phone: driver.employee.phone,
        email: driver.employee.email,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        licenseExpiryDate: driver.licenseExpiryDate,
        contractType: driver.contractType,
        isAvailable: driver.isAvailable,
        rating: Number(driver.rating),
        totalTrips: driver.totalTrips,
        isActive: driver.isActive,
        branch: driver.employee.branch,
        company: driver.employee.company,
        tripsCount: driver._count.trips,
        sanctionsCount: driver._count.sanctions,
        expensesCount: driver._count.expenses,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            branch: true,
            company: true,
          },
        },
        trips: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            truck: {
              select: { plateNumber: true, brand: true },
            },
            billOfLading: {
              select: { blNumber: true },
            },
          },
        },
        historyRecords: {
          take: 10,
          orderBy: { occurredAt: 'desc' },
        },
        sanctions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        expenses: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            trip: {
              select: { micDta: true },
            },
          },
        },
        _count: {
          select: { trips: true, sanctions: true, expenses: true },
        },
      },
    });

    if (!driver) {
      throw new NotFoundError('Conductor no encontrado');
    }

    // Calculate statistics
    const stats = await this.getDriverStats(id);

    return {
      ...driver,
      rating: Number(driver.rating),
      stats,
    };
  }

  async getDriverStats(id: string) {
    // Get trips statistics
    const trips = await prisma.trip.findMany({
      where: { driverId: id },
      select: {
        weight: true,
        status: true,
        departureDate: true,
        arrivalDate: true,
      },
    });

    const totalWeightTransported = trips.reduce((sum, t) => sum + Number(t.weight), 0);

    const statusCounts = {
      scheduled: trips.filter(t => t.status === 'SCHEDULED').length,
      inTransit: trips.filter(t => t.status === 'IN_TRANSIT').length,
      atBorder: trips.filter(t => t.status === 'AT_BORDER').length,
      delivered: trips.filter(t => t.status === 'DELIVERED').length,
      cancelled: trips.filter(t => t.status === 'CANCELLED').length,
    };

    // Calculate average delivery time
    const completedTrips = trips.filter(t => t.arrivalDate && t.departureDate);
    const avgDeliveryHours = completedTrips.length > 0
      ? completedTrips.reduce((sum, t) => {
          const hours = (t.arrivalDate!.getTime() - t.departureDate.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedTrips.length
      : 0;

    // Get expenses total
    const expenses = await prisma.expense.aggregate({
      where: { driverId: id },
      _sum: { amount: true },
    });

    // Get sanctions
    const sanctions = await prisma.sanction.count({
      where: { driverId: id, status: 'PENDING' },
    });

    return {
      totalTrips: trips.length,
      totalWeightTransported,
      statusCounts,
      avgDeliveryHours: Math.round(avgDeliveryHours * 10) / 10,
      totalExpenses: Number(expenses._sum.amount || 0),
      pendingSanctions: sanctions,
    };
  }

  async create(data: any, companyId: string, branchId: string) {
    // Check if employee already exists with same identity card
    const existingEmployee = await prisma.employee.findUnique({
      where: { identityCard: data.identityCard },
    });

    if (existingEmployee) {
      throw new ConflictError('Ya existe un empleado con esta cédula de identidad');
    }

    // Check if license number already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });

    if (existingDriver) {
      throw new ConflictError('Ya existe un conductor con este número de licencia');
    }

    // Create employee and driver in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create employee first
      const employee = await tx.employee.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          identityCard: data.identityCard,
          address: data.address,
          phone: data.phone,
          email: data.email,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          position: 'Conductor',
          salary: data.salary,
          branchId,
          companyId,
        },
      });

      // Create driver
      const driver = await tx.driver.create({
        data: {
          employeeId: employee.id,
          licenseNumber: data.licenseNumber,
          licenseCategory: data.licenseCategory,
          licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
          contractType: data.contractType || ContractType.MONTHLY,
        },
        include: {
          employee: true,
        },
      });

      return driver;
    });

    return result;
  }

  async update(id: string, data: any) {
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existingDriver) {
      throw new NotFoundError('Conductor no encontrado');
    }

    // Check if license number is being changed and if it conflicts
    if (data.licenseNumber && data.licenseNumber !== existingDriver.licenseNumber) {
      const driverWithLicense = await prisma.driver.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });
      if (driverWithLicense) {
        throw new ConflictError('Ya existe un conductor con este número de licencia');
      }
    }

    // Update employee and driver in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update employee
      if (data.firstName || data.lastName || data.phone || data.email || data.address) {
        await tx.employee.update({
          where: { id: existingDriver.employeeId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
            address: data.address,
          },
        });
      }

      // Update driver
      const driver = await tx.driver.update({
        where: { id },
        data: {
          licenseNumber: data.licenseNumber,
          licenseCategory: data.licenseCategory,
          licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : undefined,
          contractType: data.contractType,
        },
        include: {
          employee: true,
        },
      });

      return driver;
    });

    return result;
  }

  async delete(id: string) {
    const existingDriver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!existingDriver) {
      throw new NotFoundError('Conductor no encontrado');
    }

    // Check if driver has active trips
    const activeTrips = await prisma.trip.count({
      where: {
        driverId: id,
        status: { in: ['SCHEDULED', 'IN_TRANSIT', 'AT_BORDER'] },
      },
    });

    if (activeTrips > 0) {
      throw new ValidationError('No se puede desactivar un conductor con viajes activos');
    }

    // Soft delete driver
    await prisma.driver.update({
      where: { id },
      data: { isActive: false, isAvailable: false },
    });

    return { message: 'Conductor desactivado correctamente' };
  }

  async restore(id: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundError('Conductor no encontrado');
    }

    if (driver.isActive) {
      throw new ValidationError('El conductor ya está activo');
    }

    await prisma.driver.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Conductor reactivado correctamente' };
  }

  async setAvailability(id: string, isAvailable: boolean) {
    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundError('Conductor no encontrado');
    }

    if (!driver.isActive) {
      throw new ValidationError('No se puede cambiar disponibilidad de un conductor inactivo');
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: { isAvailable },
    });

    return updatedDriver;
  }

  async getAvailable() {
    const drivers = await prisma.driver.findMany({
      where: {
        isActive: true,
        isAvailable: true,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    return drivers.map(d => ({
      id: d.id,
      fullName: `${d.employee.firstName} ${d.employee.lastName}`,
      phone: d.employee.phone,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      rating: Number(d.rating),
      totalTrips: d.totalTrips,
    }));
  }

  async search(query: string, limit: number = 10) {
    const drivers = await prisma.driver.findMany({
      where: {
        isActive: true,
        OR: [
          { employee: { firstName: { contains: query, mode: 'insensitive' } } },
          { employee: { lastName: { contains: query, mode: 'insensitive' } } },
          { licenseNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return drivers.map(d => ({
      id: d.id,
      fullName: `${d.employee.firstName} ${d.employee.lastName}`,
      licenseNumber: d.licenseNumber,
      isAvailable: d.isAvailable,
    }));
  }
}

export default new DriversService();

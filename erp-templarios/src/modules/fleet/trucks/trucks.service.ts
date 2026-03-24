import { PrismaService } from '../../../core/database/prisma.service';
import { NotFoundError, ConflictError, ValidationError } from '../../../core/middleware/error.middleware';
import { TripStatus } from '@prisma/client';

const prisma = PrismaService.getInstance();

interface GetAllParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  isActive?: boolean;
}

class TrucksService {
  async getAll(params: GetAllParams) {
    const { page, limit, search, status, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status
    if (status && Object.values(TripStatus).includes(status as TripStatus)) {
      where.status = status;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search filter
    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [trucks, total] = await Promise.all([
      prisma.truck.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: {
            select: { id: true, name: true },
          },
          trailers: {
            select: { id: true, plateNumber: true, type: true },
          },
          _count: {
            select: { trips: true, maintenances: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.truck.count({ where }),
    ]);

    return {
      trucks: trucks.map(truck => ({
        id: truck.id,
        plateNumber: truck.plateNumber,
        brand: truck.brand,
        model: truck.model,
        year: truck.year,
        color: truck.color,
        axles: truck.axles,
        capacityTons: Number(truck.capacityTons),
        operationPermit: truck.operationPermit,
        operationPermitExpiry: truck.operationPermitExpiry,
        mileage: truck.mileage,
        status: truck.status,
        isActive: truck.isActive,
        company: truck.company,
        trailers: truck.trailers,
        tripsCount: truck._count.trips,
        maintenancesCount: truck._count.maintenances,
        createdAt: truck.createdAt,
        updatedAt: truck.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const truck = await prisma.truck.findUnique({
      where: { id },
      include: {
        company: true,
        trailers: true,
        trips: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            driver: {
              include: {
                employee: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
            billOfLading: {
              select: { blNumber: true },
            },
          },
        },
        maintenances: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { trips: true, maintenances: true },
        },
      },
    });

    if (!truck) {
      throw new NotFoundError('Camión no encontrado');
    }

    // Calculate statistics
    const stats = await this.getTruckStats(id);

    return {
      ...truck,
      capacityTons: Number(truck.capacityTons),
      stats,
    };
  }

  async getTruckStats(id: string) {
    // Get trips statistics
    const trips = await prisma.trip.findMany({
      where: { truckId: id },
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

    // Get maintenance statistics
    const maintenances = await prisma.maintenance.findMany({
      where: { truckId: id },
      select: { cost: true, status: true },
    });

    const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + Number(m.cost || 0), 0);
    const pendingMaintenance = maintenances.filter(m => m.status === 'PENDING').length;

    return {
      totalTrips: trips.length,
      totalWeightTransported,
      statusCounts,
      totalMaintenanceCost,
      pendingMaintenance,
    };
  }

  async create(data: any, companyId: string) {
    // Check if plate number already exists
    const existingTruck = await prisma.truck.findUnique({
      where: { plateNumber: data.plateNumber },
    });

    if (existingTruck) {
      throw new ConflictError('Ya existe un camión con esta placa');
    }

    const truck = await prisma.truck.create({
      data: {
        plateNumber: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color,
        axles: data.axles || 2,
        capacityTons: data.capacityTons,
        operationPermit: data.operationPermit,
        operationPermitExpiry: data.operationPermitExpiry,
        mileage: data.mileage || 0,
        companyId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
      },
    });

    return truck;
  }

  async update(id: string, data: any) {
    const existingTruck = await prisma.truck.findUnique({
      where: { id },
    });

    if (!existingTruck) {
      throw new NotFoundError('Camión no encontrado');
    }

    // Check if plate number is being changed and if it conflicts
    if (data.plateNumber && data.plateNumber !== existingTruck.plateNumber) {
      const truckWithPlate = await prisma.truck.findUnique({
        where: { plateNumber: data.plateNumber },
      });
      if (truckWithPlate) {
        throw new ConflictError('Ya existe un camión con esta placa');
      }
    }

    const truck = await prisma.truck.update({
      where: { id },
      data: {
        plateNumber: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color,
        axles: data.axles,
        capacityTons: data.capacityTons,
        operationPermit: data.operationPermit,
        operationPermitExpiry: data.operationPermitExpiry,
        mileage: data.mileage,
      },
    });

    return truck;
  }

  async delete(id: string) {
    const existingTruck = await prisma.truck.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trips: true },
        },
      },
    });

    if (!existingTruck) {
      throw new NotFoundError('Camión no encontrado');
    }

    // Check if truck has active trips
    const activeTrips = await prisma.trip.count({
      where: {
        truckId: id,
        status: { in: ['SCHEDULED', 'IN_TRANSIT', 'AT_BORDER'] },
      },
    });

    if (activeTrips > 0) {
      throw new ValidationError('No se puede desactivar un camión con viajes activos');
    }

    // Soft delete
    await prisma.truck.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Camión desactivado correctamente' };
  }

  async restore(id: string) {
    const truck = await prisma.truck.findUnique({
      where: { id },
    });

    if (!truck) {
      throw new NotFoundError('Camión no encontrado');
    }

    if (truck.isActive) {
      throw new ValidationError('El camión ya está activo');
    }

    await prisma.truck.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Camión reactivado correctamente' };
  }

  async updateMileage(id: string, mileage: number) {
    const truck = await prisma.truck.findUnique({
      where: { id },
    });

    if (!truck) {
      throw new NotFoundError('Camión no encontrado');
    }

    if (mileage < truck.mileage) {
      throw new ValidationError('El nuevo kilometraje no puede ser menor al actual');
    }

    const updatedTruck = await prisma.truck.update({
      where: { id },
      data: { mileage },
    });

    return updatedTruck;
  }

  async getAvailable(params: { date?: Date }) {
    // Get trucks that are active and not assigned to active trips
    const trucks = await prisma.truck.findMany({
      where: {
        isActive: true,
        status: TripStatus.SCHEDULED,
        NOT: {
          trips: {
            some: {
              status: { in: ['SCHEDULED', 'IN_TRANSIT', 'AT_BORDER'] },
              ...(params.date && {
                OR: [
                  { departureDate: { lte: params.date }, arrivalDate: { gte: params.date } },
                  { departureDate: { gte: params.date }, arrivalDate: null },
                ],
              }),
            },
          },
        },
      },
      include: {
        trailers: {
          where: { isActive: true },
        },
      },
    });

    return trucks;
  }

  async search(query: string, limit: number = 10) {
    const trucks = await prisma.truck.findMany({
      where: {
        isActive: true,
        OR: [
          { plateNumber: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        capacityTons: true,
        status: true,
      },
    });

    return trucks.map(t => ({ ...t, capacityTons: Number(t.capacityTons) }));
  }
}

export default new TrucksService();

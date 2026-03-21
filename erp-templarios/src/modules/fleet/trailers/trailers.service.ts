import { PrismaService } from '../../../core/database/prisma.service';
import { NotFoundError, ConflictError, ValidationError } from '../../../core/middleware/error.middleware';

const prisma = PrismaService.getInstance();

interface GetAllParams {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  truckId?: string;
}

class TrailersService {
  async getAll(params: GetAllParams) {
    const { page, limit, search, isActive, truckId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filter by truck
    if (truckId) {
      where.truckId = truckId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [trailers, total] = await Promise.all([
      prisma.trailer.findMany({
        where,
        skip,
        take: limit,
        include: {
          truck: {
            select: { id: true, plateNumber: true, brand: true },
          },
          _count: {
            select: { trips: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trailer.count({ where }),
    ]);

    return {
      trailers: trailers.map(trailer => ({
        id: trailer.id,
        plateNumber: trailer.plateNumber,
        type: trailer.type,
        brand: trailer.brand,
        year: trailer.year,
        capacityTons: Number(trailer.capacityTons),
        operationPermit: trailer.operationPermit,
        operationPermitExpiry: trailer.operationPermitExpiry,
        truckId: trailer.truckId,
        truck: trailer.truck,
        isActive: trailer.isActive,
        tripsCount: trailer._count.trips,
        createdAt: trailer.createdAt,
        updatedAt: trailer.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const trailer = await prisma.trailer.findUnique({
      where: { id },
      include: {
        truck: true,
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
        _count: {
          select: { trips: true },
        },
      },
    });

    if (!trailer) {
      throw new NotFoundError('Remolque no encontrado');
    }

    return {
      ...trailer,
      capacityTons: Number(trailer.capacityTons),
    };
  }

  async create(data: any) {
    // Check if plate number already exists
    const existingTrailer = await prisma.trailer.findUnique({
      where: { plateNumber: data.plateNumber },
    });

    if (existingTrailer) {
      throw new ConflictError('Ya existe un remolque con esta placa');
    }

    // If truckId provided, verify truck exists
    if (data.truckId) {
      const truck = await prisma.truck.findUnique({
        where: { id: data.truckId },
      });
      if (!truck) {
        throw new NotFoundError('Camión no encontrado');
      }
    }

    const trailer = await prisma.trailer.create({
      data: {
        plateNumber: data.plateNumber,
        type: data.type,
        brand: data.brand,
        year: data.year,
        capacityTons: data.capacityTons,
        operationPermit: data.operationPermit,
        operationPermitExpiry: data.operationPermitExpiry ? new Date(data.operationPermitExpiry) : null,
        truckId: data.truckId,
      },
      include: {
        truck: {
          select: { id: true, plateNumber: true },
        },
      },
    });

    return trailer;
  }

  async update(id: string, data: any) {
    const existingTrailer = await prisma.trailer.findUnique({
      where: { id },
    });

    if (!existingTrailer) {
      throw new NotFoundError('Remolque no encontrado');
    }

    // Check if plate number is being changed and if it conflicts
    if (data.plateNumber && data.plateNumber !== existingTrailer.plateNumber) {
      const trailerWithPlate = await prisma.trailer.findUnique({
        where: { plateNumber: data.plateNumber },
      });
      if (trailerWithPlate) {
        throw new ConflictError('Ya existe un remolque con esta placa');
      }
    }

    // If truckId provided, verify truck exists
    if (data.truckId !== undefined) {
      if (data.truckId) {
        const truck = await prisma.truck.findUnique({
          where: { id: data.truckId },
        });
        if (!truck) {
          throw new NotFoundError('Camión no encontrado');
        }
      }
    }

    const trailer = await prisma.trailer.update({
      where: { id },
      data: {
        plateNumber: data.plateNumber,
        type: data.type,
        brand: data.brand,
        year: data.year,
        capacityTons: data.capacityTons,
        operationPermit: data.operationPermit,
        operationPermitExpiry: data.operationPermitExpiry ? new Date(data.operationPermitExpiry) : undefined,
        truckId: data.truckId,
      },
    });

    return trailer;
  }

  async delete(id: string) {
    const existingTrailer = await prisma.trailer.findUnique({
      where: { id },
    });

    if (!existingTrailer) {
      throw new NotFoundError('Remolque no encontrado');
    }

    // Check if trailer has active trips
    const activeTrips = await prisma.trip.count({
      where: {
        trailerId: id,
        status: { in: ['SCHEDULED', 'IN_TRANSIT', 'AT_BORDER'] },
      },
    });

    if (activeTrips > 0) {
      throw new ValidationError('No se puede desactivar un remolque con viajes activos');
    }

    // Soft delete
    await prisma.trailer.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Remolque desactivado correctamente' };
  }

  async restore(id: string) {
    const trailer = await prisma.trailer.findUnique({
      where: { id },
    });

    if (!trailer) {
      throw new NotFoundError('Remolque no encontrado');
    }

    if (trailer.isActive) {
      throw new ValidationError('El remolque ya está activo');
    }

    await prisma.trailer.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Remolque reactivado correctamente' };
  }

  async assignToTruck(id: string, truckId: string | null) {
    const trailer = await prisma.trailer.findUnique({
      where: { id },
    });

    if (!trailer) {
      throw new NotFoundError('Remolque no encontrado');
    }

    // If assigning to a truck, verify it exists
    if (truckId) {
      const truck = await prisma.truck.findUnique({
        where: { id: truckId },
      });
      if (!truck) {
        throw new NotFoundError('Camión no encontrado');
      }
    }

    const updatedTrailer = await prisma.trailer.update({
      where: { id },
      data: { truckId },
    });

    return updatedTrailer;
  }

  async getAvailable() {
    const trailers = await prisma.trailer.findMany({
      where: {
        isActive: true,
        truckId: null,
      },
    });

    return trailers.map(t => ({
      ...t,
      capacityTons: Number(t.capacityTons),
    }));
  }

  async search(query: string, limit: number = 10) {
    const trailers = await prisma.trailer.findMany({
      where: {
        isActive: true,
        OR: [
          { plateNumber: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        plateNumber: true,
        type: true,
        capacityTons: true,
        truckId: true,
        brand: true,
        year: true,
      },
    });

    return trailers.map(t => ({ ...t, capacityTons: Number(t.capacityTons) }));
  }
}

export default new TrailersService();

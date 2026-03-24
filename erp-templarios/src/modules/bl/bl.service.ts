import { PrismaService } from '../../core/database/prisma.service';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '../../core/middleware/error.middleware';
import { TripStatus, DeliveryType } from '@prisma/client';

const prisma = PrismaService.getInstance();

interface GetAllParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface CreateBLData {
  blNumber: string;
  totalWeight: number;
  unitCount: number;
  cargoType?: string;
  originPort: string;
  customsPoint: string;
  finalDestination: string;
  vessel?: string;
  consignee?: string;
  deliveryType?: DeliveryType;
  clientId: string;
}

interface BLWithTrips {
  id: string;
  blNumber: string;
  totalWeight: number;
  unitCount: number;
  cargoType: string | null;
  originPort: string;
  customsPoint: string;
  finalDestination: string;
  vessel: string | null;
  consignee: string | null;
  deliveryType: DeliveryType;
  status: TripStatus;
  clientId: string;
  client: {
    id: string;
    businessName: string;
    nit: string;
  };
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  trips: {
    id: string;
    micDta: string;
    weight: number;
    status: TripStatus;
    departureDate: Date;
    arrivalDate: Date | null;
    driver: {
      id: string;
      employee: {
        firstName: string;
        lastName: string;
      };
    };
    truck: {
      id: string;
      plateNumber: string;
    };
  }[];
  _count?: {
    trips: number;
  };
}

class BLService {
  async getAll(params: GetAllParams) {
    const { page, limit, search, status, clientId, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status
    if (status && Object.values(TripStatus).includes(status as TripStatus)) {
      where.status = status;
    }

    // Filter by client
    if (clientId) {
      where.clientId = clientId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    // Search filter
    if (search) {
      where.OR = [
        { blNumber: { contains: search, mode: 'insensitive' } },
        { vessel: { contains: search, mode: 'insensitive' } },
        { consignee: { contains: search, mode: 'insensitive' } },
        { client: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bls, total] = await Promise.all([
      prisma.billOfLading.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, businessName: true, nit: true },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { trips: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.billOfLading.count({ where }),
    ]);

    // Calculate progress for each BL
    const blsWithProgress = await Promise.all(
      bls.map(async (bl) => {
        const trips = await prisma.trip.findMany({
          where: { billOfLadingId: bl.id },
          select: { weight: true, status: true },
        });

        const totalTransported = trips.reduce((sum, t) => sum + Number(t.weight), 0);
        const deliveredTrips = trips.filter(t => t.status === 'DELIVERED').length;

        return {
          ...bl,
          tripsCount: bl._count?.trips || 0,
          progress: {
            totalWeight: Number(bl.totalWeight),
            transportedWeight: totalTransported,
            remainingWeight: Number(bl.totalWeight) - totalTransported,
            progressPercent: Number(bl.totalWeight) > 0
              ? (totalTransported / Number(bl.totalWeight)) * 100
              : 0,
            deliveredTrips,
            totalTrips: trips.length,
          },
        };
      })
    );

    return {
      bls: blsWithProgress,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const bl = await prisma.billOfLading.findUnique({
      where: { id },
      include: {
        client: true,
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        trips: {
          include: {
            truck: {
              select: { id: true, plateNumber: true, brand: true, model: true },
            },
            driver: {
              include: {
                employee: {
                  select: { firstName: true, lastName: true, phone: true },
                },
              },
            },
            trailer: {
              select: { id: true, plateNumber: true, type: true },
            },
            routes: true,
            borderCrossings: {
              include: {
                channelHistory: true,
              },
            },
            settlement: true,
          },
        },
      },
    });

    if (!bl) {
      throw new NotFoundError('Bill of Lading no encontrado');
    }

    // Calculate statistics
    const stats = await this.getBLStats(id);

    return {
      ...bl,
      totalWeight: Number(bl.totalWeight),
      stats,
    };
  }

  async getBLStats(id: string) {
    const trips = await prisma.trip.findMany({
      where: { billOfLadingId: id },
      select: {
        weight: true,
        status: true,
        departureDate: true,
        arrivalDate: true,
      },
    });

    const bl = await prisma.billOfLading.findUnique({
      where: { id },
      select: { totalWeight: true },
    });

    const totalWeight = Number(bl?.totalWeight) || 0;
    const totalTransported = trips.reduce((sum, t) => sum + Number(t.weight), 0);

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

    return {
      totalWeight,
      transportedWeight: totalTransported,
      remainingWeight: totalWeight - totalTransported,
      progressPercent: totalWeight > 0 ? (totalTransported / totalWeight) * 100 : 0,
      tripsCount: trips.length,
      statusCounts,
      avgDeliveryHours: Math.round(avgDeliveryHours * 10) / 10,
    };
  }

  async create(data: CreateBLData, userId: string) {
    // Check if BL number already exists
    const existingBL = await prisma.billOfLading.findUnique({
      where: { blNumber: data.blNumber },
    });

    if (existingBL) {
      throw new ConflictError('Ya existe un Bill of Lading con este número');
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new NotFoundError('Cliente no encontrado');
    }

    const bl = await prisma.billOfLading.create({
      data: {
        blNumber: data.blNumber,
        totalWeight: data.totalWeight,
        unitCount: data.unitCount,
        cargoType: data.cargoType,
        originPort: data.originPort,
        customsPoint: data.customsPoint,
        finalDestination: data.finalDestination,
        vessel: data.vessel,
        consignee: data.consignee,
        deliveryType: data.deliveryType || DeliveryType.DIRECT,
        clientId: data.clientId,
        status: TripStatus.SCHEDULED,
      },
      include: {
        client: {
          select: { id: true, businessName: true, nit: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'BillOfLading',
        entityId: bl.id,
        newData: bl as any,
      },
    });

    return bl;
  }

  async update(id: string, data: Partial<CreateBLData>, userId: string) {
    const existingBL = await prisma.billOfLading.findUnique({
      where: { id },
    });

    if (!existingBL) {
      throw new NotFoundError('Bill of Lading no encontrado');
    }

    // Check if BL number is being changed and if it conflicts
    if (data.blNumber && data.blNumber !== existingBL.blNumber) {
      const blWithNumber = await prisma.billOfLading.findUnique({
        where: { blNumber: data.blNumber },
      });
      if (blWithNumber) {
        throw new ConflictError('Ya existe un Bill of Lading con este número');
      }
    }

    const bl = await prisma.billOfLading.update({
      where: { id },
      data: {
        blNumber: data.blNumber,
        totalWeight: data.totalWeight,
        unitCount: data.unitCount,
        cargoType: data.cargoType,
        originPort: data.originPort,
        customsPoint: data.customsPoint,
        finalDestination: data.finalDestination,
        vessel: data.vessel,
        consignee: data.consignee,
        deliveryType: data.deliveryType,
        clientId: data.clientId,
      },
      include: {
        client: {
          select: { id: true, businessName: true, nit: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'BillOfLading',
        entityId: bl.id,
        oldData: existingBL as any,
        newData: bl as any,
      },
    });

    return bl;
  }

  async approve(id: string, userId: string) {
    const bl = await prisma.billOfLading.findUnique({
      where: { id },
    });

    if (!bl) {
      throw new NotFoundError('Bill of Lading no encontrado');
    }

    if (bl.approvedById) {
      throw new ValidationError('El Bill of Lading ya está aprobado');
    }

    const updatedBL = await prisma.billOfLading.update({
      where: { id },
      data: {
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'APPROVE',
        entity: 'BillOfLading',
        entityId: bl.id,
        oldData: { approved: false } as any,
        newData: { approved: true, approvedById: userId } as any,
      },
    });

    return updatedBL;
  }

  async cancel(id: string, reason: string, userId: string) {
    const bl = await prisma.billOfLading.findUnique({
      where: { id },
      include: {
        trips: { where: { status: { notIn: ['CANCELLED', 'DELIVERED'] } } },
      },
    });

    if (!bl) {
      throw new NotFoundError('Bill of Lading no encontrado');
    }

    if (bl.status === 'CANCELLED') {
      throw new ValidationError('El Bill of Lading ya está cancelado');
    }

    if (bl.trips.length > 0) {
      throw new ValidationError('No se puede cancelar un BL con viajes activos');
    }

    const updatedBL = await prisma.billOfLading.update({
      where: { id },
      data: {
        status: TripStatus.CANCELLED,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CANCEL',
        entity: 'BillOfLading',
        entityId: bl.id,
        oldData: { status: bl.status } as any,
        newData: { status: 'CANCELLED', reason } as any,
      },
    });

    return updatedBL;
  }

  async getByNumber(blNumber: string) {
    const bl = await prisma.billOfLading.findUnique({
      where: { blNumber },
      include: {
        client: {
          select: { id: true, businessName: true, nit: true },
        },
        trips: {
          select: {
            id: true,
            micDta: true,
            weight: true,
            status: true,
            departureDate: true,
            truck: {
              select: { plateNumber: true },
            },
            driver: {
              include: {
                employee: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!bl) {
      throw new NotFoundError('Bill of Lading no encontrado');
    }

    return bl;
  }

  async getProgressReport(id: string) {
    const bl = await prisma.billOfLading.findUnique({
      where: { id },
      include: {
        trips: {
          include: {
            truck: true,
            driver: {
              include: {
                employee: true,
              },
            },
            routes: true,
            borderCrossings: {
              include: {
                channelHistory: true,
              },
            },
          },
        },
      },
    });

    if (!bl) {
      throw new NotFoundError('Bill of Lading no encontrado');
    }

    const totalWeight = Number(bl.totalWeight);
    const trips = bl.trips;

    // Group trips by status
    const byStatus = {
      scheduled: trips.filter(t => t.status === 'SCHEDULED'),
      inTransit: trips.filter(t => t.status === 'IN_TRANSIT'),
      atBorder: trips.filter(t => t.status === 'AT_BORDER'),
      delivered: trips.filter(t => t.status === 'DELIVERED'),
      cancelled: trips.filter(t => t.status === 'CANCELLED'),
    };

    // Calculate weights
    const weightByStatus = {
      scheduled: byStatus.scheduled.reduce((sum, t) => sum + Number(t.weight), 0),
      inTransit: byStatus.inTransit.reduce((sum, t) => sum + Number(t.weight), 0),
      atBorder: byStatus.atBorder.reduce((sum, t) => sum + Number(t.weight), 0),
      delivered: byStatus.delivered.reduce((sum, t) => sum + Number(t.weight), 0),
      cancelled: byStatus.cancelled.reduce((sum, t) => sum + Number(t.weight), 0),
    };

    return {
      bl: {
        id: bl.id,
        blNumber: bl.blNumber,
        totalWeight,
        unitCount: bl.unitCount,
        status: bl.status,
      },
      progress: {
        totalWeight,
        delivered: weightByStatus.delivered,
        pending: totalWeight - weightByStatus.delivered,
        percentComplete: totalWeight > 0 ? (weightByStatus.delivered / totalWeight) * 100 : 0,
      },
      tripsByStatus: {
        scheduled: { count: byStatus.scheduled.length, weight: weightByStatus.scheduled },
        inTransit: { count: byStatus.inTransit.length, weight: weightByStatus.inTransit },
        atBorder: { count: byStatus.atBorder.length, weight: weightByStatus.atBorder },
        delivered: { count: byStatus.delivered.length, weight: weightByStatus.delivered },
        cancelled: { count: byStatus.cancelled.length, weight: weightByStatus.cancelled },
      },
      details: trips.map(trip => ({
        id: trip.id,
        micDta: trip.micDta,
        weight: Number(trip.weight),
        status: trip.status,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate,
        truck: trip.truck.plateNumber,
        driver: `${trip.driver.employee.firstName} ${trip.driver.employee.lastName}`,
        route: trip.routes[0]
          ? `${trip.routes[0].origin} → ${trip.routes[0].destination}`
          : null,
        borderStatus: trip.borderCrossings[0]?.channelHistory[0]?.channel || null,
      })),
    };
  }

  async search(query: string, limit: number = 10) {
    const bls = await prisma.billOfLading.findMany({
      where: {
        OR: [
          { blNumber: { contains: query, mode: 'insensitive' } },
          { vessel: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        blNumber: true,
        totalWeight: true,
        status: true,
        originPort: true,
        finalDestination: true,
        client: {
          select: {
            businessName: true,
          },
        },
      },
    });

    return bls;
  }
}

export default new BLService();

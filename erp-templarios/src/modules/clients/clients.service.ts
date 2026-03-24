import { PrismaService } from '../../core/database/prisma.service';
import { NotFoundError, ConflictError, ValidationError } from '../../core/middleware/error.middleware';

const prisma = PrismaService.getInstance();

interface GetAllParams {
  page: number;
  limit: number;
  search?: string;
  hasCredit?: boolean;
  isActive?: boolean;
}

class ClientsService {
  async getAll(params: GetAllParams) {
    const { page, limit, search, hasCredit, isActive } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by credit
    if (hasCredit !== undefined) {
      where.hasCredit = hasCredit;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search filter
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { nit: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { billsOfLading: true, invoices: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients: clients.map(client => ({
        id: client.id,
        businessName: client.businessName,
        nit: client.nit,
        contactName: client.contactName,
        phone: client.phone,
        email: client.email,
        address: client.address,
        hasCredit: client.hasCredit,
        creditLimit: client.creditLimit,
        isActive: client.isActive,
        billsOfLadingCount: client._count.billsOfLading,
        invoicesCount: client._count.invoices,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        billsOfLading: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            blNumber: true,
            totalWeight: true,
            unitCount: true,
            status: true,
            originPort: true,
            finalDestination: true,
            createdAt: true,
          },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            invoiceDate: true,
          },
        },
        _count: {
          select: { billsOfLading: true, invoices: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Calculate statistics
    const stats = await this.getClientStats(id);

    return {
      id: client.id,
      businessName: client.businessName,
      nit: client.nit,
      contactName: client.contactName,
      phone: client.phone,
      email: client.email,
      address: client.address,
      hasCredit: client.hasCredit,
      creditLimit: client.creditLimit,
      isActive: client.isActive,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      recentBillsOfLading: client.billsOfLading,
      recentInvoices: client.invoices,
      totals: {
        billsOfLading: client._count.billsOfLading,
        invoices: client._count.invoices,
      },
      stats,
    };
  }

  async getClientStats(id: string) {
    // Get total weight transported
    const blStats = await prisma.billOfLading.aggregate({
      where: { clientId: id },
      _sum: { totalWeight: true, unitCount: true },
      _count: true,
    });

    // Get trips count
    const tripsCount = await prisma.trip.count({
      where: {
        billOfLading: { clientId: id },
      },
    });

    // Get total invoiced
    const invoiceStats = await prisma.invoice.aggregate({
      where: { clientId: id, status: 'PAID' },
      _sum: { totalAmount: true },
    });

    return {
      totalBillsOfLading: blStats._count,
      totalWeightKg: blStats._sum.totalWeight || 0,
      totalUnits: blStats._sum.unitCount || 0,
      totalTrips: tripsCount,
      totalInvoicedBob: invoiceStats._sum.totalAmount || 0,
    };
  }

  async create(data: any) {
    // Check if NIT already exists
    const existingClient = await prisma.client.findUnique({
      where: { nit: data.nit },
    });

    if (existingClient) {
      throw new ConflictError('Ya existe un cliente con este NIT');
    }

    // Validate credit limit if has credit
    if (data.hasCredit && !data.creditLimit) {
      throw new ValidationError('El límite de crédito es requerido cuando el cliente tiene crédito');
    }

    const client = await prisma.client.create({
      data: {
        businessName: data.businessName,
        nit: data.nit,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        hasCredit: data.hasCredit || false,
        creditLimit: data.creditLimit,
      },
    });

    return client;
  }

  async update(id: string, data: any) {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Check NIT uniqueness if changing
    if (data.nit && data.nit !== existingClient.nit) {
      const nitExists = await prisma.client.findUnique({
        where: { nit: data.nit },
      });
      if (nitExists) {
        throw new ConflictError('Ya existe un cliente con este NIT');
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        businessName: data.businessName,
        nit: data.nit,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        hasCredit: data.hasCredit,
        creditLimit: data.creditLimit,
      },
    });

    return client;
  }

  async delete(id: string) {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { billsOfLading: true },
        },
      },
    });

    if (!existingClient) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Check if client has BLs
    if (existingClient._count.billsOfLading > 0) {
      throw new ValidationError('No se puede eliminar un cliente con Bills of Lading asociados');
    }

    // Soft delete
    await prisma.client.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Cliente desactivado correctamente' };
  }

  async restore(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundError('Cliente no encontrado');
    }

    if (client.isActive) {
      throw new ValidationError('El cliente ya está activo');
    }

    await prisma.client.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Cliente reactivado correctamente' };
  }

  async getCreditStatus(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        businessName: true,
        hasCredit: true,
        creditLimit: true,
      },
    });

    if (!client) {
      throw new NotFoundError('Cliente no encontrado');
    }

    if (!client.hasCredit) {
      return {
        hasCredit: false,
        creditLimit: 0,
        usedCredit: 0,
        availableCredit: 0,
        pendingInvoices: [],
      };
    }

    // Get pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        clientId: id,
        status: { in: ['PENDING', 'ISSUED'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        invoiceDate: true,
        status: true,
      },
    });

    const usedCredit = pendingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const creditLimit = Number(client.creditLimit) || 0;

    return {
      hasCredit: true,
      creditLimit,
      usedCredit,
      availableCredit: Math.max(0, creditLimit - usedCredit),
      utilizationPercent: creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0,
      pendingInvoices,
    };
  }

  async search(query: string, limit: number = 10) {
    const clients = await prisma.client.findMany({
      where: {
        isActive: true,
        OR: [
          { businessName: { contains: query, mode: 'insensitive' } },
          { nit: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        businessName: true,
        nit: true,
        hasCredit: true,
      },
    });

    return clients;
  }
}

export default new ClientsService();

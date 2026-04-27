// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundError, ConflictError } from '../../src/core/middleware/error.middleware';
import { Tramo } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Create mock functions
const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCount = jest.fn();

// Mock PrismaService
jest.mock('../../src/core/database/prisma.service', () => ({
  PrismaService: {
    getInstance: () => ({
      tramo: {
        findMany: mockFindMany,
        findUnique: mockFindUnique,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        count: mockCount,
      },
    }),
  },
}));

// Import the service after mocking
import TramosService from '../../src/modules/tramos/tramos.service';

describe('TramosService', () => {
  const mockTramo: Tramo = {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'MAT-CBA',
    name: 'Matarani - Cochabamba',
    origin: 'Matarani',
    destination: 'Cochabamba',
    distanceKm: new Prisma.Decimal(845.50),
    estimatedHours: 18,
    baseRateUsd: new Prisma.Decimal(1200.00),
    baseRateBob: null,
    isActive: true,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated tramos', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);
      mockCount.mockResolvedValue(1);

      const result = await TramosService.getAll({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by isActive', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);
      mockCount.mockResolvedValue(1);

      await TramosService.getAll({
        page: 1,
        limit: 10,
        isActive: true,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should filter by search term', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);
      mockCount.mockResolvedValue(1);

      await TramosService.getAll({
        page: 1,
        limit: 10,
        search: 'Matarani',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { code: { contains: 'Matarani', mode: 'insensitive' } },
              { name: { contains: 'Matarani', mode: 'insensitive' } },
              { origin: { contains: 'Matarani', mode: 'insensitive' } },
              { destination: { contains: 'Matarani', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should filter by origin', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);
      mockCount.mockResolvedValue(1);

      await TramosService.getAll({
        page: 1,
        limit: 10,
        origin: 'Matarani',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            origin: { contains: 'Matarani', mode: 'insensitive' },
          },
        })
      );
    });

    it('should filter by destination', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);
      mockCount.mockResolvedValue(1);

      await TramosService.getAll({
        page: 1,
        limit: 10,
        destination: 'Cochabamba',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            destination: { contains: 'Cochabamba', mode: 'insensitive' },
          },
        })
      );
    });

    it('should calculate correct pagination for multiple pages', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(25);

      const result = await TramosService.getAll({
        page: 2,
        limit: 10,
      });

      expect(result.meta.totalPages).toBe(3);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('getById', () => {
    it('should return tramo by ID', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockTramo,
        _count: { routes: 5 },
      });

      const result = await TramosService.getById(mockTramo.id);

      expect(result.id).toBe(mockTramo.id);
      expect(result.code).toBe(mockTramo.code);
    });

    it('should throw NotFoundError when tramo not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TramosService.getById('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByCode', () => {
    it('should return tramo by code', async () => {
      mockFindUnique.mockResolvedValue(mockTramo);

      const result = await TramosService.getByCode('MAT-CBA');

      expect(result.code).toBe('MAT-CBA');
    });

    it('should throw NotFoundError when code not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TramosService.getByCode('INVALID')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const createData = {
      code: 'TEST-CBA',
      name: 'Test - Cochabamba',
      origin: 'Test',
      destination: 'Cochabamba',
      distanceKm: 500,
      estimatedHours: 10,
      baseRateUsd: 800,
    };

    it('should create a new tramo', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        ...mockTramo,
        ...createData,
        id: 'new-uuid',
      });

      const result = await TramosService.create(createData);

      expect(result.code).toBe(createData.code);
      expect(result.name).toBe(createData.name);
    });

    it('should throw ConflictError when code already exists', async () => {
      mockFindUnique.mockResolvedValue(mockTramo);

      await expect(
        TramosService.create(createData)
      ).rejects.toThrow(ConflictError);
    });

    it('should use custom values for optional fields', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockTramo);

      await TramosService.create({
        ...createData,
        baseRateBob: 5500,
        isActive: false,
        notes: 'Test notes',
      });

      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Tramo Name',
      distanceKm: 900,
    };

    it('should update an existing tramo', async () => {
      mockFindUnique.mockResolvedValue(mockTramo);
      mockUpdate.mockResolvedValue({
        ...mockTramo,
        ...updateData,
      });

      const result = await TramosService.update(mockTramo.id, updateData);

      expect(result.name).toBe(updateData.name);
    });

    it('should throw NotFoundError when tramo not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TramosService.update('non-existent-id', updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing code', async () => {
      mockFindUnique
        .mockResolvedValueOnce(mockTramo)
        .mockResolvedValueOnce({ ...mockTramo, id: 'different-id' });

      await expect(
        TramosService.update(mockTramo.id, { code: 'ARI-LPZ' })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow updating to same code', async () => {
      mockFindUnique.mockResolvedValue(mockTramo);
      mockUpdate.mockResolvedValue(mockTramo);

      await TramosService.update(mockTramo.id, { code: 'MAT-CBA' });

      expect(mockFindUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should soft delete when routes exist', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockTramo,
        _count: { routes: 5 },
      });
      mockUpdate.mockResolvedValue({
        ...mockTramo,
        isActive: false,
      });

      const result = await TramosService.delete(mockTramo.id);

      expect(result.isActive).toBe(false);
    });

    it('should hard delete when no routes exist', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockTramo,
        _count: { routes: 0 },
      });
      mockDelete.mockResolvedValue(mockTramo);

      await TramosService.delete(mockTramo.id);

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: mockTramo.id },
      });
    });

    it('should throw NotFoundError when tramo not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TramosService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted tramo', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockTramo,
        isActive: false,
      });
      mockUpdate.mockResolvedValue({
        ...mockTramo,
        isActive: true,
      });

      const result = await TramosService.restore(mockTramo.id);

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundError when tramo not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        TramosService.restore('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActive', () => {
    it('should return only active tramos', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);

      const result = await TramosService.getActive();

      expect(result).toHaveLength(1);
    });
  });

  describe('getByOrigin', () => {
    it('should return tramos by origin', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);

      const result = await TramosService.getByOrigin('Matarani');

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          origin: { contains: 'Matarani', mode: 'insensitive' },
        },
        orderBy: { code: 'asc' },
      });
    });
  });

  describe('getByDestination', () => {
    it('should return tramos by destination', async () => {
      mockFindMany.mockResolvedValue([mockTramo]);

      const result = await TramosService.getByDestination('Cochabamba');

      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          destination: { contains: 'Cochabamba', mode: 'insensitive' },
        },
        orderBy: { code: 'asc' },
      });
    });
  });

  describe('getOrigins', () => {
    it('should return unique origins', async () => {
      mockFindMany.mockResolvedValue([
        { origin: 'Matarani' },
        { origin: 'Arica' },
        { origin: 'Desaguadero' },
      ]);

      const result = await TramosService.getOrigins();

      expect(result).toEqual(['Matarani', 'Arica', 'Desaguadero']);
    });
  });

  describe('getDestinations', () => {
    it('should return unique destinations', async () => {
      mockFindMany.mockResolvedValue([
        { destination: 'Cochabamba' },
        { destination: 'La Paz' },
        { destination: 'Santa Cruz' },
      ]);

      const result = await TramosService.getDestinations();

      expect(result).toEqual(['Cochabamba', 'La Paz', 'Santa Cruz']);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      mockCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2);

      mockFindMany.mockResolvedValue([
        { distanceKm: new Prisma.Decimal(845.50), baseRateUsd: new Prisma.Decimal(1200), origin: 'Matarani', destination: 'Cochabamba' },
        { distanceKm: new Prisma.Decimal(520), baseRateUsd: new Prisma.Decimal(850), origin: 'Arica', destination: 'La Paz' },
        { distanceKm: null, baseRateUsd: null, origin: 'Matarani', destination: 'Santa Cruz' },
      ]);

      const stats = await TramosService.getStats();

      expect(stats.total).toBe(10);
      expect(stats.active).toBe(8);
      expect(stats.inactive).toBe(2);
      expect(stats.avgDistance).toBe(682.75);
      expect(stats.avgRateUsd).toBe(1025);
      expect(stats.totalOrigins).toBe(2);
      expect(stats.totalDestinations).toBe(3);
    });

    it('should handle empty tramos list', async () => {
      mockCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockFindMany.mockResolvedValue([]);

      const stats = await TramosService.getStats();

      expect(stats.total).toBe(0);
      expect(stats.avgDistance).toBeNull();
      expect(stats.avgRateUsd).toBeNull();
    });
  });
});

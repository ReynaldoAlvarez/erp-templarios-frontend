// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NotFoundError, ConflictError } from '../../src/core/middleware/error.middleware';
import { DocumentType } from '@prisma/client';

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
      documentType: {
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
import DocumentTypesService from '../../src/modules/document-types/document-types.service';

describe('DocumentTypesService', () => {
  const mockDocumentType: DocumentType = {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'MIC',
    name: 'Manifiesto Internacional de Carga',
    description: 'Documento aduanero principal',
    isRequired: true,
    isForSupportOnly: false,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated document types', async () => {
      mockFindMany.mockResolvedValue([mockDocumentType]);
      mockCount.mockResolvedValue(1);

      const result = await DocumentTypesService.getAll({
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
      mockFindMany.mockResolvedValue([mockDocumentType]);
      mockCount.mockResolvedValue(1);

      await DocumentTypesService.getAll({
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
      mockFindMany.mockResolvedValue([mockDocumentType]);
      mockCount.mockResolvedValue(1);

      await DocumentTypesService.getAll({
        page: 1,
        limit: 10,
        search: 'MIC',
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { code: { contains: 'MIC', mode: 'insensitive' } },
              { name: { contains: 'MIC', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should calculate correct pagination for multiple pages', async () => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(25);

      const result = await DocumentTypesService.getAll({
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
    it('should return document type by ID', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockDocumentType,
        _count: { documents: 5 },
      });

      const result = await DocumentTypesService.getById(mockDocumentType.id);

      expect(result.id).toBe(mockDocumentType.id);
      expect(result.code).toBe(mockDocumentType.code);
    });

    it('should throw NotFoundError when document type not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        DocumentTypesService.getById('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getByCode', () => {
    it('should return document type by code', async () => {
      mockFindUnique.mockResolvedValue(mockDocumentType);

      const result = await DocumentTypesService.getByCode('MIC');

      expect(result.code).toBe('MIC');
    });

    it('should throw NotFoundError when code not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        DocumentTypesService.getByCode('INVALID')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const createData = {
      code: 'NEW_DOC',
      name: 'New Document Type',
      description: 'Test description',
    };

    it('should create a new document type', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        ...mockDocumentType,
        ...createData,
        id: 'new-uuid',
      });

      const result = await DocumentTypesService.create(createData);

      expect(result.code).toBe(createData.code);
      expect(result.name).toBe(createData.name);
    });

    it('should throw ConflictError when code already exists', async () => {
      mockFindUnique.mockResolvedValue(mockDocumentType);

      await expect(
        DocumentTypesService.create(createData)
      ).rejects.toThrow(ConflictError);
    });

    it('should use custom values for optional fields', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockDocumentType);

      await DocumentTypesService.create({
        ...createData,
        isRequired: false,
        isForSupportOnly: true,
        displayOrder: 10,
        isActive: false,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isRequired: false,
          isForSupportOnly: true,
          displayOrder: 10,
          isActive: false,
        }),
      });
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Name',
      description: 'Updated description',
    };

    it('should update an existing document type', async () => {
      mockFindUnique.mockResolvedValue(mockDocumentType);
      mockUpdate.mockResolvedValue({
        ...mockDocumentType,
        ...updateData,
      });

      const result = await DocumentTypesService.update(mockDocumentType.id, updateData);

      expect(result.name).toBe(updateData.name);
    });

    it('should throw NotFoundError when document type not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        DocumentTypesService.update('non-existent-id', updateData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing code', async () => {
      mockFindUnique
        .mockResolvedValueOnce(mockDocumentType)
        .mockResolvedValueOnce({ ...mockDocumentType, id: 'different-id' });

      await expect(
        DocumentTypesService.update(mockDocumentType.id, { code: 'CRT' })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow updating to same code', async () => {
      mockFindUnique.mockResolvedValue(mockDocumentType);
      mockUpdate.mockResolvedValue(mockDocumentType);

      await DocumentTypesService.update(mockDocumentType.id, { code: 'MIC' });

      expect(mockFindUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should soft delete when documents exist', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockDocumentType,
        _count: { documents: 5 },
      });
      mockUpdate.mockResolvedValue({
        ...mockDocumentType,
        isActive: false,
      });

      const result = await DocumentTypesService.delete(mockDocumentType.id);

      expect(result.isActive).toBe(false);
    });

    it('should hard delete when no documents exist', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockDocumentType,
        _count: { documents: 0 },
      });
      mockDelete.mockResolvedValue(mockDocumentType);

      await DocumentTypesService.delete(mockDocumentType.id);

      expect(mockDelete).toHaveBeenCalledWith({
        where: { id: mockDocumentType.id },
      });
    });

    it('should throw NotFoundError when document type not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        DocumentTypesService.delete('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted document type', async () => {
      mockFindUnique.mockResolvedValue({
        ...mockDocumentType,
        isActive: false,
      });
      mockUpdate.mockResolvedValue({
        ...mockDocumentType,
        isActive: true,
      });

      const result = await DocumentTypesService.restore(mockDocumentType.id);

      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundError when document type not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(
        DocumentTypesService.restore('non-existent-id')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getActive', () => {
    it('should return only active document types', async () => {
      mockFindMany.mockResolvedValue([mockDocumentType]);

      const result = await DocumentTypesService.getActive();

      expect(result).toHaveLength(1);
    });
  });

  describe('getRequired', () => {
    it('should return required document types', async () => {
      mockFindMany.mockResolvedValue([mockDocumentType]);

      await DocumentTypesService.getRequired();

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          isRequired: true,
        },
        orderBy: { displayOrder: 'asc' },
      });
    });

    it('should filter by forSupportOnly when provided', async () => {
      mockFindMany.mockResolvedValue([]);

      await DocumentTypesService.getRequired(true);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          isRequired: true,
          isForSupportOnly: true,
        },
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('reorder', () => {
    it('should update display order for multiple items', async () => {
      const items = [
        { id: 'id-1', displayOrder: 1 },
        { id: 'id-2', displayOrder: 2 },
      ];

      mockUpdate
        .mockResolvedValueOnce({ ...mockDocumentType, id: 'id-1', displayOrder: 1 })
        .mockResolvedValueOnce({ ...mockDocumentType, id: 'id-2', displayOrder: 2 });

      const result = await DocumentTypesService.reorder(items);

      expect(result).toHaveLength(2);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      mockCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const stats = await DocumentTypesService.getStats();

      expect(stats).toEqual({
        total: 10,
        active: 8,
        inactive: 2,
        required: 6,
        optional: 2,
        forSupportOnly: 1,
      });
    });
  });
});

import { DocumentType } from '@prisma/client';

// Mock data
export const mockDocumentTypes: DocumentType[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'MIC',
    name: 'Manifiesto Internacional de Carga',
    description: 'Documento aduanero principal',
    isRequired: true,
    isForSupportOnly: false,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'CRT',
    name: 'Carta de Porte',
    description: 'Documento de transporte',
    isRequired: true,
    isForSupportOnly: false,
    displayOrder: 2,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    code: 'FACTURA',
    name: 'Factura de Servicio',
    description: 'Solo para transportistas de apoyo',
    isRequired: true,
    isForSupportOnly: true,
    displayOrder: 6,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock PrismaService
export const mockPrismaService = {
  documentType: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockPrismaService.documentType).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DocumentChecklist } from '@/components/sprint5/DocumentChecklist';
import type { DocumentChecklistResponse } from '@/types/api';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockChecklistData: DocumentChecklistResponse = {
  tripId: 'trip-1',
  isSupportTruck: false,
  checklist: [
    {
      id: 'doc-uuid-1',
      code: 'MIC',
      name: 'Manifiesto de Carga',
      isRequired: true,
      isForSupportOnly: false,
      order: 1,
      documentId: 'doc-uuid-1',
      status: 'VERIFIED',
      documentNumber: 'MIC-001',
    },
    {
      id: 'doc-uuid-2',
      code: 'CRT',
      name: 'Certificado de Recepción de Transporte',
      isRequired: true,
      isForSupportOnly: false,
      order: 2,
      status: 'PENDING',
    },
    {
      id: 'doc-uuid-3',
      code: 'ASPB',
      name: 'Aduana',
      isRequired: false,
      isForSupportOnly: false,
      order: 3,
      status: 'RECEIVED',
      fileUrl: 'https://example.com/aspb.pdf',
      documentNumber: 'ASPB-001',
    },
  ],
  summary: {
    total: 3,
    verified: 1,
    received: 1,
    pending: 1,
    missing: 1,
    documentsComplete: false,
  },
};

describe('DocumentChecklist', () => {
  it('renders loading state correctly', () => {
    render(
      <DocumentChecklist isLoading={true} />
    );

    expect(screen.getByText('Checklist de Documentos')).toBeInTheDocument();
    // Should show skeleton items (h-5 and h-6 classes)
    const container = document.querySelector('[class*="space-y-4"]');
    expect(container).toBeTruthy();
  });

  it('renders nothing when data is undefined and not loading', () => {
    const { container } = render(
      <DocumentChecklist data={undefined} isLoading={false} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders checklist items correctly', () => {
    render(
      <DocumentChecklist data={mockChecklistData} />
    );

    expect(screen.getByText('Checklist de Documentos')).toBeInTheDocument();
    
    // Check all checklist items are rendered
    expect(screen.getByText('MIC')).toBeInTheDocument();
    expect(screen.getByText('Manifiesto de Carga')).toBeInTheDocument();
    expect(screen.getByText('CRT')).toBeInTheDocument();
    expect(screen.getByText('Certificado de Recepción de Transporte')).toBeInTheDocument();
    expect(screen.getByText('ASPB')).toBeInTheDocument();
    expect(screen.getByText('Aduana')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(
      <DocumentChecklist data={mockChecklistData} />
    );

    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Recibido')).toBeInTheDocument();
  });

  it('displays progress percentage correctly', () => {
    render(
      <DocumentChecklist data={mockChecklistData} />
    );

    // 1 verified out of 3 = 33%
    expect(screen.getByText(/33%/)).toBeInTheDocument();
    expect(screen.getByText(/1 verificados/)).toBeInTheDocument();
    expect(screen.getByText(/3 documentos/)).toBeInTheDocument();
  });

  it('displays summary badges', () => {
    render(
      <DocumentChecklist data={mockChecklistData} />
    );

    expect(screen.getByText(/1 Verificados/)).toBeInTheDocument();
    expect(screen.getByText(/1 Recibidos/)).toBeInTheDocument();
    expect(screen.getByText(/1 Pendientes/)).toBeInTheDocument();
  });

  it('shows support truck indicator when isSupportTruck is true', () => {
    const supportTruckData: DocumentChecklistResponse = {
      ...mockChecklistData,
      isSupportTruck: true,
      truckPlate: 'XYZ-789',
    };

    render(
      <DocumentChecklist data={supportTruckData} />
    );

    expect(screen.getByText(/Camión de soporte/)).toBeInTheDocument();
    expect(screen.getByText(/XYZ-789/)).toBeInTheDocument();
  });

  it('does not show support truck indicator when isSupportTruck is false', () => {
    render(
      <DocumentChecklist data={mockChecklistData} />
    );

    expect(screen.queryByText(/Camión de soporte/)).not.toBeInTheDocument();
  });

  it('shows generate button when onCreateDocuments is provided and there are missing docs', () => {
    const onCreateDocs = vi.fn();

    render(
      <DocumentChecklist
        data={mockChecklistData}
        onCreateDocuments={onCreateDocs}
      />
    );

    expect(screen.getByText('Generar Faltantes')).toBeInTheDocument();
  });

  it('shows empty state when checklist is empty', () => {
    const emptyData: DocumentChecklistResponse = {
      ...mockChecklistData,
      checklist: [],
      summary: { total: 0, verified: 0, received: 0, pending: 0, missing: 0, documentsComplete: true },
    };

    render(
      <DocumentChecklist data={emptyData} />
    );

    expect(screen.getByText('No hay documentos requeridos para este viaje')).toBeInTheDocument();
  });

  it('renders all required badges for required documents', () => {
    render(
      <DocumentChecklist data={mockChecklistData} />
    );

    const requiredBadges = screen.getAllByText('Req.');
    // MIC and CRT are required (2 items)
    expect(requiredBadges.length).toBe(2);
  });

  it('displays document numbers when present', () => {
    render(
      <DocumentChecklist data={mockChecklistData} />
    );

    expect(screen.getByText('MIC-001')).toBeInTheDocument();
    expect(screen.getByText('ASPB-001')).toBeInTheDocument();
  });
});

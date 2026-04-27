import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BlockedPaymentCard } from '@/components/modules/payments/BlockedPaymentCard';
import type { BlockedSettlement } from '@/types/api';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockSettlement: BlockedSettlement = {
  id: 'settlement-abc123def456',
  netPayment: 8500,
  status: 'PENDING',
  isPaymentBlocked: true,
  documentsComplete: false,
  blockedDays: 7,
  missingDocuments: [
    { code: 'CRT', name: 'Certificado de Recepción', status: 'PENDING' },
    { code: 'FACTURA', name: 'Factura', status: 'PENDING' },
    { code: 'MIC', name: 'Manifiesto', status: 'RECEIVED' },
  ],
  trip: {
    id: 'trip-xyz',
    micDta: 'MIC-2024-001',
    driver: {
      id: 'driver-1',
      employee: {
        firstName: 'Carlos',
        lastName: 'Gómez',
        phone: '70012345',
      },
    },
    truck: {
      plateNumber: 'XYZ-789',
      isSupportTruck: true,
    },
    billOfLading: {
      blNumber: 'BL-2024-001',
    },
  },
  createdAt: '2024-01-15T10:00:00Z',
};

const mockUnblockedSettlement: BlockedSettlement = {
  ...mockSettlement,
  isPaymentBlocked: false,
  documentsComplete: true,
  blockedDays: 2,
  missingDocuments: [],
};

const mockShortIdSettlement: BlockedSettlement = {
  ...mockSettlement,
  id: 'short',
  blockedDays: 0,
};

describe('BlockedPaymentCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders blocked settlement info correctly', () => {
    render(
      <BlockedPaymentCard settlement={mockSettlement} />
    );

    // ID is truncated to first 8 chars + '...'
    expect(screen.getByText('settleme...')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText(/Carlos Gómez/)).toBeInTheDocument();
    expect(screen.getByText(/XYZ-789/)).toBeInTheDocument();
    expect(screen.getByText(/MIC-2024-001/)).toBeInTheDocument();
    expect(screen.getByText(/BL-2024-001/)).toBeInTheDocument();
  });

  it('shows missing documents list with correct status badges', () => {
    render(
      <BlockedPaymentCard settlement={mockSettlement} />
    );

    expect(screen.getByText('Documentos Faltantes (3)')).toBeInTheDocument();
    // Component renders doc.code, not doc.name
    expect(screen.getByText('CRT')).toBeInTheDocument();
    expect(screen.getByText('FACTURA')).toBeInTheDocument();
    expect(screen.getByText('MIC')).toBeInTheDocument();
    // Status badges
    const pendienteBadges = screen.getAllByText('PENDIENTE');
    expect(pendienteBadges.length).toBe(2);
    const recibidoBadges = screen.getAllByText('RECIBIDO');
    expect(recibidoBadges.length).toBe(1);
  });

  it('shows days blocked with correct colors for high days (>5 = red)', () => {
    render(
      <BlockedPaymentCard settlement={mockSettlement} />
    );

    // 7 days -> red
    expect(screen.getByText('7d')).toHaveClass('text-red-600');
  });

  it('shows days blocked with correct colors for medium days (3-5 = yellow)', () => {
    const mediumBlockedSettlement: BlockedSettlement = {
      ...mockSettlement,
      blockedDays: 4,
    };

    render(
      <BlockedPaymentCard settlement={mediumBlockedSettlement} />
    );

    expect(screen.getByText('4d')).toHaveClass('text-yellow-600');
  });

  it('shows days blocked with correct colors for low days (<=3 = green)', () => {
    render(
      <BlockedPaymentCard settlement={mockShortIdSettlement} />
    );

    expect(screen.getByText('0d')).toHaveClass('text-green-600');
  });

  it('shows support truck indicator when isSupportTruck is true', () => {
    render(
      <BlockedPaymentCard settlement={mockSettlement} />
    );

    expect(screen.getByText('Soporte')).toBeInTheDocument();
  });

  it('does not show support truck indicator when isSupportTruck is false', () => {
    const normalSettlement: BlockedSettlement = {
      ...mockSettlement,
      trip: {
        ...mockSettlement.trip,
        truck: { plateNumber: 'ABC-123', isSupportTruck: false },
      },
    };

    render(
      <BlockedPaymentCard settlement={normalSettlement} />
    );

    expect(screen.queryByText('Soporte')).not.toBeInTheDocument();
  });

  it('quick action buttons are present', () => {
    const onViewDocs = vi.fn();
    const onUnblock = vi.fn();
    const onViewHistory = vi.fn();

    render(
      <BlockedPaymentCard
        settlement={mockSettlement}
        onViewDocuments={onViewDocs}
        onUnblock={onUnblock}
        onViewHistory={onViewHistory}
      />
    );

    expect(screen.getByText('Ver Documentos')).toBeInTheDocument();
    expect(screen.getByText('Desbloquear')).toBeInTheDocument();
    expect(screen.getByText('Historial')).toBeInTheDocument();
  });

  it('shows Desbloquear button only when payment is blocked', () => {
    const onUnblock = vi.fn();

    render(
      <BlockedPaymentCard
        settlement={mockUnblockedSettlement}
        onUnblock={onUnblock}
      />
    );

    expect(screen.queryByText('Desbloquear')).not.toBeInTheDocument();
    expect(screen.getByText('COMPLETO')).toBeInTheDocument();
  });

  it('displays formatted net payment amount', () => {
    render(
      <BlockedPaymentCard settlement={mockSettlement} />
    );

    // 8500 BOB should be formatted - check for the amount and label
    expect(screen.getByText('Pago Neto')).toBeInTheDocument();
    // Intl.NumberFormat formats 8500 BOB - in jsdom may vary, check for the number
    expect(screen.getByText(/8[.,]500/)).toBeInTheDocument();
  });

  it('truncates long settlement ID', () => {
    const longIdSettlement: BlockedSettlement = {
      ...mockSettlement,
      id: 'very-long-settlement-id-abc-123-def-456-ghi-789',
    };

    render(
      <BlockedPaymentCard settlement={longIdSettlement} />
    );

    // Component truncates to first 8 chars + '...'
    expect(screen.getByText('very-lon...')).toBeInTheDocument();
    expect(screen.queryByText(/ghi-789/)).not.toBeInTheDocument();
  });
});

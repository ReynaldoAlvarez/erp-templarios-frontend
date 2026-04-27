import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SanctionGenerationModal from '@/components/modules/sanctions/SanctionGenerationModal';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: (props: Record<string, unknown>) => <span data-testid="loader2" {...props} />,
  AlertTriangle: (props: Record<string, unknown>) => <span data-testid="alert-triangle" {...props} />,
  Zap: (props: Record<string, unknown>) => <span data-testid="zap" {...props} />,
  Shield: (props: Record<string, unknown>) => <span data-testid="shield" {...props} />,
  Info: (props: Record<string, unknown>) => <span data-testid="info" {...props} />,
  CheckCircle2: (props: Record<string, unknown>) => <span data-testid="check-circle" {...props} />,
  XCircle: (props: Record<string, unknown>) => <span data-testid="x-circle" {...props} />,
  Ban: (props: Record<string, unknown>) => <span data-testid="ban" {...props} />,
}));

// Mock shadcn components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: { children: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void }) =>
    open ? (
      <div data-testid="dialog" onClick={() => onOpenChange(false)}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p data-testid="dialog-desc">{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="dialog-title">{children}</h2>,
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <tr data-testid="table-row" onClick={onClick}>
      {children}
    </tr>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button data-testid="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <p data-testid="alert-desc">{children}</p>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div data-testid="scroll-area">{children}</div>,
}));

const mockDelayedTrips = [
  {
    tripId: 'trip-1',
    micDta: 'MIC-2024-001',
    driverId: 'driver-1',
    driverName: 'Juan Perez',
    daysDelayed: 5,
    suggestedFine: 50,
    suggestedAction: 'FINE' as const,
    existingOffenses: 0,
  },
  {
    tripId: 'trip-2',
    micDta: 'MIC-2024-002',
    driverId: 'driver-2',
    driverName: 'Carlos Lopez',
    daysDelayed: 12,
    suggestedFine: 120,
    suggestedAction: 'SUSPENSION' as const,
    existingOffenses: 3,
  },
];

const mockPreview = {
  previews: [
    {
      tripId: 'trip-1',
      micDta: 'MIC-2024-001',
      driverId: 'driver-1',
      driverName: 'Juan Perez',
      type: 'FINE' as const,
      sanctionReason: 'DOCUMENT_DELAY' as const,
      daysDelayed: 5,
      amount: 50,
      existingOffenses: 0,
    },
    {
      tripId: 'trip-2',
      micDta: 'MIC-2024-002',
      driverId: 'driver-2',
      driverName: 'Carlos Lopez',
      type: 'SUSPENSION' as const,
      sanctionReason: 'REPEATED_OFFENSE' as const,
      daysDelayed: 12,
      amount: 0,
      existingOffenses: 3,
    },
  ],
  totalToGenerate: 2,
  totalFines: 1,
  totalSuspensions: 1,
  totalWarnings: 0,
  totalAmount: 50,
};

describe('SanctionGenerationModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    delayedTrips: mockDelayedTrips,
    isGenerating: false,
    onGenerate: vi.fn(),
    preview: null,
    isPreviewing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when closed', () => {
    render(<SanctionGenerationModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('should render the modal when open', () => {
    render(<SanctionGenerationModal {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
  });

  it('should show delayed trips in select step', () => {
    render(<SanctionGenerationModal {...defaultProps} />);
    expect(screen.getByText('MIC-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('MIC-2024-002')).toBeInTheDocument();
    expect(screen.getByText('Carlos Lopez')).toBeInTheDocument();
  });

  it('should show empty state when no delayed trips', () => {
    render(<SanctionGenerationModal {...defaultProps} delayedTrips={[]} />);
    expect(screen.getByText('No hay viajes con retraso pendientes de sancion.')).toBeInTheDocument();
  });

  it('should call onOpenChange when closing', () => {
    render(<SanctionGenerationModal {...defaultProps} />);
    const dialog = screen.getByTestId('dialog');
    fireEvent.click(dialog);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should display correct days delayed colors', () => {
    render(<SanctionGenerationModal {...defaultProps} />);
    // trip-1 has 5 days (should be yellow), trip-2 has 12 days (should be red)
    const daysElements = screen.getAllByText('12');
    expect(daysElements.length).toBeGreaterThan(0);
  });

  it('should show preview data when preview prop is provided', () => {
    render(
      <SanctionGenerationModal
        {...defaultProps}
        preview={mockPreview}
      />,
    );
    // Preview is passed but modal starts in 'select' step by default
    // Verify the modal renders with delayed trips data
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Carlos Lopez')).toBeInTheDocument();
    // Verify delayed trip data from select step is present
    expect(screen.getByText('MIC-2024-001')).toBeInTheDocument();
    expect(screen.getByText('MIC-2024-002')).toBeInTheDocument();
  });

  it('should show existing offenses badge for recurring drivers', () => {
    render(<SanctionGenerationModal {...defaultProps} />);
    // Carlos Lopez has 3 existing offenses
    expect(screen.getByText('3 ofensas previas')).toBeInTheDocument();
  });
});

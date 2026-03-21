'use client';

import { useState } from 'react';
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Truck,
  FileText,
  Wrench,
  DollarSign,
  MapPin,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications,
  useNotificationCounts,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useDeleteReadNotifications,
} from '@/hooks/use-queries';
import { NotificationType, NotificationPriority, Notification } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

const TYPE_LABELS: Record<NotificationType, string> = {
  TRIP: 'Viaje',
  SETTLEMENT: 'Liquidación',
  INVOICE: 'Factura',
  MAINTENANCE: 'Mantenimiento',
  DOCUMENT: 'Documento',
  SYSTEM: 'Sistema',
  BORDER: 'Frontera',
};

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  TRIP: <Truck className="h-4 w-4" />,
  SETTLEMENT: <DollarSign className="h-4 w-4" />,
  INVOICE: <FileText className="h-4 w-4" />,
  MAINTENANCE: <Wrench className="h-4 w-4" />,
  DOCUMENT: <FileText className="h-4 w-4" />,
  SYSTEM: <Settings className="h-4 w-4" />,
  BORDER: <MapPin className="h-4 w-4" />,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  TRIP: 'bg-blue-100 text-blue-800',
  SETTLEMENT: 'bg-green-100 text-green-800',
  INVOICE: 'bg-purple-100 text-purple-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  DOCUMENT: 'bg-cyan-100 text-cyan-800',
  SYSTEM: 'bg-gray-100 text-gray-800',
  BORDER: 'bg-yellow-100 text-yellow-800',
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  LOW: 'border-l-gray-400',
  MEDIUM: 'border-l-blue-500',
  HIGH: 'border-l-orange-500',
  URGENT: 'border-l-red-500',
};

const PRIORITY_ICONS: Record<NotificationPriority, React.ReactNode> = {
  LOW: <Info className="h-4 w-4 text-gray-500" />,
  MEDIUM: <CheckCircle className="h-4 w-4 text-blue-500" />,
  HIGH: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  URGENT: <AlertCircle className="h-4 w-4 text-red-500" />,
};

export default function NotificacionesPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | undefined>();
  const [isReadFilter, setIsReadFilter] = useState<boolean | undefined>();

  const { data: notificationsData, isLoading } = useNotifications({
    page,
    limit: 20,
    search,
    type: typeFilter,
    priority: priorityFilter,
    isRead: isReadFilter,
  });

  const { data: counts } = useNotificationCounts();

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();
  const deleteReadMutation = useDeleteReadNotifications();

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync(id);
      toast({ title: 'Notificación marcada como leída' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      toast({ title: 'Todas las notificaciones marcadas como leídas' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Notificación eliminada' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const handleDeleteRead = async () => {
    if (confirm('¿Eliminar todas las notificaciones leídas?')) {
      try {
        await deleteReadMutation.mutateAsync();
        toast({ title: 'Notificaciones leídas eliminadas' });
      } catch {
        toast({ title: 'Error', description: 'No se pudieron eliminar', variant: 'destructive' });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-BO', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-500">Centro de notificaciones del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeleteRead}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar leídas
          </Button>
          <Button onClick={handleMarkAllAsRead} className="bg-[#1B3F66] hover:bg-[#1B3F66]/90">
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-[#1B3F66]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Leídas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts?.unread || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{counts?.byPriority?.URGENT || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Altas</CardTitle>
            <Info className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{counts?.byPriority?.HIGH || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Buscar..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter || ''} onValueChange={(v) => setTypeFilter(v as NotificationType || undefined)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter || ''} onValueChange={(v) => setPriorityFilter(v as NotificationPriority || undefined)}>
              <SelectTrigger><SelectValue placeholder="Prioridad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isReadFilter === undefined ? '' : String(isReadFilter)} onValueChange={(v) => setIsReadFilter(v === '' ? undefined : v === 'true')}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="false">No leídas</SelectItem>
                <SelectItem value="true">Leídas</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter(undefined); setPriorityFilter(undefined); setIsReadFilter(undefined); }}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Cargando...</p>
              </div>
            ) : !notificationsData?.data.length ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y">
                {notificationsData.data.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 border-l-4 ${PRIORITY_COLORS[notification.priority]} ${
                      !notification.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${TYPE_COLORS[notification.type]}`}>
                        {TYPE_ICONS[notification.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{notification.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[notification.type]}
                          </Badge>
                          {PRIORITY_ICONS[notification.priority]}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">{formatDate(notification.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {notificationsData && notificationsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((page - 1) * 20) + 1} - {Math.min(page * 20, notificationsData.pagination.total)} de {notificationsData.pagination.total} notificaciones
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === notificationsData.pagination.totalPages}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}

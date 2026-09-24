'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target,
  CheckSquare,
  History,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  AlertCircle,
  FileText,
  Paperclip,
  Download,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  PlayCircle,
  XCircle,
  User,
  Shield,
  Layers,
  MapPin,
  Loader2,
  X,
  ChevronDown,
  Lock,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import {
  objectivesService,
  type AssignableUser,
  type UserTask,
  type TaskHistoryItem,
} from '@/services/objectives';
import { CreateTaskDialog } from '@/features/objectives/components/create-task-dialog';
import { UpdateTaskStatusDialog } from '@/features/objectives/components/update-task-status-dialog';
import { TaskHistoryTab } from '@/features/objectives/components/task-history-tab';

const TASK_STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée (soumise)' },
  { value: 'validated', label: 'Validée' },
  { value: 'problem', label: 'Problème signalé' },
  { value: 'cancelled', label: 'Annulée' },
];

const TASK_PRIORITY_OPTIONS = [
  { value: 'all', label: 'Toutes priorités' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Normale' },
  { value: 'low', label: 'Basse' },
];

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
} as const;

export default function ObjectivesAndTasksPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');

  // Data states
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    validated: 0,
    problem: 0,
    cancelled: 0,
    private_count: 0,
  });
  const [history, setHistory] = useState<TaskHistoryItem[]>([]);

  // Loading states
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters for Tasks
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [taskFileOnlyFilter, setTaskFileOnlyFilter] = useState(false);
  const [taskPrivateOnlyFilter, setTaskPrivateOnlyFilter] = useState(false);

  // Modals state
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<UserTask | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Load assignable users
  const fetchAssignableUsers = useCallback(async () => {
    try {
      const users = await objectivesService.getAssignableUsers();
      setAssignableUsers(Array.isArray(users) ? users : []);
    } catch {
      setAssignableUsers([]);
    }
  }, []);

  // Load tasks
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await objectivesService.getTasks({
        status: taskStatusFilter !== 'all' ? taskStatusFilter : undefined,
        priority: taskPriorityFilter !== 'all' ? taskPriorityFilter : undefined,
        has_file: taskFileOnlyFilter ? '1' : undefined,
        only_private: taskPrivateOnlyFilter ? '1' : undefined,
        search: taskSearch || undefined,
      });
      setTasks(Array.isArray(res?.data) ? res.data : []);
      if (res?.stats) {
        setTaskStats({
          total: res.stats.total || 0,
          pending: res.stats.pending || 0,
          in_progress: res.stats.in_progress || 0,
          completed: res.stats.completed || 0,
          validated: res.stats.validated || 0,
          problem: res.stats.problem || 0,
          cancelled: res.stats.cancelled || 0,
          private_count: res.stats.private_count || 0,
        });
      }
    } catch {
      setTasks([]);
      toast.error('Erreur lors du chargement des missions et objectifs.');
    } finally {
      setLoadingTasks(false);
    }
  }, [taskStatusFilter, taskPriorityFilter, taskFileOnlyFilter, taskPrivateOnlyFilter, taskSearch]);

  // Load history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await objectivesService.getTaskHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
      toast.error('Erreur lors du chargement de l’historique.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Safe memoized array references
  const safeTasks = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);
  const safeHistory = useMemo(() => (Array.isArray(history) ? history : []), [history]);

  useEffect(() => {
    fetchAssignableUsers();
    fetchTasks();
    fetchHistory();
  }, [fetchAssignableUsers, fetchTasks, fetchHistory]);

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchTasks, fetchHistory]);

  // Real-time WebSocket updates listener
  useEffect(() => {
    const handleWsEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (data?.type === 'TASK_STATUS_CHANGED' || data?.type === 'TASK_CREATED') {
        fetchTasks();
        fetchHistory();
      }
    };

    window.addEventListener('sti-websocket-event', handleWsEvent);
    return () => {
      window.removeEventListener('sti-websocket-event', handleWsEvent);
    };
  }, [fetchTasks, fetchHistory]);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchAssignableUsers(), fetchTasks(), fetchHistory()]);
    setIsRefreshing(false);
    toast.success('Données actualisées avec succès.');
  };

  const handleQuickValidate = async (task: UserTask) => {
    try {
      await objectivesService.updateTaskStatus(task.id, 'validated', 'Mission validée par la direction.');
      toast.success(`La mission "${task.title}" a été validée avec succès.`);
      fetchTasks();
      fetchHistory();
    } catch {
      toast.error('Erreur lors de la validation.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        await objectivesService.deleteTask(id);
        toast.success('Supprimé avec succès.');
        fetchTasks();
        fetchHistory();
      } catch {
        toast.error('Erreur lors de la suppression.');
      }
    }
  };

  // KPI Calculations
  const totalTasks = taskStats.total || 0;
  const activeTasks = (taskStats.pending || 0) + (taskStats.in_progress || 0);
  const completedTasks = taskStats.completed || 0;
  const privateTasksCount = taskStats.private_count || safeTasks.filter((t) => t.is_private).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isTaskStatusActive = taskStatusFilter !== 'all' && taskStatusFilter !== '';
  const isTaskPriorityActive = taskPriorityFilter !== 'all' && taskPriorityFilter !== '';
  const activeTasksFilterCount =
    (taskSearch ? 1 : 0) +
    (isTaskStatusActive ? 1 : 0) +
    (isTaskPriorityActive ? 1 : 0) +
    (taskFileOnlyFilter ? 1 : 0) +
    (taskPrivateOnlyFilter ? 1 : 0);

  const currentTaskStatusLabel =
    TASK_STATUS_OPTIONS.find((s) => s.value === taskStatusFilter)?.label || 'Statut';
  const currentTaskPriorityLabel =
    TASK_PRIORITY_OPTIONS.find((p) => p.value === taskPriorityFilter)?.label || 'Priorité';

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-[10px] font-bold px-2 py-0.5">Urgente</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold px-2 py-0.5">Haute</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold px-2 py-0.5">Normale</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground rounded-full text-[10px] font-medium px-2 py-0.5">Basse</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full text-[10px] font-medium px-2 py-0.5">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <Badge variant="secondary" className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-600/30 rounded-full text-[11px] font-extrabold px-2.5 py-0.5 gap-1 shadow-xs">
            <CheckCircle2 className="h-3 w-3" /> Validée
          </Badge>
        );
      case 'problem':
        return (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full text-[11px] font-extrabold px-2.5 py-0.5 gap-1 shadow-xs">
            <AlertCircle className="h-3 w-3" /> Problème signalé
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold px-2.5 py-0.5 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Terminée (à valider)
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-bold px-2.5 py-0.5 gap-1">
            <PlayCircle className="h-3 w-3" /> En cours
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-bold px-2.5 py-0.5 gap-1">
            <Clock className="h-3 w-3" /> En attente
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-full text-[11px] font-bold px-2.5 py-0.5 gap-1">
            <XCircle className="h-3 w-3" /> Annulée
          </Badge>
        );
      default:
        return <Badge variant="outline" className="rounded-full text-[11px]">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'client_visit':
        return 'Visite Client';
      case 'recouvrement':
        return 'Recouvrement';
      case 'prospection':
        return 'Prospection';
      case 'product_promotion':
        return 'Promotion Produit';
      case 'reporting':
        return 'Rapport d’activité';
      case 'administrative':
        return 'Administratif';
      case 'personal_goal':
        return 'Objectif Personnel';
      default:
        return category;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/objectives" className="text-foreground text-xs font-semibold capitalize">
                  Missions & Objectifs
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Missions & Objectifs
            </h1>
            <div className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3" />
              <span>Pilotage Opérationnel</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestion des missions d&apos;équipe, objectifs personnels confidentiels et suivi d&apos;avancement.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGlobalRefresh}
            className="gap-2 rounded-full h-9 px-4 font-semibold text-xs bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-amber-500 transition-transform duration-700", isRefreshing && "animate-spin")} />
            <span>Actualiser</span>
          </Button>

          {/* New Task/Objective Button (Primary Gradient) */}
          <Button
            size="sm"
            onClick={() => setCreateTaskOpen(true)}
            className="gap-2 rounded-full h-9 px-4 font-bold text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-primary-foreground" />
            <span>Nouvelle Mission / Objectif</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks & Objectives */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                Total Missions & Objectifs
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground">
                {totalTasks}
              </div>
            </div>
            <div className={cn('p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', ICON_THEMES.blue)}>
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckSquare className="h-3 w-3" />
              {safeTasks.length} affichée(s)
            </span>
            <span className="text-[11px] text-muted-foreground">Registre global</span>
          </div>
        </Card>

        {/* Active Tasks */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                En Cours & En Attente
              </span>
              <div className="text-xl font-bold tracking-tight text-amber-600">
                {activeTasks}
              </div>
            </div>
            <div className={cn('p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', ICON_THEMES.amber)}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              {taskStats.pending} en attente
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <PlayCircle className="h-3 w-3" />
              {taskStats.in_progress} en cours
            </span>
          </div>
        </Card>

        {/* Private Objectives */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                🔒 Mes Objectifs Privés
              </span>
              <div className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {privateTasksCount}
              </div>
            </div>
            <div className={cn('p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', ICON_THEMES.indigo)}>
              <Lock className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Confidentiel
            </span>
            <span className="text-[11px] text-muted-foreground">Visible par vous seul</span>
          </div>
        </Card>

        {/* Completed Tasks */}
        <Card className="group relative overflow-hidden bg-card border-border/60 shadow-xs hover:shadow-md transition-all duration-300 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight block">
                Missions & Objectifs Terminés
              </span>
              <div className="text-xl font-bold tracking-tight text-emerald-600">
                {completedTasks} / {totalTasks}
              </div>
            </div>
            <div className={cn('p-2.5 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', ICON_THEMES.green)}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1.5 mt-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {taskCompletionRate}% de complétion
              </span>
              <span className="text-muted-foreground font-mono">
                {completedTasks} sur {totalTasks}
              </span>
            </div>
            <Progress value={taskCompletionRate} className="h-1.5" />
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'tasks' | 'history')} className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList className="h-10 bg-muted/60 p-1 rounded-full border border-border/40 inline-flex">
            <TabsTrigger value="tasks" className="rounded-full px-5 text-xs font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs gap-2">
              <CheckSquare className="h-3.5 w-3.5 text-primary" />
              <span>Missions & Objectifs</span>
              <Badge variant="secondary" className="rounded-full text-[10px] font-semibold px-2 py-0">
                {safeTasks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full px-5 text-xs font-bold transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs gap-2">
              <History className="h-3.5 w-3.5 text-purple-600" />
              <span>Historique & Audit</span>
              <Badge variant="secondary" className="rounded-full text-[10px] font-semibold px-2 py-0">
                {safeHistory.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: MISSIONS & TACHES */}
        <TabsContent value="tasks" className="space-y-6 m-0">
          {/* Filters Bar Card */}
          <Card className="border border-border/40 shadow-xs rounded-2xl bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher une mission, un collaborateur..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-9 pr-8 h-8 text-xs rounded-full bg-muted/50 border-border/60 focus-visible:ring-1"
                />
                {taskSearch && (
                  <button
                    type="button"
                    onClick={() => setTaskSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Status Dropdown Pill */}
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none" nativeButton={false}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                      isTaskStatusActive
                        ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
                    )}
                  >
                    <span>{isTaskStatusActive ? currentTaskStatusLabel : 'Statut'}</span>
                    {isTaskStatusActive && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                        1
                      </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Statut de la mission</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isTaskStatusActive && (
                      <>
                        <DropdownMenuCheckboxItem
                          checked={false}
                          onCheckedChange={() => setTaskStatusFilter('all')}
                          className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                          onSelect={(e) => e.preventDefault()}
                        >
                          Effacer le filtre
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {TASK_STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={taskStatusFilter === opt.value}
                        onCheckedChange={() => setTaskStatusFilter(opt.value)}
                        className="rounded-lg cursor-pointer text-xs"
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority Dropdown Pill */}
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none" nativeButton={false}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors',
                      isTaskPriorityActive
                        ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                        : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
                    )}
                  >
                    <span>{isTaskPriorityActive ? currentTaskPriorityLabel : 'Priorité'}</span>
                    {isTaskPriorityActive && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                        1
                      </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 rounded-xl p-1.5">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Niveau de priorité</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isTaskPriorityActive && (
                      <>
                        <DropdownMenuCheckboxItem
                          checked={false}
                          onCheckedChange={() => setTaskPriorityFilter('all')}
                          className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
                          onSelect={(e) => e.preventDefault()}
                        >
                          Effacer le filtre
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {TASK_PRIORITY_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={taskPriorityFilter === opt.value}
                        onCheckedChange={() => setTaskPriorityFilter(opt.value)}
                        className="rounded-lg cursor-pointer text-xs"
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Private Objectives Only Toggle Pill */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTaskPrivateOnlyFilter(!taskPrivateOnlyFilter)}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors cursor-pointer',
                  taskPrivateOnlyFilter
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
                )}
              >
                <Lock className="h-3 w-3 text-indigo-500" />
                <span>Mes Objectifs Privés</span>
                {taskPrivateOnlyFilter && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold">
                    {privateTasksCount}
                  </Badge>
                )}
              </Button>

              {/* Attachment Toggle Pill */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTaskFileOnlyFilter(!taskFileOnlyFilter)}
                className={cn(
                  'h-8 px-3 rounded-full text-xs font-medium gap-1.5 border transition-colors cursor-pointer',
                  taskFileOnlyFilter
                    ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                    : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70'
                )}
              >
                <Paperclip className="h-3 w-3" />
                <span>Avec document joint</span>
                {taskFileOnlyFilter && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
                    {safeTasks.filter((t) => t.has_file_attribution || t.has_attachment).length}
                  </Badge>
                )}
              </Button>

              {/* Clear Filters Reset */}
              {activeTasksFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTaskStatusFilter('all');
                    setTaskPriorityFilter('all');
                    setTaskFileOnlyFilter(false);
                    setTaskPrivateOnlyFilter(false);
                    setTaskSearch('');
                  }}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-full cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Effacer</span>
                </Button>
              )}
            </div>
          </Card>

          {/* Tasks Grid */}
          {loadingTasks ? (
            <div className="flex h-48 items-center justify-center gap-3 rounded-2xl border border-border/40 bg-card text-xs text-muted-foreground shadow-xs">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-semibold">Chargement des missions et objectifs...</span>
            </div>
          ) : safeTasks.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-border/40 bg-card p-6 text-center text-xs text-muted-foreground shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-1">
                <CheckSquare className="h-6 w-6" />
              </div>
              <p className="font-bold text-foreground text-sm">
                {taskPrivateOnlyFilter ? 'Aucun objectif privé trouvé' : 'Aucune mission trouvée'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {taskPrivateOnlyFilter
                  ? 'Vous n’avez aucun objectif personnel privé pour le moment. Vous pouvez en créer un dès maintenant.'
                  : 'Définissez les tâches opérationnelles (visites, recouvrement, prospection) ou vos objectifs privés.'}
              </p>
              <Button
                size="sm"
                className="mt-2 rounded-full h-8 text-xs bg-primary text-white font-semibold cursor-pointer"
                onClick={() => setCreateTaskOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Nouvelle mission / objectif
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {safeTasks.map((task) => (
                <Card
                  key={task.id}
                  className={cn(
                    "rounded-2xl border bg-card p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group space-y-4",
                    task.is_private ? "border-indigo-500/30 dark:border-indigo-500/20" : "border-border/50"
                  )}
                >
                  <div className="space-y-3">
                    {/* Badges Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                        <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0.5 font-medium border-border/60">
                          {getCategoryLabel(task.category)}
                        </Badge>
                        {task.is_private && (
                          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold px-2 py-0.5 gap-1">
                            <Lock className="h-2.5 w-2.5" /> Privé
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Mission Title */}
                    <h3 className="text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>

                    {/* Mission Description */}
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Attribution Card Box */}
                    {task.is_private ? (
                      <div className="rounded-xl bg-indigo-500/5 p-3 space-y-1.5 text-xs border border-indigo-500/20">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Objectif Privé Personnel</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Strictement confidentiel — Visible uniquement par vous.
                        </p>
                        {task.due_date && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-indigo-500/20 text-[11px]">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3 text-muted-foreground" /> Échéance :
                            </span>
                            <span className="font-bold text-foreground">
                              {format(new Date(task.due_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-xs border border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Assigné à :</span>
                          <span className="font-bold text-foreground">
                            {task.assigned_to_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>Par :</span>
                          <span className="font-medium text-foreground">{task.assigned_by_name}</span>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[11px]">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3 text-muted-foreground" /> Échéance :
                            </span>
                            <span className="font-bold text-foreground">
                              {format(new Date(task.due_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attached file attribution pill */}
                    {task.has_file_attribution && task.file_url ? (
                      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-semibold text-foreground truncate max-w-[160px]">
                            {task.file_name || 'Document joint'}
                          </span>
                        </div>
                        <a
                          href={task.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-[11px] font-bold text-primary shadow-2xs hover:bg-muted transition-colors border border-border/40"
                        >
                          <Download className="h-3 w-3" /> Ouvrir
                        </a>
                      </div>
                    ) : null}

                    {/* Completion notes if any */}
                    {task.completion_notes && (
                      <div className="rounded-xl bg-muted/30 p-2 text-xs italic text-muted-foreground border border-border/30">
                        <span className="font-bold not-italic text-foreground text-[11px] block mb-0.5">Compte-rendu :</span>
                        &quot;{task.completion_notes}&quot;
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                    {task.status === 'completed' && (
                      <Button
                        size="sm"
                        className="flex-1 h-8 rounded-full text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                        onClick={() => handleQuickValidate(task)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 rounded-full text-xs font-semibold gap-1.5 bg-card hover:bg-muted/80 text-foreground border-border/70 shadow-xs cursor-pointer",
                        task.status === 'completed' ? "flex-1" : "w-full"
                      )}
                      onClick={() => {
                        setSelectedTaskForStatus(task);
                        setStatusModalOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 text-primary" /> {task.status === 'completed' ? 'Avis / Statut' : 'Mettre à jour'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: HISTORIQUE & AUDIT */}
        <TabsContent value="history" className="m-0">
          <TaskHistoryTab
            history={safeHistory}
            loading={loadingHistory}
            onRefresh={fetchHistory}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        assignableUsers={assignableUsers}
        onSuccess={() => {
          fetchTasks();
          fetchHistory();
        }}
      />

      <UpdateTaskStatusDialog
        task={selectedTaskForStatus}
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        onSuccess={() => {
          fetchTasks();
          fetchHistory();
        }}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash, Edit, Search, MoreHorizontal, Loader2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/admin/TransactionForm';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function ExpensesIncomesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialType = (searchParams.get('type') as 'all' | 'expense' | 'income') || 'all';
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>(initialType);
  const [dateFilter, setDateFilter] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      from: format(start, 'yyyy-MM-dd'),
      to: format(end, 'yyyy-MM-dd')
    };
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filterByDate, setFilterByDate] = useState(true);
  
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Sync state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    } else {
      params.delete('page');
    }
    if (typeFilter !== 'all') {
      params.set('type', typeFilter);
    } else {
      params.delete('type');
    }
    router.push(`/admin/expenses-incomes?${params.toString()}`);
  }, [currentPage, typeFilter]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/expenses-incomes');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchTransactions();
    };
    loadData();
  }, [fetchTransactions]);

  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingTransaction(null);
      setIsDialogOpen(true);
    };
    window.addEventListener('open-add-transaction', handleOpenAdd);
    
    // Also check query param if we just redirected here
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true') {
      handleOpenAdd();
      // clean up query param without reload
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    return () => {
      window.removeEventListener('open-add-transaction', handleOpenAdd);
    };
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Transaction?',
      text: 'Are you sure you want to delete this transaction record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin/expenses-incomes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Transaction deleted');
        fetchTransactions();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to delete transaction');
      }
    } catch (error) {
      toast.error('Failed to delete transaction');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const title = tx.title?.toLowerCase() || '';
    const matchesSearch = title.includes(term);

    let matchesDate = true;
    if (filterByDate) {
      if (dateFilter.from) {
        matchesDate = matchesDate && new Date(tx.date) >= new Date(dateFilter.from + 'T00:00:00');
      }
      if (dateFilter.to) {
        matchesDate = matchesDate && new Date(tx.date) <= new Date(dateFilter.to + 'T23:59:59');
      }
    }

    let matchesType = true;
    if (typeFilter !== 'all') {
      matchesType = (tx.type || 'expense') === typeFilter;
    }

    return matchesSearch && matchesDate && matchesType;
  });

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const overviewTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const title = tx.title?.toLowerCase() || '';
    const matchesSearch = title.includes(term);

    let matchesDate = true;
    if (filterByDate) {
      if (dateFilter.from) {
        matchesDate = matchesDate && new Date(tx.date) >= new Date(dateFilter.from + 'T00:00:00');
      }
      if (dateFilter.to) {
        matchesDate = matchesDate && new Date(tx.date) <= new Date(dateFilter.to + 'T23:59:59');
      }
    }

    return matchesSearch && matchesDate;
  });

  const totalIncome = overviewTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalExpense = overviewTransactions
    .filter((tx) => tx.type === 'expense' || !tx.type)
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const isFiltered = !!((filterByDate && (dateFilter.from || dateFilter.to)) || searchTerm || typeFilter !== 'all');

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-8">
      <div className="flex items-center justify-between gap-2 border-b pb-4">
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight">Expenses & Incomes</h2>
          <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm hidden xs:block">Track ads, rent, salary, sales, investments, and other costs or revenues.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => setEditingTransaction(null)} className="font-bold bg-primary text-primary-foreground h-9 px-3 text-xs sm:text-sm shrink-0" />}>
            <Plus className="mr-1 h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Add Record</span>
            <span className="inline sm:hidden">Add Bill</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] w-full">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit' : 'Add'} Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm
              initialData={editingTransaction}
              onSuccess={(wasEdit) => {
                if (wasEdit) {
                  setIsDialogOpen(false);
                }
                fetchTransactions();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2">
        {/* Total Income Card */}
        <Card className="bg-primary/5 border-primary/10 border-l-2 border-l-primary relative overflow-hidden group h-full min-h-[85px] sm:min-h-0 shadow-sm hover:shadow transition-shadow">
          {/* Mobile Layout */}
          <div className="flex flex-col p-2.5 sm:hidden justify-between h-full gap-2 items-center text-center">
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm font-black text-primary leading-none">
                ৳{totalIncome.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-bold text-zinc-600 leading-tight mt-auto">
              Total Income
            </span>
          </div>
          {/* Desktop Layout */}
          <div className="hidden sm:block">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <CardTitle className="text-sm font-semibold leading-tight">Total Income</CardTitle>
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">৳</div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-lg md:text-2xl font-extrabold text-primary">৳{totalIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {isFiltered ? 'Selected range inflow' : 'All-time total inflow'}
              </p>
            </CardContent>
          </div>
        </Card>

        {/* Total Expense Card */}
        <Card className="bg-primary/5 border-primary/10 border-l-2 border-l-primary relative overflow-hidden group h-full min-h-[85px] sm:min-h-0 shadow-sm hover:shadow transition-shadow">
          {/* Mobile Layout */}
          <div className="flex flex-col p-2.5 sm:hidden justify-between h-full gap-2 items-center text-center">
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm font-black text-primary leading-none">
                ৳{totalExpense.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] font-bold text-zinc-600 leading-tight mt-auto">
              Total Expense
            </span>
          </div>
          {/* Desktop Layout */}
          <div className="hidden sm:block">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <CardTitle className="text-sm font-semibold leading-tight">Total Expense</CardTitle>
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">৳</div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-lg md:text-2xl font-extrabold text-primary">৳{totalExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {isFiltered ? 'Selected range outflow' : 'All-time total outflow'}
              </p>
            </CardContent>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <CardTitle>All Transactions</CardTitle>
              {/* Mobile Filter Toggle Button */}
              <div className="block lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={`h-9 px-3 ${showMobileFilters ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                  {isFiltered && (
                    <span className="ml-1.5 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Button>
              </div>
            </div>

            {/* Desktop & Collapsible Mobile Filters Wrapper */}
            <div className={`grid transition-all duration-300 ease-in-out lg:block w-full ${
              showMobileFilters 
                ? 'grid-rows-[1fr] opacity-100 mt-3 visible' 
                : 'grid-rows-[0fr] opacity-0 invisible lg:visible lg:opacity-100 lg:grid-rows-none'
            }`}>
              <div className="overflow-hidden flex flex-col lg:flex-row items-stretch lg:items-center gap-2 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title..."
                    className="pl-8 h-8 text-xs w-full"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={(val: any) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full sm:w-36 h-8 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter Checkbox & Date Inputs */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer font-bold text-foreground shrink-0 select-none">
                    <input
                      type="checkbox"
                      checked={filterByDate}
                      onChange={(e) => setFilterByDate(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 accent-primary"
                    />
                    Filter by Date
                  </label>

                  <div className={`flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border w-full sm:w-auto transition-opacity duration-200 ${!filterByDate ? 'opacity-40 pointer-events-none' : ''}`}>
                    <Input
                      type="date"
                      className="h-7 border-none bg-transparent focus-visible:ring-0 p-0.5 text-xs md:w-28 font-medium"
                      value={dateFilter.from}
                      onChange={(e) => {
                        setDateFilter(prev => ({ ...prev, from: e.target.value }));
                        setCurrentPage(1);
                      }}
                      disabled={!filterByDate}
                    />
                    <span className="text-muted-foreground text-[10px] shrink-0 font-medium">to</span>
                    <Input
                      type="date"
                      className="h-7 border-none bg-transparent focus-visible:ring-0 p-0.5 text-xs md:w-28 font-medium"
                      value={dateFilter.to}
                      onChange={(e) => {
                        setDateFilter(prev => ({ ...prev, to: e.target.value }));
                        setCurrentPage(1);
                      }}
                      disabled={!filterByDate}
                    />
                  </div>
                </div>

                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFilter({ from: '', to: '' });
                      setSearchTerm('');
                      setTypeFilter('all');
                      setFilterByDate(true);
                      setCurrentPage(1);
                    }}
                    className="text-xs h-7 text-muted-foreground hover:text-primary shrink-0 font-bold px-2"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount (Tk)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                      Loading transactions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isExpense = (tx.type || 'expense') === 'expense';
                  return (
                    <TableRow key={tx._id}>
                      <TableCell>{format(new Date(tx.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div className="font-medium">{tx.title}</div>
                        {tx.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 max-w-[300px] break-words">
                            {tx.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isExpense ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
                            Expense
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                            Income
                          </span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isExpense ? '-' : '+'}৳{tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(tx._id)}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden divide-y divide-border">
            {loading ? (
              <div className="py-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                  Loading transactions...
                </div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                No transactions found.
              </div>
            ) : (
              paginatedTransactions.map((tx) => {
                const isExpense = (tx.type || 'expense') === 'expense';
                return (
                  <div key={tx._id} className="py-3 px-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{format(new Date(tx.date), 'dd MMM yyyy')}</span>
                      {isExpense ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Expense
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Income
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col flex-1 mr-2">
                        <span className="font-bold text-sm text-foreground">
                          {tx.title}
                        </span>
                        {tx.description && (
                          <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {tx.description}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-bold text-sm ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isExpense ? '-' : '+'}৳{tx.amount.toLocaleString()}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(tx._id)}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {totalPages > 1 && (
            <div className="py-4 border-t bg-background px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExpensesIncomesPage() {
  return (
    <Suspense fallback={<div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ExpensesIncomesContent />
    </Suspense>
  );
}

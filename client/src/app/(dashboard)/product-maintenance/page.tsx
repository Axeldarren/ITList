"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Wrench, CheckCircle, XCircle, AlertOctagon, Filter } from "lucide-react";
import { useGetProductMaintenancesQuery, useGetUserByIdQuery } from "@/state/api";
import ProductMaintenanceCard from "@/components/ProductMaintenanceCard";
import ModalNewProductMaintenance from "@/components/ModalNewProductMaintenance";
import Header from "@/components/Header";
import { useAppSelector } from "../../redux";
import { selectCurrentUser } from "@/state/authSlice";

const StatCard = ({
    label, value, icon, accent, sub,
}: {
    label: string; value: number; icon: React.ReactNode; accent: string; sub?: string;
}) => (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 shadow-sm transition-shadow hover:shadow-md group">
        <div className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
        <div className="flex items-center gap-3 pl-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-dark-tertiary group-hover:scale-110 transition-transform duration-200">
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    </div>
);

const ProductMaintenancePage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [isModalNewProductMaintenanceOpen, setIsModalNewProductMaintenanceOpen] = useState(false);

  const loggedInUser = useAppSelector(selectCurrentUser);
  const userId = loggedInUser?.userId ?? "";
  const { data: userData, isLoading: userDataLoading } = useGetUserByIdQuery(userId, { skip: !userId });

  const activeUser = userData || loggedInUser;
  const isBusinessOwner = activeUser?.role === 'BUSINESS_OWNER';
  const isAllowed = activeUser && !isBusinessOwner;

  useEffect(() => {
    if (!userDataLoading && activeUser && isBusinessOwner) {
      router.push('/unauthorized?required=ADMIN');
    }
  }, [activeUser, isBusinessOwner, router, userDataLoading]);

  const { data: productMaintenancesData, isLoading: maintenanceLoading, isError } = useGetProductMaintenancesQuery({
    page,
    limit: 8,
    search: searchTerm,
    status: statusFilter,
    priority: priorityFilter
  }, { skip: !isAllowed });

  const productMaintenances = productMaintenancesData?.data || [];
  const meta = productMaintenancesData?.meta;
  const stats = productMaintenancesData?.stats;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setPage(1); };
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value); setPage(1); };
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setPriorityFilter(e.target.value); setPage(1); };

  if (userDataLoading || maintenanceLoading) return (
    <div className="mx-auto flex w-full flex-col p-6 lg:p-8">
      <div className="animate-pulse h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700 mb-6" />
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center gap-3 pl-2">
              <div className="animate-pulse h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="animate-pulse h-3 w-14 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="animate-pulse h-6 w-8 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white dark:bg-dark-secondary dark:border-gray-800 p-5 space-y-3 shadow-sm">
            <div className="animate-pulse h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="animate-pulse h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="flex gap-2">
              <div className="animate-pulse h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="animate-pulse h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="animate-pulse h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="animate-pulse h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!isAllowed) return null;
  if (isError) return <div className="p-8 text-red-500">Error loading product maintenances</div>;

  const hasActiveFilters = searchTerm || statusFilter !== "All" || priorityFilter !== "All";

  return (
    <div className="mx-auto flex w-full flex-col p-6 lg:p-8">
      <Header
        name="Product Maintenance"
        buttonComponent={
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search maintenances..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full sm:w-56 transition-all"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <select
                value={priorityFilter}
                onChange={handlePriorityChange}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-sm text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
              >
                <option value="All">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {loggedInUser?.role === 'ADMIN' && (
              <button
                className="flex items-center gap-2 rounded-xl bg-blue-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-600 transition-all cursor-pointer flex-shrink-0"
                onClick={() => setIsModalNewProductMaintenanceOpen(true)}
              >
                <Plus size={16} /> New Maintenance
              </button>
            )}
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="mt-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={stats?.totalMaintenances || 0}
          accent="bg-blue-500"
          icon={<Wrench size={18} className="text-blue-500" />}
        />
        <StatCard
          label="Active"
          value={stats?.active || 0}
          accent="bg-emerald-500"
          icon={<CheckCircle size={18} className="text-emerald-500" />}
        />
        <StatCard
          label="Inactive"
          value={stats?.inactive || 0}
          accent="bg-gray-400"
          icon={<XCircle size={18} className="text-gray-400" />}
        />
        <StatCard
          label="High Priority"
          value={stats?.highPriority || 0}
          accent="bg-red-500"
          icon={<AlertOctagon size={18} className="text-red-500" />}
          sub="Critical + High"
        />
      </div>

      {/* Grid */}
      {productMaintenances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-dark-secondary mb-4">
            <Wrench size={28} className="text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No maintenances found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {hasActiveFilters ? "Try adjusting your filters or search term." : "Get started by creating a new product maintenance."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('All'); setPriorityFilter('All'); }}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {productMaintenances.map((maintenance) => (
            <ProductMaintenanceCard key={maintenance.id} productMaintenance={maintenance} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-2">
            Page {page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta?.totalPages || 1, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      <ModalNewProductMaintenance
        isOpen={isModalNewProductMaintenanceOpen}
        onClose={() => setIsModalNewProductMaintenanceOpen(false)}
      />
    </div>
  );
};

export default ProductMaintenancePage;

"use client";

import React, { useState } from "react";
import { Plus, Search, Wrench } from "lucide-react";
import { useGetProductMaintenancesQuery } from "@/state/api";
import ProductMaintenanceCard from "@/components/ProductMaintenanceCard";
import ModalNewProductMaintenance from "@/components/ModalNewProductMaintenance";
import Header from "@/components/Header";
import { useAppSelector } from "../../redux";
import { selectCurrentUser } from "@/state/authSlice";

const ProductMaintenancePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [isModalNewProductMaintenanceOpen, setIsModalNewProductMaintenanceOpen] = useState(false);

  const loggedInUser = useAppSelector(selectCurrentUser);

  const {
    data: productMaintenancesData,
    isLoading,
    isError,
  } = useGetProductMaintenancesQuery({
    page,
    limit: 8,
    search: searchTerm,
    status: statusFilter,
    priority: priorityFilter
  });

  const productMaintenances = productMaintenancesData?.data || [];
  const meta = productMaintenancesData?.meta;
  const stats = productMaintenancesData?.stats;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriorityFilter(e.target.value);
    setPage(1);
  };

  if (isLoading) return <div className="py-4">Loading...</div>;
  if (isError) return <div className="py-4 text-red-500">Error loading product maintenances</div>;

  return (
    <div className="mx-auto flex w-full flex-col p-4 lg:p-8">
      <Header 
        name="Product Maintenance" 
        buttonComponent={
          <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Search Bar */}
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search maintenances..."
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 transition-shadow"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Filters */}
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm transition-shadow"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={priorityFilter}
              onChange={handlePriorityChange}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-tertiary bg-white dark:bg-dark-secondary text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm transition-shadow"
            >
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            {/* Add Button */}
            {loggedInUser?.isAdmin && (
              <button
                className="flex items-center rounded-md bg-blue-primary px-3 py-2 text-white hover:bg-blue-600 shadow-md"
                onClick={() => setIsModalNewProductMaintenanceOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" /> New Maintenance
              </button>
            )}
          </div>
        }
      />

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-dark-secondary">
          <div className="flex items-center">
            <Wrench className="mr-2 h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-semibold text-blue-500">{stats?.totalMaintenances || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-dark-secondary">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-green-500"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Active</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats?.active || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-dark-secondary">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-gray-500"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Inactive</p>
              <p className="text-2xl font-semibold text-gray-600">
                {stats?.inactive || 0}
              </p>
            </div>
          </div>
        </div>


        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-dark-secondary">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">High Priority</p>
              <p className="text-2xl font-semibold text-red-600">
                {stats?.highPriority || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Maintenances Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {productMaintenances.map((maintenance) => (
          <ProductMaintenanceCard
            key={maintenance.id}
            productMaintenance={maintenance}
          />
        ))}
      </div>

      {productMaintenances.length === 0 && (
        <div className="mt-8 text-center">
          <Wrench className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No product maintenances found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== "All" || priorityFilter !== "All"
              ? "Try adjusting your filters"
              : "Get started by creating a new product maintenance."}
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {meta && (
        <div className="flex justify-center items-center mt-8 gap-4">
             <button
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-dark-secondary dark:text-white border border-gray-300 dark:border-dark-tertiary rounded-md hover:bg-gray-50 dark:hover:bg-dark-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
             >
                 Previous
             </button>
             <span className="text-sm text-gray-600 dark:text-gray-400">
                 Page {page} of {meta.totalPages}
             </span>
             <button
                 onClick={() => setPage(p => Math.min(meta?.totalPages || 1, p + 1))}
                 disabled={page === meta.totalPages}
                 className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-dark-secondary dark:text-white border border-gray-300 dark:border-dark-tertiary rounded-md hover:bg-gray-50 dark:hover:bg-dark-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
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

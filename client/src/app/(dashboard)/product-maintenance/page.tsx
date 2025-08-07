"use client";

import React, { useState } from "react";
import { Plus, Search, Wrench } from "lucide-react";
import { useGetProductMaintenancesQuery } from "@/state/api";
import ProductMaintenanceCard from "@/components/ProductMaintenanceCard";
import ModalNewProductMaintenance from "@/components/ModalNewProductMaintenance";
import Header from "@/components/Header";

const ProductMaintenancePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [isModalNewProductMaintenanceOpen, setIsModalNewProductMaintenanceOpen] = useState(false);

  const {
    data: productMaintenances,
    isLoading,
    isError,
  } = useGetProductMaintenancesQuery();

  const filteredProductMaintenances = productMaintenances?.filter((maintenance) => {
    const matchesSearch = 
      maintenance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maintenance.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || maintenance.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || maintenance.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) return <div className="py-4">Loading...</div>;
  if (isError) return <div className="py-4 text-red-500">Error loading product maintenances</div>;

  return (
    <div className="mx-auto flex w-full flex-col p-4 lg:p-8">
      <Header 
        name="Product Maintenance" 
        buttonComponent={
          <button
            className="flex items-center rounded-md bg-blue-primary px-3 py-2 text-white hover:bg-blue-600"
            onClick={() => setIsModalNewProductMaintenanceOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" /> New Maintenance
          </button>
        }
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="flex w-full max-w-md items-center rounded-lg border bg-white px-3 py-2 shadow-sm dark:bg-dark-secondary dark:border-dark-tertiary">
          <Search className="mr-2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search maintenances..."
            className="w-full bg-transparent outline-none dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:bg-dark-secondary dark:border-dark-tertiary dark:text-white"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:bg-dark-secondary dark:border-dark-tertiary dark:text-white"
          >
            <option value="All">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-dark-secondary">
          <div className="flex items-center">
            <Wrench className="mr-2 h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-semibold text-blue-500">{productMaintenances?.length || 0}</p>
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
                {productMaintenances?.filter(m => m.status === "Active").length || 0}
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
                {productMaintenances?.filter(m => m.status === "Inactive").length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-dark-secondary">
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-purple-500"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">This Month</p>
              <p className="text-2xl font-semibold text-purple-600">
                {productMaintenances?.filter(m => {
                  const createdThisMonth = new Date(m.createdAt).getMonth() === new Date().getMonth();
                  return createdThisMonth;
                }).length || 0}
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
                {productMaintenances?.filter(m => m.priority === "High" || m.priority === "Critical").length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Maintenances Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProductMaintenances?.map((maintenance) => (
          <ProductMaintenanceCard
            key={maintenance.id}
            productMaintenance={maintenance}
          />
        ))}
      </div>

      {filteredProductMaintenances?.length === 0 && (
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

      <ModalNewProductMaintenance
        isOpen={isModalNewProductMaintenanceOpen}
        onClose={() => setIsModalNewProductMaintenanceOpen(false)}
      />
    </div>
  );
};

export default ProductMaintenancePage;

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  Plus,
  Settings,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import {
  useGetProductMaintenanceByIdQuery,
  useDeleteProductMaintenanceMutation,
} from "@/state/api";
import ModalEditProductMaintenance from "@/components/ModalEditProductMaintenance";
import ModalNewMaintenanceTask from "@/components/ModalNewMaintenanceTask";
import MaintenanceTaskCard from "@/components/MaintenanceTaskCard";
import ModalConfirm from "@/components/ModalConfirm";
import { format } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

const ProductMaintenanceDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    data: productMaintenance,
    isLoading,
    isError,
  } = useGetProductMaintenanceByIdQuery(id);

  const [deleteProductMaintenance, { isLoading: isDeleting }] = useDeleteProductMaintenanceMutation();

  const handleDelete = async () => {
    try {
      await deleteProductMaintenance(id).unwrap();
      toast.success("Product maintenance deleted successfully!");
      router.push("/product-maintenance");
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                          error.data && typeof error.data === 'object' && 'message' in error.data
                          ? (error.data as { message: string }).message
                          : "Failed to delete product maintenance";
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = () => {
    if (!productMaintenance) return null;
    switch (productMaintenance.status) {
      case "Active":
        return <Clock className="h-5 w-5 text-green-500" />;
      case "Inactive":
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!productMaintenance) return "";
    switch (productMaintenance.status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = () => {
    if (!productMaintenance) return "";
    switch (productMaintenance.priority) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) return <div className="py-4">Loading...</div>;
  if (isError || !productMaintenance) return <div className="py-4 text-red-500">Product maintenance not found</div>;

  const allTasks = productMaintenance.maintenanceTasks || [];

  return (
    <div className="mx-auto flex w-full flex-col p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/product-maintenance">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
              <ArrowLeft className="h-5 w-5" />
              Back to Maintenance
            </button>
          </Link>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-primary px-4 py-2 text-white hover:bg-blue-600"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-dark-secondary">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {productMaintenance.name}
            </h1>
            {productMaintenance.project && (
              <p className="mt-1 text-lg text-gray-600 dark:text-gray-300">
                Related to: {productMaintenance.project.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${getStatusColor()}`}>
              {getStatusIcon()}
              {productMaintenance.status}
            </span>
            {productMaintenance.priority && (
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getPriorityColor()}`}>
                {productMaintenance.priority}
              </span>
            )}
          </div>
        </div>

        {productMaintenance.description && (
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {productMaintenance.description}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Created {format(new Date(productMaintenance.createdAt), "MMM dd, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {productMaintenance.maintainers.length} maintainer{productMaintenance.maintainers.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {productMaintenance.maintenanceTasks.length} task{productMaintenance.maintenanceTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Maintainers */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-dark-secondary">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Maintainers
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {productMaintenance.maintainers.map((maintainer) => (
            <div key={maintainer.id} className="flex items-center gap-3 rounded-lg border p-3 dark:border-gray-600">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                {maintainer.user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {maintainer.user.username}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {maintainer.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Maintenance Tasks
          </h2>
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-primary px-4 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        {/* Task Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Entries</h3>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{allTasks.length}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Latest Entry</h3>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              {allTasks.length > 0 
                ? format(new Date(allTasks[allTasks.length - 1].createdAt), "MMM dd, yyyy")
                : "No entries"}
            </p>
          </div>
        </div>

        {/* Maintenance Log */}
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-dark-secondary">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Maintenance History ({allTasks.length})
          </h3>
          <div className="space-y-3">
            {allTasks.length > 0 ? (
              [...allTasks]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((task) => (
                  <MaintenanceTaskCard key={task.id} task={task} />
                ))
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No maintenance entries yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModalEditProductMaintenance
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        productMaintenance={productMaintenance}
      />

      <ModalNewMaintenanceTask
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        productMaintenanceId={id}
      />

      <ModalConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Product Maintenance"
        message={`Are you sure you want to delete "${productMaintenance.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductMaintenanceDetailPage;

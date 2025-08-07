import React from "react";
import { Calendar, Users, ChevronRight, AlertCircle, Clock } from "lucide-react";
import { ProductMaintenance } from "@/state/api";
import { format } from "date-fns";
import Link from "next/link";

type Props = {
  productMaintenance: ProductMaintenance;
};

const ProductMaintenanceCard = ({ productMaintenance }: Props) => {
  const {
    id,
    name,
    description,
    status,
    priority,
    project,
    createdAt,
    maintainers,
    _count,
    totalTimeLogged,
  } = productMaintenance;

  const formatDuration = (seconds: number = 0) => {
    if (seconds < 60) return `${seconds}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : "", s > 0 ? `${s}s` : ""]
      .filter(Boolean)
      .join(" ");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "Active":
        return <Clock className="h-4 w-4 text-green-500" />;
      case "Inactive":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
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

  return (
    <Link href={`/product-maintenance/${id}`}>
      <div className="cursor-pointer rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-dark-secondary">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {name}
            </h3>
            {project && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Related to: {project.name}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>

        {/* Description */}
        {description && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {description}
          </p>
        )}

        {/* Status and Priority */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            {status}
          </span>
          {priority && (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor()}`}>
              {priority}
            </span>
          )}
        </div>

        {/* Maintainers */}
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <div className="flex -space-x-2">
            {maintainers.slice(0, 3).map((maintainer) => (
              <div
                key={maintainer.id}
                className="h-6 w-6 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-xs font-semibold text-white dark:border-dark-secondary"
                title={maintainer.user.username}
              >
                {maintainer.user.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {maintainers.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-500 text-xs font-semibold text-white dark:border-dark-secondary">
                +{maintainers.length - 3}
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {maintainers.length} maintainer{maintainers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(createdAt), "MMM dd, yyyy")}
            </div>
            {totalTimeLogged && totalTimeLogged > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(totalTimeLogged)}
              </div>
            )}
          </div>
          <span>
            {_count?.maintenanceTasks || 0} task{_count?.maintenanceTasks !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductMaintenanceCard;

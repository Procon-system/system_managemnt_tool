// src/utils/statusColor.js
export function getBgColorForStatus(status = "") {
    switch (status.toLowerCase()) {
      case "done":
        return "bg-blue-100 text-blue-800 ring-blue-200";
      case "in_progress":
        return "bg-green-100 text-green-800 ring-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 ring-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 ring-red-200";
      case "impossible":
        return "bg-gray-100 text-gray-800 ring-gray-200";
      default:
        return "bg-green-100 text-green-800 ring-green-200";
    }
  }
  
  export function getTextColorForStatus(status = "") {
    switch (status.toLowerCase()) {
      case "done":
        return "text-blue-700";
      case "in_progress":
        return "text-green-700";
      case "pending":
        return "text-yellow-700";
      case "overdue":
        return "text-red-700";
      case "impossible":
        return "text-gray-700";
      default:
        return "text-green-700";
    }
  }
  
  export function formatStatusLabel(status = "") {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  }
  
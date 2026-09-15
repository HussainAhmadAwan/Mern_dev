// ==========================================================
// ORDER STATUS COLORS
// ==========================================================

export const getStatusClasses = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-700";

    case "Processing":
      return "bg-gray-200 text-gray-700";

    case "Shipped":
      return "bg-orange-100 text-orange-700";

    case "Delivered":
      return "bg-green-100 text-green-700";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};
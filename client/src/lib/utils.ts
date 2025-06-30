export const dataGridSxStyles = (isDarkMode: boolean) => {
  return {
    // Base styles for the DataGrid container
    backgroundColor: isDarkMode ? '#1d1f21' : 'white', // --color-dark-secondary
    color: isDarkMode ? '#e5e7eb' : 'inherit',
    border: `1px solid ${isDarkMode ? '#2d3135' : '#e5e7eb'}`, // --color-stroke-dark
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    borderRadius: '0.5rem',

    // Styles for internal elements
    "& .MuiDataGrid-columnHeaders": {
      color: isDarkMode ? "#e5e7eb" : "inherit",
      fontWeight: 'bold',
      '& [role="row"] > *': {
        backgroundColor: isDarkMode ? "#1d1f21" : "white",
        borderColor: isDarkMode ? "#2d3135" : "#e5e7eb",
      },
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 600, // Semi-bold for titles
      fontSize: '0.9rem',
    },
    "& .MuiIconButton-root": {
      color: isDarkMode ? "#a3a3a3" : "inherit",
    },
    "& .MuiTablePagination-root, & .MuiSelect-select, & .MuiSvgIcon-root": {
      color: isDarkMode ? "#a3a3a3" : "inherit",
    },
    "& .MuiDataGrid-cell": {
      border: "none",
    },
    "& .MuiDataGrid-row": {
      borderBottom: `1px solid ${isDarkMode ? "#2d3135" : "#e5e7eb"}`,
      // Add a subtle transition for a smoother hover effect
      transition: 'background-color 0.2s ease-in-out',
      '&:last-of-type': {
        borderBottom: 'none', // Remove border from the very last row
      },
    },
    // --- THIS IS THE NEW PART THAT FIXES THE HOVER ---
    '& .MuiDataGrid-row:hover': {
      backgroundColor: isDarkMode 
        ? '#2d3135' // Use your --color-stroke-dark for a subtle hover
        : '#f5f5f5', // A standard light grey for light mode hover
    },
    "& .MuiDataGrid-withBorderColor": {
      borderColor: isDarkMode ? "#2d3135" : "#e5e7eb",
    },
    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
        outline: "none !important",
    },
    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
      outline: "none !important",
    },
  };
};
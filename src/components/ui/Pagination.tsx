// src/components/ui/Pagination.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className = '',
}) => {
  const { darkMode } = useTheme();
  
  // Don't render pagination if there's only one page
  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }

  // Calculate displayed pages for pagination
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const pageNumbers = getPageNumbers();

  // Calculate range info (e.g., "Showing 1-10 of 100")
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : null;
  const showingInfo = totalItems ? `Showing ${startItem}-${endItem} of ${totalItems}` : '';

  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between py-4 ${className}`}>
      {/* Items per page selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center mb-4 md:mb-0">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>
            Items per page:
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={`
              text-sm rounded-md border px-2 py-1
              ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-700'
              }
            `}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Showing X-Y of Z info */}
      {totalItems && (
        <div className={`hidden md:block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {showingInfo}
        </div>
      )}
      
      {/* Pagination controls */}
      <div className="flex items-center justify-center md:justify-end space-x-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={isFirstPage}
          className={`
            p-2 rounded-md
            ${
              isFirstPage
                ? darkMode
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
            }
          `}
          aria-label="First Page"
        >
          <ChevronsLeft size={18} />
        </button>
        
        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={`
            p-2 rounded-md
            ${
              isFirstPage
                ? darkMode
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
            }
          `}
          aria-label="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>
        
        {/* Page numbers */}
        {pageNumbers.map((pageNumber, index) => {
          const isEllipsis = pageNumber === '...';
          const isCurrentPage = pageNumber === currentPage;
          
          if (isEllipsis) {
            return (
              <span
                key={`ellipsis-${index}`}
                className={`px-3 py-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                ...
              </span>
            );
          }
          
          return (
            <button
              key={`page-${pageNumber}`}
              onClick={() => onPageChange(Number(pageNumber))}
              className={`
                px-3 py-1 rounded-md text-sm font-medium
                ${
                  isCurrentPage
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }
              `}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          );
        })}
        
        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={`
            p-2 rounded-md
            ${
              isLastPage
                ? darkMode
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
            }
          `}
          aria-label="Next Page"
        >
          <ChevronRight size={18} />
        </button>
        
        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={isLastPage}
          className={`
            p-2 rounded-md
            ${
              isLastPage
                ? darkMode
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
                : darkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
            }
          `}
          aria-label="Last Page"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
      
      {/* Mobile showing info */}
      {totalItems && (
        <div className={`mt-2 md:hidden text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {showingInfo}
        </div>
      )}
    </div>
  );
};

export default Pagination;
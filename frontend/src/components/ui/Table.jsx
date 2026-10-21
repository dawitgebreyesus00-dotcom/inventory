import React from 'react';

const Table = ({ children, className = '' }) => (
  <div className="overflow-hidden bg-white rounded-lg shadow-md animate-fadeIn">
    <div className="overflow-x-auto">
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  </div>
);

const TableHeader = ({ children, className = '' }) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = '', hover = true, ...props }) => (
  <tr 
    className={`
      ${hover ? 'hover:bg-gray-50 transition-colors duration-150' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </tr>
);

const TableHead = ({ children, className = '', sortable = false, ...props }) => (
  <th 
    className={`
      px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
      ${sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </th>
);

const TableCell = ({ children, className = '', ...props }) => (
  <td 
    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </td>
);

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

export default Table;
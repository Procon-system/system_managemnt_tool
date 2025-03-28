const ResourceTable = ({ resources, resourceType, onEdit }) => {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              {resourceType?.fieldDefinitions
                .filter(field => field.showInList)
                .map(field => (
                  <th key={field.fieldName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.displayName || field.fieldName}
                  </th>
                ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.map(resource => (
              <tr key={resource._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {resource.name}
                </td>
                {resourceType?.fieldDefinitions
                  .filter(field => field.showInList)
                  .map(field => (
                    <td key={field.fieldName} className="px-6 py-4 whitespace-nowrap">
                      {renderFieldValue(resource[field.fieldName], field.fieldType)}
                    </td>
                  ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onEdit(resource._id)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderFieldValue = (value, fieldType) => {
    switch(fieldType) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value || '-';
    }
  };
  
  export default ResourceTable;
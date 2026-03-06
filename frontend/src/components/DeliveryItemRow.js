import React from 'react';
import { preventScrollChange, handleEnterKey } from '../utils/inputHelpers';

const DeliveryItemRow = ({ item, index, customers, categories, onItemChange, onSave, readOnly }) => {
    return (
        <tr className="hover:bg-primary/5 transition-all duration-200 border-b border-gray-50 group">
            <td className="p-3 w-1/3 min-w-[160px] sm:min-w-[200px] border-r border-gray-50 sticky left-0 bg-white group-hover:bg-primary/5 z-10">
                <select
                    id={`customer-${index}`}
                    name={`customer-${index}`}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-bold shadow-sm appearance-none disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200"
                    value={item.customer_id}
                    onChange={(e) => onItemChange(index, 'customer_id', e.target.value)}
                    disabled={readOnly}
                >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </td>

            {categories.map(cat => (
                <td key={cat.id} className="p-3 w-24 border-r border-gray-50">
                    <input
                        type="number"
                        id={`qty-${index}-${cat.id}`}
                        name={`qty-${index}-${cat.id}`}
                        className="w-full h-11 px-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-center text-sm font-black shadow-sm disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200"
                        placeholder="0"
                        value={(item.quantities && item.quantities[cat.id]) || ''}
                        onChange={(e) => onItemChange(index, 'quantity', e.target.value, cat.id)}
                        onWheel={preventScrollChange}
                        onKeyDown={handleEnterKey}
                        disabled={readOnly}
                    />
                </td>
            ))}

            {!readOnly && (
                <td className="p-2 text-center">
                    <button
                        onClick={() => onSave(index)}
                        className="h-12 w-12 rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center transition-colors mx-auto"
                        title="Save Item"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </td>
            )}
        </tr>
    );
};

export default React.memo(DeliveryItemRow);

import React from 'react';

const Card = ({ title, value, color }) => (
    <div className={`p-4 bg-white rounded shadow-md border-l-4 ${color}`}>
        <h3 className="text-gray-500 text-sm font-bold uppercase">{title}</h3>
        <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
);

const SummaryCards = ({ data }) => {
    if (!data) return null;

    const { total_sales, total_pending, today_collection, stock } = data;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card
                title="Today's Collection"
                value={`₹${today_collection?.toLocaleString() || 0}`}
                color="border-green-500"
            />
            <Card
                title="Total Pending"
                value={`₹${total_pending?.toLocaleString() || 0}`}
                color="border-red-500"
            />
            <Card
                title="Total Sales (Week)"
                value={`₹${total_sales?.toLocaleString() || 0}`}
                color="border-blue-500"
            />
            <Card
                title="Medium Stock"
                value={`${stock?.medium || 0} Bags`}
                color="border-yellow-500"
            />
            <Card
                title="Super Small Stock"
                value={`${stock?.super_small || 0} Bags`}
                color="border-purple-500"
            />
        </div>
    );
};

export default SummaryCards;

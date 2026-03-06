import React from 'react';
import Skeleton from './Skeleton';

const CardSkeleton = () => {
    return (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex items-center shadow-lg transition-transform duration-300 hover:scale-105">
            <div className={`p-4 rounded-lg bg-gray-50 mr-4`}>
                <Skeleton className="h-8 w-8" variant="circular" />
            </div>
            <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" variant="text" />
                <Skeleton className="h-8 w-32" variant="rectangular" />
            </div>
        </div>
    );
};

export default CardSkeleton;

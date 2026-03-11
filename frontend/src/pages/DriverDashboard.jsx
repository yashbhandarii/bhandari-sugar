import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';

const DriverDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Welcome, ${user?.name}`}
                subtitle="Manage your delivery sheets"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Start New Delivery" className="h-full">
                    <p className="text-gray-600 mb-6">
                        Create a new delivery sheet for today's trip.
                        Add customers and bag counts before submitting to the manager.
                    </p>
                    <Button
                        onClick={() => navigate('/driver/delivery-sheet/new')}
                        fullWidth
                        size="lg"
                    >
                        Create New Sheet
                    </Button>
                </Card>

                <Card title="My History" className="h-full">
                    <p className="text-gray-600 mb-6">
                        View past delivery sheets, check status, and download copies.
                        You can edit sheets that are still in 'Draft' status.
                    </p>
                    <Button
                        onClick={() => navigate('/driver/history')}
                        variant="secondary"
                        fullWidth
                        size="lg"
                    >
                        View My Delivery Sheets
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default DriverDashboard;

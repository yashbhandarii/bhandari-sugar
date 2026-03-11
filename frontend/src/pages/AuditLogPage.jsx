import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ACTION_LABELS = {
    CREATE_CUSTOMER: { label: 'Customer Created', color: 'bg-blue-100 text-blue-800' },
    UPDATE_CUSTOMER: { label: 'Customer Updated', color: 'bg-yellow-100 text-yellow-800' },
    DELETE_CUSTOMER: { label: 'Customer Deleted', color: 'bg-red-100 text-red-800' },
    CREATE: { label: 'Payment Recorded', color: 'bg-green-100 text-green-800' },
    PAYMENT_DISCOUNT: { label: 'Payment / Discount', color: 'bg-green-100 text-green-800' },
    GENERATE_INVOICES: { label: 'Invoices Generated', color: 'bg-purple-100 text-purple-800' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Filters
    const [page, setPage] = useState(1);
    const [action, setAction] = useState('');
    const [entityType, setEntityType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [actionTypes, setActionTypes] = useState([]);

    // Expanded details row
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        api.get('/audit/action-types')
            .then(r => setActionTypes(r.data))
            .catch(() => { });
    }, []);

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: 50 });
            if (action) params.set('action', action);
            if (entityType) params.set('entity_type', entityType);
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo) params.set('date_to', dateTo);

            const res = await api.get(`/audit?${params.toString()}`);
            setLogs(res.data.rows);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
            setPage(p);
        } catch (e) {
            console.error('Failed to fetch audit logs', e);
        } finally {
            setLoading(false);
        }
    }, [action, entityType, dateFrom, dateTo]);

    useEffect(() => {
        fetchLogs(1);
    }, [fetchLogs]);

    const handleReset = () => {
        setAction('');
        setEntityType('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    const formatDetails = (details) => {
        if (!details) return null;
        try {
            const obj = typeof details === 'string' ? JSON.parse(details) : details;
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(details);
        }
    };

    const badge = (actionKey) => {
        const meta = ACTION_LABELS[actionKey];
        if (meta) {
            return (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
                    {meta.label}
                </span>
            );
        }
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {actionKey}
            </span>
        );
    };

    const entityBadge = (type) => (
        <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-50 text-gray-600 border border-gray-200">
            {type || '—'}
        </span>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Financial Audit Log"
                subtitle={`${total.toLocaleString('en-IN')} event${total !== 1 ? 's' : ''} recorded`}
            />

            {/* Filter Bar */}
            <Card>
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Action filter */}
                    <div className="flex flex-col gap-1 min-w-[180px]">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</label>
                        <select
                            value={action}
                            onChange={e => setAction(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">All Actions</option>
                            {actionTypes.map(a => (
                                <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Entity type filter */}
                    <div className="flex flex-col gap-1 min-w-[160px]">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</label>
                        <select
                            value={entityType}
                            onChange={e => setEntityType(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="">All Entities</option>
                            <option value="PAYMENT_DISCOUNT">Payment / Discount</option>
                            <option value="DELIVERY_SHEET">Delivery Sheet</option>
                            <option value="CUSTOMER">Customer</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            max={dateTo || todayStr()}
                            onChange={e => setDateFrom(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    {/* Date To */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            min={dateFrom}
                            max={todayStr()}
                            onChange={e => setDateTo(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <button
                        onClick={handleReset}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </Card>

            {/* Log Table */}
            <Card>
                {loading ? (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="text-sm">Loading audit logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <div className="text-3xl mb-2">🔍</div>
                        <p className="font-semibold text-gray-600">No events found</p>
                        <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Date & Time</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Entity</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-600">ID</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <React.Fragment key={log.id}>
                                        <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-gray-900">{log.user_name || '—'}</div>
                                                <div className="text-xs text-gray-400 capitalize">{log.user_role}</div>
                                            </td>
                                            <td className="py-3 px-4">{badge(log.action)}</td>
                                            <td className="py-3 px-4">{entityBadge(log.entity_type)}</td>
                                            <td className="py-3 px-4 text-center text-gray-500 font-mono">
                                                {log.entity_id || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {log.details ? (
                                                    <button
                                                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                        className="text-xs text-primary hover:underline font-semibold"
                                                    >
                                                        {expandedId === log.id ? 'Hide' : 'View'}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedId === log.id && log.details && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="px-6 pb-4 pt-1">
                                                    <pre className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                                                        {formatDetails(log.details)}
                                                    </pre>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages} &nbsp;·&nbsp; {total} total events
                        </span>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => fetchLogs(page - 1)}
                                disabled={page <= 1}
                            >
                                ← Prev
                            </Button>
                            <Button
                                onClick={() => fetchLogs(page + 1)}
                                disabled={page >= totalPages}
                            >
                                Next →
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AuditLogPage;

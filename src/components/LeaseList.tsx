"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lease } from "@prisma/client";
import { toast } from "react-hot-toast";
import { DeleteIcon, EditIcon, ShareIcon } from "lucide-react";
import SpinnerIcon from "./SpinnerIcon";

type LeaseWithDetails = Lease & {
    leaseType: "RESIDENTIAL" | "COMMERCIAL";
    utilitiesIncluded: boolean;
    monthlyMaintenanceFee: number;
    latePaymentPenalty: number;
    notes?: string;
    shareToken?: string;
};

export default function LeaseList({ refreshTrigger, userName }: { refreshTrigger?: number, userName?: string }) {
    const router = useRouter();
    const [leases, setLeases] = useState<LeaseWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [shareModal, setShareModal] = useState({
        open: false,
        leaseId: "",
        shareLink: "",
        loading: false,
    });
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        leaseId: "",
        loading: false,
    });
    const [viewMode, setViewMode] = useState<"cards" | "table">("table");

    const fetchLeases = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch("/api/leases", {
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status === 401) {
                router.push("/login");
                return;
            }

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to fetch leases");
            if (!Array.isArray(data?.data)) throw new Error("Invalid data format");

            setLeases(data.data.map((lease: any) => ({
                id: lease.id,
                startDate: lease.startDate,
                endDate: lease.endDate,
                monthlyRent: Number(lease.monthlyRent),
                securityDeposit: Number(lease.securityDeposit),
                additionalCharges: lease.additionalCharges ? Number(lease.additionalCharges) : undefined,
                annualRentIncrease: lease.annualRentIncrease ? Number(lease.annualRentIncrease) : 0,
                leaseType: lease.leaseType || "RESIDENTIAL",
                utilitiesIncluded: Boolean(lease.utilitiesIncluded),
                monthlyMaintenanceFee: lease.monthlyMaintenanceFee ? Number(lease.monthlyMaintenanceFee) : 0,
                latePaymentPenalty: lease.latePaymentPenalty ? Number(lease.latePaymentPenalty) : 0,
                notes: lease.notes || undefined,
                userId: lease.userId,
                createdAt: lease.createdAt,
                updatedAt: lease.updatedAt,
                shareToken: lease.shareToken,
            })));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load leases");
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalLeaseCost = (lease: LeaseWithDetails) => {
        const startDate = new Date(lease.startDate);
        const endDate = new Date(lease.endDate);

        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() - startDate.getMonth());

        let totalRent = 0;
        let currentRent = lease.monthlyRent;

        for (let i = 0; i < months; i++) {
            if (i > 0 && i % 12 === 0) {
                currentRent *= (1 + lease.annualRentIncrease / 100);
            }
            totalRent += currentRent;
        }

        const totalMaintenance = lease.monthlyMaintenanceFee * months;
        const totalAdditional = lease.additionalCharges || 0;

        return totalRent + totalMaintenance + totalAdditional;
    };

    const generateShareLink = async (leaseId: string) => {
        setShareModal(prev => ({ ...prev, loading: true }));

        try {
            const res = await fetch(`/api/leases/${leaseId}/share-token`, {
                method: "POST",
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to generate link");

            const shareLink = `${window.location.origin}/dashboard/share/${data.token}`;
            setShareModal({
                open: true,
                leaseId,
                shareLink,
                loading: false,
            });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to generate link");
            setShareModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleEdit = (leaseId: string) => {
        router.push(`/dashboard/edit/${leaseId}`);
    };

    const handleDelete = async () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            const res = await fetch(`/api/leases/${deleteModal.leaseId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to delete lease");
            }

            toast.success("Lease deleted successfully");
            fetchLeases();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete lease");
        } finally {
            setDeleteModal({ open: false, leaseId: "", loading: false });
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareModal.shareLink);
        toast.success("Link copied to clipboard!");
    };

    const exportToCSV = () => {
        const headers = [
            'Lease Type', 'Start Date', 'End Date', 'Monthly Rent (ETB)',
            'Security Deposit (ETB)', 'Total Cost (ETB)', 'Utilities Included', 'Notes'
        ];

        const csvContent = [
            headers.join(','),
            ...leases.map(lease => [
                lease.leaseType,
                formatDate(lease.startDate),
                formatDate(lease.endDate),
                lease.monthlyRent,
                lease.securityDeposit,
                calculateTotalLeaseCost(lease),
                lease.utilitiesIncluded ? 'Yes' : 'No',
                `"${lease.notes || ''}"` // Wrap in quotes to handle commas in notes
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'leases_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => { fetchLeases(); }, [refreshTrigger]);

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-ET", {
            style: "currency",
            currency: "ETB",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };


    if (loading) return <div className="p-4 text-center">Loading leases...</div>;
    if (error) return <div className="p-4 text-red-500 text-center">Error: {error}</div>;

    return (
        <div className=" w-screen  px-[3%]">

            <div className="bg-gradient-to-r rounded-lg pb-6">
                <h1 className="text-2xl font-bold">Welcome back, {userName || 'User'}!</h1>
                <p className="opacity-90">Manage your property leases and view important details</p>
            </div>


            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-10">
                <h2 className="text-xl font-semibold text-gray-800">Your Lease Portfolio</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
                        className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        {viewMode === "table" ? (
                            <>
                                <CardsIcon className="w-4 h-4" />
                                Card View
                            </>
                        ) : (
                            <>
                                <TableIcon className="w-4 h-4" />
                                Table View
                            </>
                        )}
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        onClick={() => router.push("/createleanse")}
                        className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New Lease
                    </button>
                </div>
            </div>

            {leases.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 ">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No leases found</h3>
                    <p className="mt-1 text-gray-500">Get started by creating a new lease agreement.</p>
                    <div className="mt-6">
                        <button
                            onClick={() => router.push("/createleanse")}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                            New Lease
                        </button>
                    </div>
                </div>
            ) : viewMode === "table" ? (
                <>
                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lease Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilities</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {leases.map((lease) => (
                                    <tr key={lease.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${lease.leaseType === "COMMERCIAL"
                                                ? "bg-indigo-100 text-indigo-800"
                                                : "bg-teal-100 text-teal-800"
                                                }`}>
                                                {lease.leaseType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{formatDate(lease.startDate)}</div>
                                            <div className="text-sm text-gray-500">to {formatDate(lease.endDate)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(lease.monthlyRent)}/mo
                                            </div>
                                            {lease.annualRentIncrease > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    +{lease.annualRentIncrease}% annual increase
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            {formatCurrency(calculateTotalLeaseCost(lease))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {lease.utilitiesIncluded ? (
                                                <span className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-800">
                                                    Included
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                                    Not Included
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(lease.id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Edit"
                                                >
                                                    <EditIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ open: true, leaseId: lease.id, loading: false })}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <DeleteIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => generateShareLink(lease.id)}
                                                    disabled={shareModal.loading && shareModal.leaseId === lease.id}
                                                    className="text-gray-600 hover:text-gray-900"
                                                    title="Share"
                                                >
                                                    {shareModal.loading && shareModal.leaseId === lease.id ? (
                                                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <ShareIcon className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Leases</p>
                                    <p className="text-2xl font-semibold text-gray-900">{leases.length}</p>
                                </div>
                                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                                    <DocumentTextIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Monthly Income</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(leases.reduce((sum, lease) => sum + lease.monthlyRent, 0))}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-teal-100 text-teal-600">
                                    <CurrencyDollarIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Value</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {formatCurrency(leases.reduce((sum, lease) => sum + calculateTotalLeaseCost(lease), 0))}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                                    <ChartBarIcon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {leases.map((lease) => (
                        <div key={lease.id} className="p-5 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900">
                                        {lease.leaseType === "COMMERCIAL" ? "Commercial" : "Residential"} Lease
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-1 text-xs font-medium rounded mb-1 ${lease.leaseType === "COMMERCIAL"
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-teal-100 text-teal-800"
                                        }`}>
                                        {lease.leaseType}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatCurrency(lease.monthlyRent)}/mo
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 mt-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Security Deposit:</span>
                                    <span className="text-sm font-medium">
                                        {formatCurrency(lease.securityDeposit)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Total Lease Value:</span>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {formatCurrency(calculateTotalLeaseCost(lease))}
                                    </span>
                                </div>

                                {lease.utilitiesIncluded && (
                                    <div className="flex items-center gap-2 text-sm text-teal-600 font-medium py-2 border-b border-gray-100">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Utilities Included
                                    </div>
                                )}

                                {lease.notes && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Notes:</p>
                                        <p className="text-sm text-gray-700">{lease.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t flex gap-2">
                                <button
                                    onClick={() => handleEdit(lease.id)}
                                    className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1"
                                >
                                    <EditIcon className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => generateShareLink(lease.id)}
                                    disabled={shareModal.loading && shareModal.leaseId === lease.id}
                                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1"
                                >
                                    {shareModal.loading && shareModal.leaseId === lease.id ? (
                                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ShareIcon className="w-4 h-4" />
                                    )}
                                    Share
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {shareModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Share Lease</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Anyone with this link can view this lease:
                        </p>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="text"
                                value={shareModal.shareLink}
                                readOnly
                                className="flex-1 p-2 border rounded text-sm truncate"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Copy
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShareModal(prev => ({ ...prev, open: false }))}
                                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete this lease? This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ open: false, leaseId: "", loading: false })}
                                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                                disabled={deleteModal.loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded flex items-center gap-2"
                                disabled={deleteModal.loading}
                            >
                                {deleteModal.loading ? (
                                    <>
                                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Lease"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add these new icon components
function CardsIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
        </svg>
    )
}

function TableIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
        </svg>
    )
}

function DownloadIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    )
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    )
}

function DocumentTextIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    )
}

function CurrencyDollarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}



function ChartBarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    )
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}
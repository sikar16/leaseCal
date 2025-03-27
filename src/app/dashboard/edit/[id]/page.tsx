// app/leases/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Lease } from "@prisma/client";

type LeaseWithDetails = Lease & {
    leaseType: "RESIDENTIAL" | "COMMERCIAL";
    utilitiesIncluded: boolean;
    monthlyMaintenanceFee: number;
    latePaymentPenalty: number;
    notes?: string;
};

export default function EditLeasePage() {
    const router = useRouter();
    const params = useParams();
    const leaseId = params.id as string;

    const [lease, setLease] = useState<LeaseWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchLease = async () => {
            try {
                const res = await fetch(`/api/leases/${leaseId}`, {
                    credentials: "include",
                });

                if (res.status === 401) {
                    router.push("/login");
                    return;
                }

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to fetch lease");
                setLease({
                    ...data.data,
                    startDate: new Date(data.data.startDate).toISOString().split('T')[0],
                    endDate: new Date(data.data.endDate).toISOString().split('T')[0]
                });
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to load lease");
                router.push("/leases");
            } finally {
                setLoading(false);
            }
        };

        fetchLease();
    }, [leaseId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lease) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/leases/${leaseId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...lease,
                    // Ensure dates are properly formatted
                    startDate: new Date(lease.startDate).toISOString(),
                    endDate: new Date(lease.endDate).toISOString(),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                console.error("Update failed:", data);
                throw new Error(data.message || "Failed to update lease");
            }

            toast.success("Lease updated successfully");
            router.push("/dashboard");
        } catch (err) {
            console.error("Error updating lease:", err);
            toast.error(err instanceof Error ? err.message : "Failed to update lease");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

        setLease(prev => ({
            ...prev!,
            [name]: type === "checkbox" ? checked :
                type === "number" ? Number(value) :
                    value,
        }));
    };

    // And in your date inputs:

    if (loading) return <div className="p-4 text-center">Loading lease...</div>;
    if (!lease) return <div className="p-4 text-red-500 text-center">Lease not found</div>;

    return (
        <div className="w-full mt-[10%] px-[4%]">
            <h1 className="text-2xl font-bold mb-6">Edit Lease</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lease Type */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Lease Type</label>
                        <select
                            name="leaseType"
                            value={lease.leaseType}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="RESIDENTIAL">Residential</option>
                            <option value="COMMERCIAL">Commercial</option>
                        </select>
                    </div>

                    {/* Monthly Rent */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Monthly Rent ($)</label>
                        <input
                            type="number"
                            name="monthlyRent"
                            value={lease.monthlyRent}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    {/* Start Date */}
                    {/* Start Date */}
                    <input
                        type="date"
                        name="startDate"
                        value={lease.startDate.toString().split('T')[0]}  // Formatting happens here
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />

                    {/* End Date */}
                    <input
                        type="date"
                        name="endDate"
                        value={lease.endDate.toString().split('T')[0]}  // Formatting happens here
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />

                    {/* Security Deposit */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Security Deposit ($)</label>
                        <input
                            type="number"
                            name="securityDeposit"
                            value={lease.securityDeposit}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    {/* Annual Rent Increase */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Annual Rent Increase (%)</label>
                        <input
                            type="number"
                            name="annualRentIncrease"
                            value={lease.annualRentIncrease}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    {/* Utilities Included */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="utilitiesIncluded"
                            checked={lease.utilitiesIncluded}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        <label className="text-sm font-medium">Utilities Included</label>
                    </div>

                    {/* Monthly Maintenance Fee */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Monthly Maintenance Fee ($)</label>
                        <input
                            type="number"
                            name="monthlyMaintenanceFee"
                            value={lease.monthlyMaintenanceFee}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    {/* Late Payment Penalty */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Late Payment Penalty ($)</label>
                        <input
                            type="number"
                            name="latePaymentPenalty"
                            value={lease.latePaymentPenalty}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>

                {/* Additional Notes */}
                <div>
                    <label className="block text-sm font-medium mb-1">Additional Notes</label>
                    <textarea
                        name="notes"
                        value={lease.notes || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        rows={3}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.push("/leases")}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin">↻</span>
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
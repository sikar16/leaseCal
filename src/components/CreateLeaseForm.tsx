'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar } from '../components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type LeaseType = "RESIDENTIAL" | "COMMERCIAL";

export default function CreateLeaseForm({ onLeaseCreated }: { onLeaseCreated: () => void }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        startDate: null as Date | null,
        endDate: null as Date | null,
        monthlyRent: "",
        securityDeposit: "",
        additionalCharges: "",
        annualRentIncrease: "0",
        leaseType: "RESIDENTIAL" as LeaseType,
        utilitiesIncluded: false,
        monthlyMaintenanceFee: "0",
        latePaymentPenalty: "0",
        notes: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Calculate totals based on input values
    const totalMonths = formData.startDate && formData.endDate ?
        (formData.endDate.getFullYear() - formData.startDate.getFullYear()) * 12 +
        (formData.endDate.getMonth() - formData.startDate.getMonth()) : 0;

    let totalRent = 0;
    const monthlyRentNum = parseFloat(formData.monthlyRent) || 0;
    let currentRent = monthlyRentNum;

    for (let i = 0; i < totalMonths; i++) {
        if (i > 0 && i % 12 === 0) {
            const increasePercentage = parseFloat(formData.annualRentIncrease) || 0;
            currentRent *= 1 + (increasePercentage / 100);
        }
        totalRent += currentRent;
    }

    const monthlyMaintenanceNum = parseFloat(formData.monthlyMaintenanceFee) || 0;
    const totalMaintenance = monthlyMaintenanceNum * totalMonths;
    const securityDepositNum = parseFloat(formData.securityDeposit) || 0;
    const additionalChargesNum = parseFloat(formData.additionalCharges) || 0;
    const totalCost = totalRent + securityDepositNum + additionalChargesNum + totalMaintenance;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            if (!formData.startDate || !formData.endDate) {
                throw new Error("Start date and end date are required");
            }

            const numericFields = {
                monthlyRent: monthlyRentNum,
                securityDeposit: securityDepositNum,
                additionalCharges: formData.additionalCharges ? additionalChargesNum : undefined,
                annualRentIncrease: parseFloat(formData.annualRentIncrease),
                monthlyMaintenanceFee: monthlyMaintenanceNum,
                latePaymentPenalty: parseFloat(formData.latePaymentPenalty),
            };

            const res = await fetch("/api/leases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    startDate: formData.startDate.toISOString(),
                    endDate: formData.endDate.toISOString(),
                    ...numericFields,
                    leaseType: formData.leaseType,
                    utilitiesIncluded: formData.utilitiesIncluded,
                    notes: formData.notes || undefined,
                }),
            });

            const responseData = await res.json();

            if (res.ok) {
                toast.success('Successfully Created');

                router.push("/dashboard")
            }
            if (!res.ok) {
                throw new Error(
                    responseData.details?.map((d: any) => d.message).join(", ") ||
                    responseData.error ||
                    "Failed to create lease"
                );
            }

            // Notify parent component to refresh leases
            onLeaseCreated();
            setSuccess(true);

            // Reset form
            setFormData({
                startDate: null,
                endDate: null,
                monthlyRent: "",
                securityDeposit: "",
                additionalCharges: "",
                annualRentIncrease: "0",
                leaseType: "RESIDENTIAL",
                utilitiesIncluded: false,
                monthlyMaintenanceFee: "0",
                latePaymentPenalty: "0",
                notes: "",
            });

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full ">
            <h1 className="text-2xl font-bold mb-6">Create New Lease</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-2 text-red-500 bg-red-50 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-2 text-green-500 bg-green-50 rounded">
                        Lease created successfully!
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Start Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.startDate || undefined}
                                    onSelect={(date) => setFormData({ ...formData, startDate: date || null })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">End Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.endDate || undefined}
                                    onSelect={(date) => setFormData({ ...formData, endDate: date || null })}
                                    initialFocus
                                    fromDate={formData.startDate || undefined}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Monthly Rent (ETB)</label>
                        <Input
                            type="number"
                            value={formData.monthlyRent}
                            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Security Deposit (ETB)</label>
                        <Input
                            type="number"
                            value={formData.securityDeposit}
                            onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Additional Charges (ETB)</label>
                        <Input
                            type="number"
                            value={formData.additionalCharges}
                            onChange={(e) => setFormData({ ...formData, additionalCharges: e.target.value })}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Annual Rent Increase (%)</label>
                        <Input
                            type="number"
                            value={formData.annualRentIncrease}
                            onChange={(e) => setFormData({ ...formData, annualRentIncrease: e.target.value })}
                            min="0"
                            step="0.1"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Lease Type</label>
                        <select
                            value={formData.leaseType}
                            onChange={(e) => setFormData({ ...formData, leaseType: e.target.value as LeaseType })}
                            className="w-full p-2 border rounded"
                        >
                            <option value="RESIDENTIAL">Residential</option>
                            <option value="COMMERCIAL">Commercial</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.utilitiesIncluded}
                                onChange={(e) => setFormData({ ...formData, utilitiesIncluded: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <span className="text-sm font-medium">Utilities Included</span>
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Monthly Maintenance Fee (ETB)</label>
                        <Input
                            type="number"
                            value={formData.monthlyMaintenanceFee}
                            onChange={(e) => setFormData({ ...formData, monthlyMaintenanceFee: e.target.value })}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Late Payment Penalty (ETB)</label>
                        <Input
                            type="number"
                            value={formData.latePaymentPenalty}
                            onChange={(e) => setFormData({ ...formData, latePaymentPenalty: e.target.value })}
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full p-2 border rounded"
                        rows={3}
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h2 className="font-semibold">Calculation Results</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Lease Duration</p>
                            <p className="font-medium">{totalMonths} months</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Rent</p>
                            <p className="font-medium"> {totalRent.toFixed(2)} ETB</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Maintenance</p>
                            <p className="font-medium"> {totalMaintenance.toFixed(2)} ETB</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Cost</p>
                            <p className="font-medium"> {totalCost.toFixed(2)} ETB</p>
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create Lease"}
                </Button>
            </form>
        </div>
    );
}
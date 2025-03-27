'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Calendar } from '../../../components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LeaseCalculator() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [monthlyRent, setMonthlyRent] = useState(0);
    const [securityDeposit, setSecurityDeposit] = useState(0);
    const [additionalCharges, setAdditionalCharges] = useState(0);
    const [annualRentIncrease, setAnnualRentIncrease] = useState(0);
    const [leaseType, setLeaseType] = useState('RESIDENTIAL');
    const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
    const [monthlyMaintenanceFee, setMonthlyMaintenanceFee] = useState(0);
    const [latePaymentPenalty, setLatePaymentPenalty] = useState(0);
    const [notes, setNotes] = useState('');

    // Calculate totals based on input values
    const totalMonths = startDate && endDate ?
        (new Date(endDate).getFullYear() - new Date(startDate).getFullYear()) * 12 +
        (new Date(endDate).getMonth() - new Date(startDate).getMonth()) : 0;

    let totalRent = 0;
    let currentRent = monthlyRent;

    for (let i = 0; i < totalMonths; i++) {
        if (i > 0 && i % 12 === 0) {
            currentRent *= 1 + (annualRentIncrease / 100);
        }
        totalRent += currentRent;
    }

    const totalMaintenance = monthlyMaintenanceFee * totalMonths;
    const totalCost = totalRent + securityDeposit + additionalCharges + totalMaintenance;
    const route = useRouter()
    const handleSubmit = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost:5000/lease', {
            startDate: startDate,
            endDate: endDate,
            monthlyRent: monthlyRent,
            securityDeposit: securityDeposit,
            additionalCharges: additionalCharges,
            annualRentIncrease: annualRentIncrease,
            leaseType: leaseType,
            utilitiesIncluded: utilitiesIncluded,
            monthlyMaintenanceFee: monthlyMaintenanceFee,
            latePaymentPenalty: latePaymentPenalty,
            notes: notes

        })
        route.push('/dashboard')
    }


    return (
        <div className="w-full pt-60">
            <h1 className="text-2xl font-bold mb-6">New Lease Calculator</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Start Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
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
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
                                    fromDate={startDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Monthly Rent ($)</label>
                        <Input
                            type="number"
                            value={monthlyRent}
                            onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Security Deposit ($)</label>
                        <Input
                            type="number"
                            value={securityDeposit}
                            onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Additional Charges ($)</label>
                        <Input
                            type="number"
                            value={additionalCharges}
                            onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Annual Rent Increase (%)</label>
                        <Input
                            type="number"
                            value={annualRentIncrease}
                            onChange={(e) => setAnnualRentIncrease(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Lease Type</label>
                        <select
                            value={leaseType}
                            onChange={(e) => setLeaseType(e.target.value)}
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
                                checked={utilitiesIncluded}
                                onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm font-medium">Utilities Included</span>
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Monthly Maintenance Fee ($)</label>
                        <Input
                            type="number"
                            value={monthlyMaintenanceFee}
                            onChange={(e) => setMonthlyMaintenanceFee(Number(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Late Payment Penalty ($)</label>
                        <Input
                            type="number"
                            value={latePaymentPenalty}
                            onChange={(e) => setLatePaymentPenalty(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
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
                            <p className="font-medium">${totalRent.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Maintenance</p>
                            <p className="font-medium">${totalMaintenance.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Cost</p>
                            <p className="font-medium">${totalCost.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full">
                    Save Lease
                </Button>
            </form>
        </div>
    );
}
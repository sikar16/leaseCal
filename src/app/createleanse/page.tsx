"use client";
import LeaseList from "@/components/LeaseList";
import CreateLeaseForm from "@/components/CreateLeaseForm";
import { useState } from "react";

export default function LeasesPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleLeaseCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <main className="bg-gray-50 min-h-screen py-10">
            <div className="w-full px-4 sm:px-6 lg:px-8">

                <div className="mt-10 w-[900px] bg-white  rounded-lg p-6">

                    <div className="mt-6">
                        <CreateLeaseForm onLeaseCreated={handleLeaseCreated} />
                    </div>
                </div>


            </div>
        </main>
    );
}

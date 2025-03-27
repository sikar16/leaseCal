import { notFound } from 'next/navigation';

interface LeaseData {
    lease: {
        id: string;
        leaseType: string;
        startDate: string;
        endDate: string;
        monthlyRent: number;
        securityDeposit: number;
        utilitiesIncluded: boolean;
        owner: {
            name: string;
            email: string;
        };
    };
}

export default async function SharedLeasePage({
    params,
}: {
    params: { token: string };
}) {
    try {
        const res = await fetch(
            `/api/shareleases/${params.token}`,
            { cache: 'no-store' }
        );

        if (!res.ok) throw new Error('Failed to fetch');

        const { data } = await res.json() as { data: LeaseData };

        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">
                    Lease Shared by {data.lease.owner.name}
                </h1>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Lease Details</h2>
                            <p><span className="font-medium">Type:</span> {data.lease.leaseType}</p>
                            <p><span className="font-medium">Period:</span> {new Date(data.lease.startDate).toLocaleDateString()} - {new Date(data.lease.endDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Financials</h2>
                            <p><span className="font-medium">Rent:</span> {data.lease.monthlyRent.toLocaleString()} ETB</p>
                            <p><span className="font-medium">Deposit:</span> {data.lease.securityDeposit.toLocaleString()} ETB</p>
                            <p><span className="font-medium">Utilities:</span> {data.lease.utilitiesIncluded ? 'Included' : 'Not Included'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        notFound();
    }
}
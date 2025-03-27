"use client";
import axios from 'axios';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { EyeIcon, PencilIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';
import LeaseList from '@/components/LeaseList';

const Page = () => {

    return (
        <div>
            <LeaseList />
        </div>
    );
};

export default Page;
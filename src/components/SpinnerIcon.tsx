import React from 'react';

interface SpinnerIconProps {
    className?: string;
    size?: number;
    color?: string;
}

const SpinnerIcon: React.FC<SpinnerIconProps> = ({
    className = '',
    size = 24,
    color = 'currentColor'
}) => {
    return (
        <svg
            className={`animate-spin ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
        >
            <circle
                className="opacity-25"
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 2}
                stroke={color}
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill={color}
                d={`M${size} ${size / 2}c0-${size / 2 * 0.8}-${size / 2 * 0.8}-${size / 2}-${size / 2}-${size / 2}`}
            />
        </svg>
    );
};

export default SpinnerIcon;
import React from 'react';
import Svg, { Path, Ellipse } from 'react-native-svg';

/**
 * Minimal stylized seahorse silhouette — white on any background.
 * Head (oval) + snout + S-curve body + curling tail.
 */
export const SeahorseIcon: React.FC = () => (
    <Svg width={22} height={26} viewBox="0 0 22 26" fill="none">
        {/* Head */}
        <Ellipse cx="12" cy="6.5" rx="4.5" ry="5" fill="white" />
        {/* Snout */}
        <Path d="M 7.5 7 L 3 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        {/* Crown spikes */}
        <Path
            d="M 10 2 L 11 0 M 12 1.5 L 12.5 0 M 14 2.5 L 15 1"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Body — right side */}
        <Path
            d="M 14 11 C 17 12 18 15 17 18 C 16 21 14 22.5 13 24.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
        />
        {/* Body — left side */}
        <Path
            d="M 10 11 C 7 12 7 15 8 18 C 9 21 11 22.5 13 24.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
        />
        {/* Curling tail */}
        <Path
            d="M 13 24.5 C 14 26 16 27 16 25.5 C 16 24 14 23.5 13 24.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
        />
    </Svg>
);

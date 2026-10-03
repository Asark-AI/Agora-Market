'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/super/components/ui/tooltip';

// Dummy sales data for Ghana's 16 regions.
// In a real app, this would be fetched from your API.
const regionData = [
  { id: 'AH', name: 'Ashanti', sales: 1250000 },
  { id: 'AS', name: 'Ahafo', sales: 450000 },
  { id: 'BE', name: 'Bono East', sales: 520000 },
  { id: 'BO', name: 'Bono', sales: 610000 },
  { id: 'CR', name: 'Central', sales: 1120000 },
  { id: 'ER', name: 'Eastern', sales: 1340000 },
  { id: 'GA', name: 'Greater Accra', sales: 4500000 },
  { id: 'NE', name: 'North East', sales: 210000 },
  { id: 'NP', name: 'Northern', sales: 780000 },
  { id: 'OT', name: 'Oti', sales: 310000 },
  { id: 'SV', name: 'Savannah', sales: 190000 },
  { id: 'UE', name: 'Upper East', sales: 420000 },
  { id: 'UW', name: 'Upper West', sales: 380000 },
  { id: 'VR', name: 'Volta', sales: 890000 },
  { id: 'WR', name: 'Western', sales: 1050000 },
  { id: 'WN', name: 'Western North', sales: 480000 },
];

// SVG path data for Ghana's 16 regions.
const regions = [
    { id: 'UW', name: 'Upper West Region', d: 'M81.3 2.5 56.5 2.2l-2.4 22-9.7.1-.6 6.7-10.4 12.2-0.7 14.4 15 16.3 15.5.3 6.2-12.2 4.8-17.6-2.8-25Z' },
    { id: 'UE', name: 'Upper East Region', d: 'M145.4 1.7 122 1.5l-1.6 13.5-25 9.8-11.5-2.8-3.6-5.6 2.1-14.7 2.3-4.3 16.2-4.4Z' },
    { id: 'NE', name: 'North East Region', d: 'm148.5 28.5-28.5-2.6-2-3-25.6 9.8-1.9 8.7 4.3 4.2 13 13 18-2.4 13.8-6.7.9-12Z' },
    { id: 'NP', name: 'Northern Region', d: 'm165.4 44-17-1.8-13.4 13-4.7 4.2-11 11 1.2 17 15.8 24 20 3.6 2-29 .3-16.3Z' },
    { id: 'SV', name: 'Savannah Region', d: 'M112.7 51.5 94 52l-4.7-4.5-15.7.1-15.3 16.5-.1 13 2.6 2.6 12.8 12.5 16.3 1.7 12.6-5.8-1.4-17-1.4-17.2Z' },
    { id: 'BO', name: 'Bono Region', d: 'M79.4 102.5 64.7 102l-2.2 16.2 11.2 15 16.7 2.5 7.8-7.2-2.3-15Z' },
    { id: 'OT', name: 'Oti Region', d: 'm177.4 78-16 24-2.7 18.7 8.3 13.2 21 3 5-17-.9-36.5Z' },
    { id: 'BE', name: 'Bono East Region', d: 'm128.4 98.5-12.4-5.6-16.5 1.7-8 7.2 2.3 15 22.2 11 13.7 2.9 1.5-19.8-2.3-16.1Z' },
    { id: 'AS', name: 'Ahafo Region', d: 'M87.4 121.5 76.2 136l-3.8 17 15.4 18 12.7.7 4.8-12.6-6.2-18.4Z' },
    { id: 'WN', name: 'Western North Region', d: 'M70.3 143.5 58.8 128l-3.8-17-16-2 0.5 17 4 26.3 17.5 13.5 13.3-5.3Z' },
    { id: 'AH', name: 'Ashanti Region', d: 'm128.4 122.5-14-2.8-22.3-11-7.5 11.4 4.8 12.7 12.8.7 15.3 18 6.1 1.7 15-11.8 9.1-13.6-7.6-12.5Z' },
    { id: 'ER', name: 'Eastern Region', d: 'm154.4 150-9.2 13.6-15 12 1.4 13.5 13.2 12.7 16.1-5.7 4.2-12.8Z' },
    { id: 'VR', name: 'Volta Region', d: 'm182.2 134-8.3-13.2-21-3-5 17 2.2 17.2 16 5.6 4.2 12.7 9.3-2 4.6-19.1Z' },
    { id: 'CR', name: 'Central Region', d: 'm109.2 159-6-1.7-15.2-18-17.3 13.4 7.4 22 21 19.5 19-7 6.2-13.3Z' },
    { id: 'GA', name: 'Greater Accra Region', d: 'm156.3 177.2-13.2-12.7-1.4-13.5-17.8 9.5 6.2 13.3 19 7 9.3-1.9Z' },
    { id: 'WR', name: 'Western Region', d: 'm100.8 165.8-17.3-13.5L69.8 185l-3.1 15 21 11.5 25-14.3 7.4-22Z' },
];

/**
 * Calculates the color for a region based on its sales.
 * @param sales The sales value for the region.
 * @returns An HSL color string for the region's fill.
 */
const getRegionColor = (sales: number) => {
    // Find the maximum sales value to create a relative scale.
    const maxSales = Math.max(...regionData.map(d => d.sales), 1);
    // Calculate opacity based on sales, ensuring it's between 0.15 (for visibility) and 1.
    const opacity = Math.max(0.15, Math.min(1, sales / maxSales));
    // Uses the CSS variable for primary color for theming, adjusting opacity.
    return `hsl(var(--primary) / ${opacity})`;
};

export function RegionalPerformanceMap() {
    return (
        <TooltipProvider>
            <svg viewBox="20 0 180 220" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                {regions.map(region => {
                    const data = regionData.find(d => d.id === region.id);
                    const sales = data ? data.sales : 0;
                    const color = getRegionColor(sales);
                    
                    return (
                        <Tooltip key={region.id}>
                            <TooltipTrigger asChild>
                                <path
                                    d={region.d}
                                    fill={color}
                                    stroke="hsl(var(--card))"
                                    strokeWidth="0.5"
                                    className="transition-all duration-300 hover:stroke-primary hover:stroke-2 cursor-pointer"
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-bold">{region.name}</p>
                                <p>Sales: GHC {sales.toLocaleString()}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </svg>
        </TooltipProvider>
    );
};


export interface AdPlatform {
    id: string;
    name: 'Google' | 'Facebook' | 'TikTok' | 'Snapchat';
    status: 'Connected' | 'Disconnected';
    spend: number;
    revenue: number;
    roas: number;
}

const adPlatforms: AdPlatform[] = [
    {
        id: 'AD-PL-01',
        name: 'Google',
        status: 'Connected',
        spend: 12500,
        revenue: 62500,
        roas: 5.0
    },
    {
        id: 'AD-PL-02',
        name: 'Facebook',
        status: 'Connected',
        spend: 8800,
        revenue: 38720,
        roas: 4.4
    },
    {
        id: 'AD-PL-03',
        name: 'TikTok',
        status: 'Connected',
        spend: 6200,
        revenue: 21700,
        roas: 3.5
    },
    {
        id: 'AD-PL-04',
        name: 'Snapchat',
        status: 'Disconnected',
        spend: 0,
        revenue: 0,
        roas: 0
    },
];


export const getAdPlatforms = (): Promise<AdPlatform[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(adPlatforms);
        }, 700); // Simulate network delay
    });
};

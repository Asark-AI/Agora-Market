
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';

const tourSteps = [
    {
        title: 'Welcome to Your Dashboard!',
        description: 'This quick tour will show you the main features. You can navigate through your dashboard using the menu on the left.',
        highlightId: 'dashboard-nav',
    },
    {
        title: 'Quick Overview',
        description: 'Here you can see your key business metrics at a glance, like revenue, orders, and profit.',
        highlightId: 'stat-cards',
    },
    {
        title: 'Getting Started Checklist',
        description: "This checklist guides you through the essential steps to get your store fully set up and ready for business.",
        highlightId: 'onboarding-checklist',
    },
    {
        title: 'Live Activity Stream',
        description: "Your most recent store activities, like new orders and customer interactions, will appear here in real-time.",
        highlightId: 'live-activity-stream',
    },
    {
        title: 'You\'re All Set!',
        description: 'You\'ve completed the tour. You can now start exploring your dashboard and managing your business. Good luck!',
        highlightId: '',
    }
];

export function AppTour() {
    const [step, setStep] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasCompletedTour = localStorage.getItem('hasCompletedAgoraTour');
        if (hasCompletedTour !== 'true') {
            setIsOpen(true);
        }
    }, []);

    const handleNext = () => {
        if (step < tourSteps.length - 1) {
            setStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        localStorage.setItem('hasCompletedAgoraTour', 'true');
        setIsOpen(false);
    };

    const currentStep = tourSteps[step];
    
    // We add a key to the Dialog to force re-mount on step change, which fixes animation issues.
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleFinish()} key={step}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{currentStep.title}</DialogTitle>
                    <DialogDescription>{currentStep.description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleNext}>
                        {step < tourSteps.length - 1 ? 'Next' : 'Finish Tour'}
                        {step < tourSteps.length - 1 ? <ArrowRight className="ml-2 size-4" /> : <Check className="ml-2 size-4" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

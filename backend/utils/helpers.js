/**
 * Shared utility functions for user and melody operations
 */

// Helper to check if plan has expired and downgrade to free if needed
async function checkAndDowngradeExpiredPlan(user) {
    const now = Date.now();
    const planExpiry = user.planValidUntil ? new Date(user.planValidUntil).getTime() : 0;
    
    // If plan has expired and user is not already on free plan, downgrade to free
    if (planExpiry && now >= planExpiry && user.plan !== 'free') {
        user.plan = 'free';
        user.creditsDaily = 0;
        user.creditsDailyExpiresAt = null;
        user.planValidUntil = null;
        await user.save();
    }
}

// Helper to refresh daily credits for free users if expired and permanent credits are 0
async function refreshDailyCreditsIfNeeded(user) {
    const now = Date.now();
    const exp = user.creditsDailyExpiresAt ? new Date(user.creditsDailyExpiresAt).getTime() : 0;
    
    // Only free users get daily credits, and only when permanent credits are 0
    if (user.plan === 'free' && (user.creditsPermanent || 0) === 0 && (!exp || now >= exp)) {
        user.creditsDaily = 10;
        user.creditsDailyExpiresAt = new Date(now + 24 * 60 * 60 * 1000);
        await user.save();
    }
    // If user has permanent credits or is not on free plan, ensure no daily credits
    else if (user.plan !== 'free' || (user.creditsPermanent || 0) > 0) {
        user.creditsDaily = 0;
        user.creditsDailyExpiresAt = null;
        await user.save();
    }
}

// Validate settings based on user plan (unauthenticated or free users have restrictions)
function validateSettingsForPlan(settings, plan) {
    const errors = [];
    
    // Restrictions for unauthenticated and free users
    if (!plan || plan === 'free') {
        // Only Major and Minor scales allowed
        if (settings.scale !== 'Major' && settings.scale !== 'Minor') {
            errors.push('Only Major and Minor scales are available for free users');
        }
        
        // Bars restriction: unauthorized (no plan) = only 2 bars; free plan = 2 or 4 bars
        if (!plan) {
            if (settings.bar !== 2) {
                errors.push('Only 2 bars are available for unauthorized users');
            }
        } else if (plan === 'free') {
            if (settings.bar !== 2 && settings.bar !== 4) {
                errors.push('Only 2 or 4 bars are available for free users');
            }
        }
        
        // Only Low complexity allowed
        if (settings.complex !== 'Low') {
            errors.push('Only Low complexity is available for free users');
        }
        
        // Only 4/4 beat allowed
        if (settings.beat !== '4/4') {
            errors.push('Only 4/4 beat is available for free users');
        }
    }
    
    return errors;
}

// Handle credit consumption logic uniformly
async function consumeCredit(user) {
    if (user.plan === 'pro' || user.plan === 'enterprise') {
        user.creditsPermanent = Math.max(0, (user.creditsPermanent || 0) - 1);
    } else {
        // For free plan, consume daily credits first, then permanent
        if (user.creditsDaily > 0) {
            user.creditsDaily = Math.max(0, user.creditsDaily - 1);
        } else {
            user.creditsPermanent = Math.max(0, (user.creditsPermanent || 0) - 1);
        }
    }
    await user.save();
}

// Standard error responses
const errorResponses = {
    unauthorized: (res) => res.status(401).json({ message: 'Not authenticated' }),
    notFound: (res, resource = 'Resource') => res.status(404).json({ message: `${resource} not found` }),
    forbidden: (res, message = 'Access forbidden') => res.status(403).json({ message }),
    badRequest: (res, message = 'Bad request') => res.status(400).json({ message }),
    serverError: (res, message = 'Internal server error') => res.status(500).json({ message }),
    insufficientCredits: (res, available, required) => res.status(403).json({ 
        message: `Insufficient credits. You have ${available} credits but need ${required}.`,
        hasEnoughCredits: false
    })
};

module.exports = {
    checkAndDowngradeExpiredPlan,
    refreshDailyCreditsIfNeeded,
    validateSettingsForPlan,
    consumeCredit,
    errorResponses
};

import { ADSENSE_CLIENT, ADSENSE_HOME_SLOT } from './config.js';

const AD_FILL_RETRY_MS = 100;
const AD_FILL_MAX_ATTEMPTS = 50;

export function initLandingAds() {
    if (!ADSENSE_CLIENT || !ADSENSE_HOME_SLOT) {
        return;
    }

    requestAdFill(0);
}

function requestAdFill(attempt) {
    const units = document.querySelectorAll('.adsbygoogle');
    if (!units.length) {
        return;
    }

    if (!window.adsbygoogle) {
        if (attempt >= AD_FILL_MAX_ATTEMPTS) {
            return;
        }

        window.setTimeout(() => requestAdFill(attempt + 1), AD_FILL_RETRY_MS);
        return;
    }

    units.forEach((unit) => {
        if (unit.dataset.adsenseRequested === 'true') {
            return;
        }

        unit.dataset.adsenseRequested = 'true';

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
            console.warn('AdSense failed to initialize:', error);
        }
    });
}

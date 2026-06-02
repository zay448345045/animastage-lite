const FIRST_RESULT_KEY = 'as_result_first_done';
const ONBOARDING_KEY = 'as_demo_bridge_dismissed';

export function shouldAutoLoadDemo(isViewer: boolean): boolean {
  if (isViewer) return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('demo')) return false;
  try {
    return localStorage.getItem(FIRST_RESULT_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markResultFirstDone(): void {
  try {
    localStorage.setItem(FIRST_RESULT_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function shouldShowOnboarding(isViewer: boolean): boolean {
  if (isViewer) return false;
  try {
    return localStorage.getItem(ONBOARDING_KEY) !== '1';
  } catch {
    return true;
  }
}

export function dismissOnboardingFlag(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * API Service Client for ISCMS Enterprise Backend
 */

export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch (err) {
    console.error('Health check failed:', err);
    return { status: 'error' };
  }
}

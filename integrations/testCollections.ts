export function validAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 100 && amount <= 10000000;
}

export function readLink(data: any, reference: string, amount: number) {
  if (data?.reference_id !== reference || data.amount !== amount || data.currency !== 'INR' ||
      !/^plink_[a-zA-Z0-9]+$/.test(data.id) || !['created','paid','expired','cancelled'].includes(data.status) ||
      (data.status === 'paid' && data.amount_paid !== amount)) throw new Error('Unverified provider response');
  const url = new URL(data.short_url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid checkout URL');
  return { id: data.id as string, status: data.status as string, url: url.href };
}

export function configured() {
  return Boolean(process.env.RAZORPAY_TEST_KEY_ID?.startsWith('rzp_test_') && process.env.RAZORPAY_TEST_KEY_SECRET);
}

export async function provider(path: string, body?: Record<string,unknown>) {
  if (!configured()) throw new Error('Test credentials unavailable');
  const token = Buffer.from(process.env.RAZORPAY_TEST_KEY_ID + ':' + process.env.RAZORPAY_TEST_KEY_SECRET).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/payment_links' + path, {
    method: body ? 'POST' : 'GET', headers: {Authorization: 'Basic ' + token, 'Content-Type':'application/json'},
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Provider request failed');
  return response.json();
}

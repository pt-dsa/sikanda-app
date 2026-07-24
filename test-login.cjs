async function run() {
  const url = 'https://script.google.com/macros/s/AKfycbyUXpR46U48_DgyXvLDWbqty38RrUvXPDPnY019WSrxHs9YDNxUvIFOLIYefpj-pVfW/exec';
  const req = async (body) => {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'text/plain' },
      redirect: 'follow'
    });
    return res.json();
  };

  const challenge = await req({ action: 'captcha_challenge', purpose: 'login', clientKey: 'curl-test-1234' });
  if (!challenge.ok) return console.log('Challenge failed', challenge);

  const proof = {
    challengeId: challenge.challengeId,
    position: challenge.target,
    elapsedMs: 2000,
    track: [10, 20, 30, challenge.target]
  };

  const login = await req({ action: 'auth_login', nip: '111111111111111111', password: 'IceTo152041gmail', captcha: proof, clientKey: 'curl-test-1234' });
  console.log('Login result:', login);
}
run();

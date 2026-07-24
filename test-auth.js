const crypto = require('crypto');
function credentialPassword_(nip, rawPassword, pepper) {
  const signature = crypto.createHmac("sha256", pepper)
    .update(String(rawPassword) + '\n' + String(nip))
    .digest();
  return signature.toString('base64url').replace(/=+$/g, '');
}
console.log("Derived:", credentialPassword_('111111111111111111', 'IceTo152041gmail', 'this_is_a_test_pepper_1234567890'));

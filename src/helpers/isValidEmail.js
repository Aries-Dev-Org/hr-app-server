module.exports.isValidEmail = (email) => {
  const provider = email.split('@');
  return provider[1] !== 'mail.com';
};

/**
 * Extracting the sub domain from the email id.
 * @param {string} email
 * @returns json
 */
const domainName = async (email) => {
  let domain = null;
  const pos = email.search('@'); // get position of domain
  if (pos > 0) {
    domain = email.slice(pos + 1); // use the slice method to get domain name, "+1" mean domain does not include "@"
  } else {
    return { status: false };
  }
  if (domain.includes('.in')) {
    domain = domain.replace('.in', '');
  } else if (domain.includes('.com')) {
    domain = domain.replace('.com', '');
  } else if (domain.includes('.co')) {
    domain = domain.replace('.co', '');
  } else if (domain.includes('.org')) {
    domain = domain.replace('.org', '');
  } else if (domain.includes('.net')) {
    domain = domain.replace('.net', '');
  }
  return { status: true, data: domain };
};

module.exports = { domainName };

const { permissions } = require('./permissions');

const verifyPermission = (user, permission) => {
  const isPermissionInProfile = (element) => {
    return element.permissions.some((p) => p === permissions[permission]);
  };
  return user.profiles.some(isPermissionInProfile);
};

module.exports = verifyPermission;

// Free Apple ID signing does not support push notifications. The app only uses local
// notifications, so drop the aps-environment entitlement added by expo-notifications (docs/SPEC.md §7).
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withFreeSigning(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });
};

// POST /api/account/delete — permanently delete the signed-in user
// (cancels Stripe subscription, then deletes auth row which cascades to
// profiles + graphs).
const { deleteAccountHandler } = require('../_lib/handlers');
module.exports = (req, res) => deleteAccountHandler(req, res);

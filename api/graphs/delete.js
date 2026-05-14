// POST /api/graphs/delete  — Body: { id: <clientId> }
const { deleteGraphHandler } = require('../_lib/handlers');
module.exports = (req, res) => deleteGraphHandler(req, res);

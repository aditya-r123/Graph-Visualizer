// GET  /api/graphs       — list the signed-in user's saved canvases
// POST /api/graphs       — upsert a batch of canvases
const { listGraphsHandler, upsertGraphsHandler, sendJson } = require('../_lib/handlers');

module.exports = (req, res) => {
    if (req.method === 'GET')  return listGraphsHandler(req, res);
    if (req.method === 'POST') return upsertGraphsHandler(req, res);
    return sendJson(res, 405, { error: 'method_not_allowed' });
};

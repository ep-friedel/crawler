const crypto = require('crypto');

module.exports = (secret, hashfield) => {
    let hmac = crypto.createHmac('SHA1', secret);

    return (req, res, next) => {
        if (req.body) {
            let hash = 'sha1=' + hmac.update(JSON.stringify(req.body)).digest('hex');

            if (req.get(hashfield) === hash) {
                next();
            } else {
                res.status(403).send();
            }
        } else {
            res.status(403).send();
        }
    }
}
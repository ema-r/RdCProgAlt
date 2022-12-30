//const db = require('/models');
const UserV2 = require('../models/userv2.model');

preventDuplicateKeyExceptions_uname = (req, res, next) => {
	UserV2.findOne({uname: req.body.uname}).exec((err, user) => {
		if (err) {
			res.status(500).send({message: err});
			return;}
		if (user) {
			res.status(400).send({message: "username gia in uso"});
			return;}
		next();
	})
}

preventDuplicateKeyExceptions_apiId = (req, res, next) => {
	return UserV2.findOne({api_id: req.body.api_id}, { limit: 1 }) //forse spostabile in index?
}

module.exports = {preventDuplicateKeyExceptions_apiId, preventDuplicateKeyExceptions_uname}

var crypto = require('crypto');

var challenges = [];
var challengeMax = 4294967296; // 2^32
var secret = 999999;

var openReq = {
	newChallenge : function() {
		/* Send new challenge */
		var challenge = Math.floor(Math.random()*challengeMax);
		console.log('Received request to open door. Sending challenge ' + challenge);

		challenges.push(challenge);

		return challenge;
	},
	testChallenge : function (challenge, answer) {
		var success = false;
		var n = challenges.indexOf(challenge);
		if(n != -1) {
			challenges.splice(n, 1);

			var shasum = crypto.createHash('sha1');
			shasum.update(challenge.toString());
			shasum.update(secret.toString());
			var correctAnswer = shasum.digest('hex');
			console.log("Expected answer " + correctAnswer + ", got answer " + answer);

			if(answer.toLowerCase() == correctAnswer.toLowerCase()) {
				success = true;
			}
		}

		if(success) {
			console.log("Challenge/response succesfull");
			if(this.onOpen) {
				this.onOpen();
			}
		} else {
			console.log("Challenge/response failed");
		}
		return success;
	},
	onOpen : null,
	setOnOpen : function(fn) {
		this.onOpen = fn;
	},
};

exports.openReq = openReq;


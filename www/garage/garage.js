
window.onload = function()
{
	garagesclient.connect();
}

var garagesclient = {

	challengeData: null,

	connect : function()
	{
		var self = this;

		var socket = io.connect();
		socket.on('connect', function() {
			/* don't do anything */
			$("#openclose").removeAttr("disabled")
				.bind('click', function() { garagesclient.open(); });
		});

		socket.on('update', function(data) { self.updateVariables(data); });

		socket.on('challenge', function(data) { self.challenge(data); });
		socket.on('openResult', function(data) { self.openResult(data); });
		self.socket = socket;
	},

	updateVariables: function(data) {

		if('msg' in data) {
			var msg = data.msg;
			$('#door_message').text(msg);
		}

		if('up' in data) {
			var up = data.up;
			var src = up ? "garage_large_open.png" : "garage_large_closed.png";
			$("#door_image").attr("src", src);
		}
	},

	open : function() {
		this.socket.emit('open');
	},

	challenge : function(data) {
		challengeData = data;

		$("#pinModal").reveal({
			animation: 'fade',
			open: function() { pinDialog.onOpen(); },
			closed: function() { pinDialog.onClose(); },
		});
	},

	answerChallenge: function(secret) {
		if(challengeData != null) {
			var data = challengeData;
			challengeData = null;

			var blurb = data.challenge + secret;
			var hash = CryptoJS.SHA1(blurb);
			var content = { challenge : data.challenge, answer: hash.toString() };
			this.socket.emit('answer', content);
		}
	},

	openResult : function(data) {
		console.log("Open results: " + JSON.stringify(data));
		var txt = data.success ? 'Command send' : 'Command failed';

		$("#result").text(txt).show().fadeOut(2000);
	},

};

var pinDialog = {
	ok: false,

	onOpen: function() {
		var self = this;
		this.ok = false;

		$("#pin_ok").bind('click', function() { self.onOk(); });
		$("#pin_form").bind('submit', function() { self.onOk(); return false; });
	},

	onOk: function() {
		this.ok = true;
        $("#pinModal").trigger( 'reveal:close' );
	},
	
	onClose: function() {
		$("#pin_ok").unbind('click');
		if(this.ok) {
			var pin = $("#pin").val();
			garagesclient.answerChallenge(pin);
		}
	},
};



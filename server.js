express = require('express');
var app = express();
var port = process.env.PORT || 4000
app.use('/', express.static('.'));
app.listen(port, null, function() {
	console.log('Server started: http://localhost:' + port);
});

var gulp = require('gulp');
var fs = require('fs');
var dox = require('./node_modules/dox/lib/dox');

gulp.task('readme', function() {
	var content = fs.readFileSync(__dirname + '/monetize.js', {
		encoding: 'utf8'
	});
	var result = '';
	dox.parseComments(content, {
		raw: true
	}).forEach(function(comment) {
		if(comment.ctx) {
			if(comment.ctx.type == 'property') {
				comment.ctx.string += '()';
			}
			result += '## ' + comment.ctx.string + '\n\n';
		}
		result += comment.description.full + '\n\n';
		var examples = comment.tags.filter(function(tag) {
			return tag.type == 'example';
		});
		if(examples.length) {
			result += '#### Example:\n\n';
			examples.map(function(param) {
				result += '```js\n' + param.string.trim() + '\n```\n\n';
			});
		}
		var params = comment.tags.filter(function(tag) {
			return tag.type == 'param';
		});
		if(params.length) {
			result += '#### Parameters:\n\n';
			params.map(function(param) {
				result += '- **' + param.name + '**: *' + param.types[0] + '*, ' + param.description + '\n\n';
			});
		}
	});
	fs.writeFileSync(__dirname + '/Readme.md', result);
});

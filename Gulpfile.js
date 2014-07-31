var gulp = require('gulp');
var fs = require('fs');
var dox = require('./node_modules/dox/lib/dox');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('default', function() {
	return gulp.src('monetize.js')
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(gulp.dest('.'));
});

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

var Promise = require('bluebird');
var knox = require('knox');
var zlib = require('zlib');
var util = require('gulp-util');
var git = require('gulp-git');
var fs = require('fs');

var s3Client = knox.createClient({
	key: process.env.AWS_ACCESS_KEY_ID,
	secret: process.env.AWS_SECRET_KEY,
	bucket: 'dock5-public'
});

function bumpTask(importance) {
	return function() {
		return gulp.src(['./package.json', './bower.json'])
			.pipe(plugins.bump({type: importance}))
			.pipe(gulp.dest('./'))
			.pipe(plugins.git.commit('bumps package version'));
	};
}


gulp.task('bump-patch', bumpTask('patch'));
gulp.task('tag', function() {
	var packageJson = JSON.parse(fs.readFileSync(__dirname + '/../package.json', {
		encoding: 'utf8'
	}));
	var tag = 'v' + packageJson.version;
	util.log('Tagging as: ' + plugins.util.colors.cyan(tag));
	git.tag(tag, 'Version ' + packageJson.version);
	git.push('origin', 'master', { args: ' --tags' }).end();
});


gulp.task('deploy-assets', function() {
	return glob('app-min/**', {
		mark: true,
		cwd: __dirname + '/../public'
	})
		.then(function(files) {
			return Promise.all(files.map(function(file) {
				if(file.slice(-1) == '/') {
					return;
				}
				var filePath = __dirname + '/../public/' + file;
				return magicDetectFile(filePath)
					.then(function(contentType) {
						return new Promise(function(resolve, reject) {
							var stream = fs.createReadStream(__dirname + '/../public/' + file);
							var contentEncoding;

							function zip() {
								var gzip = zlib.createGzip();
								stream = stream.pipe(gzip);
								contentEncoding = 'gzip';
							}

							if(file.slice(-3) == '.js') {
								zip();
								contentType = 'application/javascript';
							}
							if(file.slice(-4) == '.css') {
								zip();
								contentType = 'text/css';
							}
							var bufs = [];
							stream.on('data', function(d) {
								bufs.push(d);
							});
							stream.on('error', function(err) {
								reject(err);
							});
							stream.on('end', function() {
								var contentLength = bufs.reduce(function(sum, buf) {
									return sum + buf.length;
								}, 0);
								var headers = {
									'x-amz-acl': 'public-read',
									'Content-Length': contentLength,
									'Content-Type': contentType,
									'Cache-Control': 'max-age=3153600'
								};
								contentEncoding && (headers['Content-Encoding'] = contentEncoding);
								s3Client.putBuffer(Buffer.concat(bufs), file, headers, function(err, res) {
									res.pipe(process.stdout)
									err ? reject(err) : resolve(res);
								});
							});
						});
					});
			}));
		});
});
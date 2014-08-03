var gulp = require('gulp');
var fs = require('fs');
var dox = require('./node_modules/dox/lib/dox');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var Promise = require('bluebird');
var knox = require('knox');
var zlib = require('zlib');
var util = require('gulp-util');
var bump = require('gulp-bump');
var git = require('gulp-git');
var fs = require('fs');
var path = require('path');

var s3Client = knox.createClient({
	key: process.env.AWS_ACCESS_KEY_ID,
	secret: process.env.AWS_SECRET_KEY,
	bucket: 'dock5-public'
});
var putBuffer = Promise.promisify(s3Client.putBuffer, s3Client);


gulp.task('build', function() {
	return gulp.src('src/monetize.js')
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('dist/'));
});

gulp.task('readme', function() {
	var content = fs.readFileSync(__dirname + '/src/monetize.js', {
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
	var license = fs.readFileSync(__dirname + '/LICENSE', {
		encoding: 'utf8'
	});
	result += '## License\n\n' + license;
	fs.writeFileSync(__dirname + '/README.md', result);
});

gulp.task('default', [
	'build',
	'readme'
]);

function bumpTask(importance) {
	return function() {
		return gulp.src([
			'./package.json',
			'./bower.json'
		])
			.pipe(bump({type: importance}))
			.pipe(gulp.dest('./'))
			.pipe(git.commit('bumps package version'));
	};
}
gulp.task('bump', bumpTask('patch'));
gulp.task('bump-patch', bumpTask('patch'));
gulp.task('bump-minor', bumpTask('minor'));
gulp.task('bump-major', bumpTask('major'));

function getVersion() {
	return JSON.parse(fs.readFileSync(__dirname + '/package.json', {
		encoding: 'utf8'
	})).version;
}

gulp.task('tag', function() {
	var tag = 'v' + getVersion();
	util.log('Tagging as: ' + util.colors.cyan(tag));
	git.tag(tag, 'Version ' + getVersion());
	git.push('origin', 'master', { args: ' --tags' }).end();
});


gulp.task('deploy', function() {
	return Promise.all([
		'src/monetize.js',
		'dist/monetize.min.js'
	].map(function(file) {
			return new Promise(function(resolve, reject) {
				var stream = fs.createReadStream(path.join(__dirname, file));
				var gzip = zlib.createGzip();
				stream = stream.pipe(gzip);
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
					Promise.all([
						{
							path: 'api/js/latest',
							maxage: 86400
						},
						{
							path: 'api/js/' + getVersion(),
							maxage: 31536000
						}
					].map(function(dest) {
							return putBuffer(Buffer.concat(bufs), path.join(dest.path, path.basename(file)), {
								'x-amz-acl': 'public-read',
								'Content-Length': contentLength,
								'Content-Type': 'application/javascript',
								'Content-Encoding': 'gzip',
								'Cache-Control': 'max-age=' + dest.maxage
							});
						}))
						.then(resolve, reject);
				});
			});
		}));
});
var shell = require('shelljs');
var path = require('path');
var fs = require('fs');
var Handlebars = require('handlebars');
var compiledTemplate;
var downloadPage;
var links = [];
var DOWNLOAD_URL = 'http://download.dev.hyperionix.com/';
var DIST = '../../bin/win32/exe/ReleaseWIN32_x64/setup.exe';
var version = (shell.env['version'] && path.basename(shell.env['version'])) || 'none';
var UPLOAD_DIR = 'toUpload';

if (!shell.which('aws')) {
    shell.echo('Sorry, this script requires aws');
    shell.exit(1);
}

console.log('version: ', version);

shell.rm('-rf', UPLOAD_DIR);
shell.mkdir(UPLOAD_DIR);
shell.mkdir(UPLOAD_DIR + '/index');
shell.mkdir(UPLOAD_DIR + '/' + version);
shell.cp(DIST, UPLOAD_DIR + '/' + version);

// Read template
fs.readFile('download.handlebars', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    compiledTemplate = Handlebars.compile(data);

    // Get s3 bucket folders list
    shell.exec('aws s3 ls s3://download.dev.hyperionix.com', function (status, res) {
        var folders = res.split('\n');
        folders.forEach(function (folder) {
            var folderNormalized = folder.trim().split(' ')[1] && folder.trim().split(' ')[1].split('/')[0];
            if (folderNormalized && folderNormalized !== 'index') {
                links.push({
                    link: DOWNLOAD_URL + folderNormalized + '/setup.exe',
                    text: folderNormalized
                });
            }
        });
        // Add a new version
        links.push({
            link: DOWNLOAD_URL + version + '/setup.exe',
            text: version
        });
        downloadPage = compiledTemplate({
            downloadLinks: links
        });

        fs.writeFile(UPLOAD_DIR + '/index/download.html', downloadPage, function (err) {
            if (err) {
                return console.log(err);
            }
    
            console.log('The file was saved!');
            shell.exec('aws s3 sync ' + UPLOAD_DIR + ' s3://download.dev.hyperionix.com --acl public-read')
        });
    });
});
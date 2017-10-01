var shell = require('shelljs');
var fs = require('fs');
var Handlebars = require('handlebars');
var compiledTemplate;
var downloadPage;
var links = [];
var DOWNLOAD_URL = 'http://download.dev.hyperionix.com/';

if (!shell.which('aws')) {
    shell.echo('Sorry, this script requires aws');
    shell.exit(1);
}

shell.mkdir('build');
shell.mkdir('build/index');

fs.readFile('download.handlebars', 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    compiledTemplate = Handlebars.compile(data);
});

shell.exec('aws s3 ls s3://download.dev.hyperionix.com', function (status, res) {
    var folders = res.split('\n');
    folders.forEach(function (folder) {
        var folderNormalized = folder.trim().split(' ')[1].split('/')[0];
        console.log(folder, folderNormalized);
        if (folderNormalized !== 'index') {
            links.push({
                link: DOWNLOAD_URL + folderNormalized,
                text: folderNormalized
            });
        }
    });
    downloadPage = compiledTemplate({
        downloadLinks: links
    });
});

setTimeout(function () {
    fs.writeFile('build/index/download.html', downloadPage, function (err) {
        if (err) {
            return console.log(err);
        }
    
        console.log('The file was saved!');
        shell.exec('aws s3 sync ./build s3://download.dev.hyperionix.com --acl public-read')
    });
}, 5000);

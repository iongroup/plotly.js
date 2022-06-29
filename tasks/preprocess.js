var fs = require('fs-extra');
var sass = require('node-sass');
var process = require('process');
var constants = require('./util/constants');
var common = require('./util/common');
var pullCSS = require('./util/pull_css');
var updateVersion = require('./util/update_version');

// main
makeBuildCSS();
copyTopojsonFiles();
updateVersion(constants.pathToPlotlyVersion);

// convert scss to css to js
function makeBuildCSS() {
    sass.render({
        file: constants.pathToSCSS,
        outputStyle: 'compressed'
    }, function(err, result) {
        if(err) throw err;

        var cspNoInlineStyle = process.env.npm_config_cspNoInlineStyle;
        var pathToCSS = process.env.npm_config_pathToCSS || 'plot-csp.css';
        if(cspNoInlineStyle) {
            // if csp no inline style then build css file to include at path relative to dist folder
            fs.writeFile(constants.pathToDist + pathToCSS, String(result.css), function(err) {
                if(err) throw err;
            });
        } else {
            // css to js
            pullCSS(String(result.css), constants.pathToCSSBuild);
        }
    });
}

// copy topojson files from sane-topojson to dist/
function copyTopojsonFiles() {
    fs.copy(
        constants.pathToTopojsonSrc,
        constants.pathToTopojsonDist,
        { clobber: true },
        common.throwOnError
    );
}

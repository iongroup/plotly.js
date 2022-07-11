var fs = require('fs-extra');
var sass = require('node-sass');
var process = require('process');
var constants = require('./util/constants');
var mapBoxGLStyleRules = require('./../src/plots/mapbox/constants').styleRules;
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
            var staticCSS = String(result.css);
            for(var k in mapBoxGLStyleRules) {
                staticCSS = addAdditionalCSSRules(staticCSS, '.js-plotly-plot .plotly .mapboxgl-' + k, mapBoxGLStyleRules[k]);
            }

            // if csp no inline style then build css file to include at path relative to dist folder
            fs.writeFile(constants.pathToDist + pathToCSS, staticCSS, function(err) {
                if(err) throw err;
            });

            // use plotcss.js to set global cspNoInlineStyle as true
            var outStr = ['\'use strict\';',
                '',
                'var Lib = require(\'../src/lib\');',
                'Lib.cspNoInlineStyle = true;',
                ''].join('\n');

            fs.writeFile(constants.pathToCSSBuild, outStr, function(err) {
                if(err) throw err;
            });
        } else {
            // css to js
            pullCSS(String(result.css), constants.pathToCSSBuild);
        }
    });
}

function addAdditionalCSSRules(staticStyleString, selector, style) {
    return staticStyleString + selector + '{' + style + '}';
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

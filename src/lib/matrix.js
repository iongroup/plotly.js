/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


exports.init2dArray = function(rowLength, colLength) {
    var array = new Array(rowLength);
    for(var i = 0; i < rowLength; i++) array[i] = new Array(colLength);
    return array;
};

/**
 * transpose a (possibly ragged) 2d array z. inspired by
 * http://stackoverflow.com/questions/17428587/
 * transposing-a-2d-array-in-javascript
 */
exports.transposeRagged = function(z) {
    var maxlen = 0;
    var zlen = z.length;
    var i, j;
    // Maximum row length:
    for(i = 0; i < zlen; i++) maxlen = Math.max(maxlen, z[i].length);

    var t = new Array(maxlen);
    for(i = 0; i < maxlen; i++) {
        t[i] = new Array(zlen);
        for(j = 0; j < zlen; j++) t[i][j] = z[j][i];
    }

    return t;
};

// our own dot function so that we don't need to include numeric
exports.dot = function(x, y) {
    if(!(x.length && y.length) || x.length !== y.length) return null;

    var len = x.length;
    var out;
    var i;

    if(x[0].length) {
        // mat-vec or mat-mat
        out = new Array(len);
        for(i = 0; i < len; i++) out[i] = exports.dot(x[i], y);
    } else if(y[0].length) {
        // vec-mat
        var yTranspose = exports.transposeRagged(y);
        out = new Array(yTranspose.length);
        for(i = 0; i < yTranspose.length; i++) out[i] = exports.dot(x, yTranspose[i]);
    } else {
        // vec-vec
        out = 0;
        for(i = 0; i < len; i++) out += x[i] * y[i];
    }

    return out;
};

// translate by (x,y)
exports.translationMatrix = function(x, y) {
    return [[1, 0, x], [0, 1, y], [0, 0, 1]];
};

// rotate by alpha around (0,0)
exports.rotationMatrix = function(alpha) {
    var a = alpha * Math.PI / 180;
    return [[Math.cos(a), -Math.sin(a), 0],
            [Math.sin(a), Math.cos(a), 0],
            [0, 0, 1]];
};

// rotate by alpha around (x,y)
exports.rotationXYMatrix = function(a, x, y) {
    return exports.dot(
        exports.dot(exports.translationMatrix(x, y),
                    exports.rotationMatrix(a)),
        exports.translationMatrix(-x, -y));
};

// applies a 2D transformation matrix to either x and y params or an [x,y] array
exports.apply2DTransform = function(transform) {
    return function() {
        var args = arguments;
        if(args.length === 3) {
            args = args[0];
        } // from map
        var xy = arguments.length === 1 ? args[0] : [args[0], args[1]];
        return exports.dot(transform, [xy[0], xy[1], 1]).slice(0, 2);
    };
};

// applies a 2D transformation matrix to an [x1,y1,x2,y2] array (to transform a segment)
exports.apply2DTransform2 = function(transform) {
    var at = exports.apply2DTransform(transform);
    return function(xys) {
        return at(xys.slice(0, 2)).concat(at(xys.slice(2, 4)));
    };
};

// converts a 2x3 css transform matrix, represented as a length 6 array, to a 3x3 matrix.
exports.convertCssMatrix = function(m) {
    if(m.length !== 6) {
        throw new Error('Css transform matrix not of length 6');
    }

    return [
        [m[0], m[2], m[4]],
        [m[1], m[3], m[5]],
        [0, 0, 1]
    ];
};

// find the inverse for a 3x3 affine transform matrix
exports.inverseTransformMatrix = function(m) {
    var determinant = m[0][0] * m[1][1] - m[1][0] * m[0][1];
    if(Math.abs(determinant) < Number.EPSILON) {
        throw new Error('Matrix is singular');
    }

    var inv = 1.0 / determinant;
    var invTranslateX = inv * (-m[1][1] * m[0][2] + m[0][1] * m[1][2]);
    var invTranslateY = inv * (m[1][0] * m[0][2] + -m[0][0] * m[1][2]);
    return [
        [inv * m[1][1], inv * -m[0][1], invTranslateX],
        [inv * -m[1][0], inv * m[0][0], invTranslateY],
        [0, 0, 1]
    ];
};

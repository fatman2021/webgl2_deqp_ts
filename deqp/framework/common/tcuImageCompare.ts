/// <reference path="../../typings/reference.d.ts" />
/*-------------------------------------------------------------------------
 * drawElements Quality Program OpenGL ES Utilities
 * ------------------------------------------------
 *
 * Copyright 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';

import tcuSurface = require('framework/common/tcuSurface');
import deMath = require('framework/delibs/debase/deMath');
import tcuTexture = require('framework/common/tcuTexture');

export enum CompareLogMode {
    EVERYTHING,
    RESULT,
    ON_ERROR
}

function displayResultPane(id: string, width: number, height: number): CanvasRenderingContext2D[] {
    var i = displayResultPane.counter++;
    var elem = document.getElementById(id);
    var span = document.createElement('span');
    elem.appendChild(span);
    span.innerHTML = '<table><tr><td>Result</td><td>Reference</td><td>Error mask</td></tr>' +
    '<tr><td><canvas id="result' + i + '" width=' + width + ' height=' + height + '</td><td><canvas id="reference' + i + '" width=' + width + ' height=' + height + '</td><td><canvas id="diff' + i + '" width=' + width + ' height=' + height + '</td>' +
    '</table>';
    var canvasResult = <HTMLCanvasElement>document.getElementById('result' + i);
    var ctxResult = canvasResult.getContext('2d');
    var canvasRef = <HTMLCanvasElement>document.getElementById('reference' + i);
    var ctxRef = canvasRef.getContext('2d');
    var canvasDiff = <HTMLCanvasElement>document.getElementById('diff' + i);
    var ctxDiff = canvasDiff.getContext('2d');
    return [ctxResult, ctxRef, ctxDiff];
}

module displayResultPane {
    export var counter: number = 0;
}

function displayImages(result: tcuTexture.ConstPixelBufferAccess,
                       reference: tcuTexture.ConstPixelBufferAccess,
                       diff: tcuTexture.ConstPixelBufferAccess) {
    function createImage(ctx, src) {
        var w = src.getWidth();
        var h = src.getHeight();
        var imgData = ctx.createImageData(w, h);
        var index = 0;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var pixel = src.getPixelInt(x, y, 0);
                for (var i = 0; i < 4; i++) {
                    imgData.data[index] = pixel[i];
                    index = index + 1;
                }
            }
        }
        return imgData;
    }
    var w = result.getWidth();
    var h = result.getHeight();

    var contexts = displayResultPane('console', w, h);
    contexts[0].putImageData(createImage(contexts[0], result), 0, 0);
    contexts[1].putImageData(createImage(contexts[1], reference), 0, 0);
    if (diff)
        contexts[2].putImageData(createImage(contexts[2], diff), 0, 0);
}

/*--------------------------------------------------------------------*//*!
 * \brief Per-pixel threshold-based comparison
 *
 * This compare computes per-pixel differences between result and reference
 * image. Comparison fails if any pixels exceed the given threshold value.
 *
 * This comparison can be used for integer- and fixed-point texture formats.
 * Difference is computed in integer space.
 *
 * On failure error image is generated that shows where the failing pixels
 * are.
 *
 * \param log            Test log for results
 * \param imageSetName    Name for image set when logging results
 * \param imageSetDesc    Description for image set
 * \param reference        Reference image
 * \param result        Result image
 * \param threshold        Maximum allowed difference
 * \param logMode        Logging mode
 * \return true if comparison passes, false otherwise
 *//*--------------------------------------------------------------------*/
export function intThresholdCompare(imageSetName: string,
                                    imageSetDesc: string,
                                    reference: tcuTexture.ConstPixelBufferAccess,
                                    result: tcuTexture.ConstPixelBufferAccess,
                                    /*const UVec4&*/ threshold,
                                    logMode: CompareLogMode) {
    var width = reference.getWidth();
    var height = reference.getHeight();
    var depth = reference.getDepth();
    var errorMask = new tcuSurface.Surface(width, height);

    var maxDiff = [0, 0, 0, 0];
    var pixelBias = [0, 0, 0, 0];
    var pixelScale = [1, 1, 1, 1];

    assertMsgOptions(result.getWidth() == width &&
                     result.getHeight() == height &&
                     result.getDepth() == depth,
                     'Reference and result images have different dimensions', false, true);

    for (var z = 0; z < depth; z++) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var refPix = reference.getPixelInt(x, y, z);
                var cmpPix = result.getPixelInt(x, y, z);

                var diff = deMath.absDiff(refPix, cmpPix);
                var isOk = deMath.boolAll(deMath.lessThanEqual(diff, threshold));

                maxDiff = deMath.max(maxDiff, diff);
                var color = [0, 255, 0, 255];
                if (!isOk)
                    color = [255, 0, 0, 255];
                errorMask.setPixel(x, y, color);
            }
        }
    }

    var compareOk = deMath.boolAll(deMath.lessThanEqual(maxDiff, threshold));

    if (!compareOk) {
        debug('Image comparison failed: max difference = ' + maxDiff + ', threshold = ' + threshold);
        displayImages(result, reference, errorMask.getAccess());
    }

    return compareOk;
};

/** floatUlpThresholdCompare
 * @param {string} imageSetName
 * @param {string} imageSetDesc
 * @param {tcuTexture.ConstPixelBufferAccess} reference
 * @param {tcuTexture.ConstPixelBufferAccess} result
 * @param {Uint32Array} threshold
 * @return {boolean}
 */
export var floatUlpThresholdCompare = function (imageSetName, imageSetDesc, reference, result, threshold) {
    var width = reference.getWidth();
    var height = reference.getHeight();
    var depth = reference.getDepth();

    var errorMaskStorage = new tcuTexture.TextureLevel(
        new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGB, tcuTexture.ChannelType.UNORM_INT8), width, height, depth); // TODO: implement tcuTexture.TextureLevel
    var errorMask: tcuTexture.PixelBufferAccess = errorMaskStorage.getAccessW(); // TODO: implement getAccess() in tcuTexture.TextureLevel
    var maxDiff: Uint32Array = new Uint32Array([0, 0, 0, 0]); // UVec4
    var pixelBias: Float32Array = new Float32Array([0.0, 0.0, 0.0, 0.0]); // Vec4
    var pixelScale: Float32Array = new Float32Array([1.0, 1.0, 1.0, 1.0]); // Vec4

    // TODO: TCU_CHECK(result.getWidth() == width && result.getHeight() == height && result.getDepth() == depth);

    for (var z = 0; z < depth; z++) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var refPix: Float32Array = reference.getPixel(x, y, z); // Vec4
                var cmpPix: Float32Array = result.getPixel(x, y, z); // Vec4
                var refBits = new Uint32Array(refPix.buffer, refPix.byteOffset, refPix.byteLength); // UVec4
                var cmpBits = new Uint32Array(cmpPix.buffer, cmpPix.byteOffset, cmpPix.byteLength); // UVec4

                var diff: Uint32Array = new Uint32Array(4); // UVec4
                for (var x = 0; x < refPix.length; x++) {
                    diff[x] = Math.abs(refBits[x] - cmpBits[x]); // Math.floor to convert into int
                }
                var isOk: boolean = deMath.boolAll(deMath.lessThanEqual(diff, threshold));

                maxDiff = deMath.max(maxDiff, diff);

                errorMask.setPixel(isOk ? new Float32Array([0.0, 1.0, 0.0, 1.0]) : new Float32Array([1.0, 0.0, 0.0, 1.0]), x, y, z);
            }
        }
    }

    var compareOk: boolean = deMath.boolAll(deMath.lessThanEqual(maxDiff, threshold));

    if (!compareOk) {
        debug('Image comparison failed: max difference = ' + maxDiff + ', threshold = ' + threshold);
        displayImages(result, reference, errorMask);
    }

    /*if (!compareOk || logMode == COMPARE_LOG_EVERYTHING)
     {
     // All formats except normalized unsigned fixed point ones need remapping in order to fit into unorm channels in logged images.
     if (tcu::getTextureChannelClass(reference.getFormat().type) != tcu::TEXTURECHANNELCLASS_UNSIGNED_FIXED_POINT ||
     tcu::getTextureChannelClass(result.getFormat().type)    != tcu::TEXTURECHANNELCLASS_UNSIGNED_FIXED_POINT)
     {
     computeScaleAndBias(reference, result, pixelScale, pixelBias);
     log << TestLog::Message << "Result and reference images are normalized with formula p * " << pixelScale << " + " << pixelBias << TestLog::EndMessage;
     }

     if (!compareOk)
     log << TestLog::Message << "Image comparison failed: max difference = " << maxDiff << ", threshold = " << threshold << TestLog::EndMessage;

     log << TestLog::ImageSet(imageSetName, imageSetDesc)
     << TestLog::Image("Result",     "Result",       result,     pixelScale, pixelBias)
     << TestLog::Image("Reference",  "Reference",    reference,  pixelScale, pixelBias)
     << TestLog::Image("ErrorMask",  "Error mask",   errorMask)
     << TestLog::EndImageSet;
     }
     else if (logMode == COMPARE_LOG_RESULT)
     {
     if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
     computePixelScaleBias(result, pixelScale, pixelBias);

     log << TestLog::ImageSet(imageSetName, imageSetDesc)
     << TestLog::Image("Result",     "Result",       result,     pixelScale, pixelBias)
     << TestLog::EndImageSet;
     }*/

    return compareOk;
};

/** floatThresholdCompare
 * @param {string} imageSetName
 * @param {string} imageSetDesc
 * @param {tcuTexture.ConstPixelBufferAccess} reference
 * @param {tcuTexture.ConstPixelBufferAccess} result
 * @param {Uint32Array} threshold
 * @return {boolean}
 */
export function floatThresholdCompare(imageSetName:string,
                                      imageSetDesc:string,
                                      reference: tcuTexture.ConstPixelBufferAccess,
                                      result: tcuTexture.ConstPixelBufferAccess,
                                      threshold: ArrayLike<number>) {
    var width = result.getWidth();
    var height = result.getHeight();
    var depth = result.getDepth();

    var errorMaskStorage = new tcuTexture.TextureLevel(
        new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGB, tcuTexture.ChannelType.UNORM_INT8), width, height, depth
    );
    var errorMask: tcuTexture.PixelBufferAccess = errorMaskStorage.getAccessW();
    var maxDiff:Float32Array = new Float32Array([0.0, 0.0, 0.0, 0.0]); // Vec4
    var pixelBias: Float32Array = new Float32Array([0.0, 0.0, 0.0, 0.0]); // Vec4
    var pixelScale: Float32Array = new Float32Array([1.0, 1.0, 1.0, 1.0]); // Vec4

    for (var z = 0; z < depth; z++) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var refPix = reference.getPixel(x, y, z);
                var cmpPix = result.getPixel(x, y, z); // Vec4

                var diff = deMath.absDiff(refPix, cmpPix);
                var isOk = deMath.boolAll(deMath.lessThanEqual(diff, threshold));

                maxDiff = deMath.max(maxDiff, diff);

                var color = [0, 1, 0, 1];
                if (!isOk)
                    color = [1, 0, 0, 1];
                errorMask.setPixel(color, x, y, z);
            }
        }
    }

    var compareOk: boolean = deMath.boolAll(deMath.lessThanEqual(maxDiff, threshold));

    if (!compareOk) {
        debug('Image comparison failed: max difference = ' + maxDiff + ', threshold = ' + threshold);
        displayImages(result, reference, errorMask);
    }

    /*if (!compareOk || logMode == COMPARE_LOG_EVERYTHING)
     {
     // All formats except normalized unsigned fixed point ones need remapping in order to fit into unorm channels in logged images.
     if (tcu::getTextureChannelClass(result.getFormat().type) != tcu::TEXTURECHANNELCLASS_UNSIGNED_FIXED_POINT)
     {
     computeScaleAndBias(result, result, pixelScale, pixelBias);
     log << TestLog::Message << "Result image is normalized with formula p * " << pixelScale << " + " << pixelBias << TestLog::EndMessage;
     }

     if (!compareOk)
     log << TestLog::Message << "Image comparison failed: max difference = " << maxDiff << ", threshold = " << threshold << ", reference = " << reference << TestLog::EndMessage;

     log << TestLog::ImageSet(imageSetName, imageSetDesc)
     << TestLog::Image("Result",     "Result",       result,     pixelScale, pixelBias)
     << TestLog::Image("ErrorMask",  "Error mask",   errorMask)
     << TestLog::EndImageSet;
     }
     else if (logMode == COMPARE_LOG_RESULT)
     {
     if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
     computePixelScaleBias(result, pixelScale, pixelBias);

     log << TestLog::ImageSet(imageSetName, imageSetDesc)
     << TestLog::Image("Result",     "Result",       result,     pixelScale, pixelBias)
     << TestLog::EndImageSet;
     }*/

    return compareOk;
};

/*--------------------------------------------------------------------*//*!
 * \brief Per-pixel threshold-based comparison
 *
 * This compare computes per-pixel differences between result and reference
 * image. Comparison fails if any pixels exceed the given threshold value.
 *
 * On failure error image is generated that shows where the failing pixels
 * are.
 *
 * \param log            Test log for results
 * \param imageSetName    Name for image set when logging results
 * \param imageSetDesc    Description for image set
 * \param reference        Reference image
 * \param result        Result image
 * \param threshold        Maximum allowed difference
 * \param logMode        Logging mode
 * \return true if comparison passes, false otherwise
 *//*--------------------------------------------------------------------*/
export var pixelThresholdCompare = function (/*const char* */imageSetName, /*const char* */imageSetDesc, /*const Surface&*/ reference, /*const Surface&*/ result, /*const RGBA&*/ threshold, /*CompareLogMode*/ logMode):boolean {
    return intThresholdCompare(imageSetName, imageSetDesc, reference.getAccess(), result.getAccess(), threshold, logMode);
};
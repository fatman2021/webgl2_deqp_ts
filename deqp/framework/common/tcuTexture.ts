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

import deMath = require('framework/delibs/debase/deMath');
import tcuFloat = require('framework/common/tcuFloat');

var DE_ASSERT = function (x) {
    if (!x)
        throw new Error('Assert failed');
};

/**
 * Texture channel order
 * @enum
 */
export enum ChannelOrder {
    R,
    A,
    I,
    L,
    LA,
    RG,
    RA,
    RGB,
    RGBA,
    ARGB,
    BGRA,

    sRGB,
    sRGBA,

    D,
    S,
    DS
}

/**
 * Texture channel type
 * @enum
 */
export enum ChannelType {
    SNORM_INT8,
    SNORM_INT16,
    SNORM_INT32,
    UNORM_INT8,
    UNORM_INT16,
    UNORM_INT32,
    UNORM_SHORT_565,
    UNORM_SHORT_555,
    UNORM_SHORT_4444,
    UNORM_SHORT_5551,
    UNORM_INT_101010,
    UNORM_INT_1010102_REV,
    UNSIGNED_INT_1010102_REV,
    UNSIGNED_INT_11F_11F_10F_REV,
    UNSIGNED_INT_999_E5_REV,
    UNSIGNED_INT_24_8,
    SIGNED_INT8,
    SIGNED_INT16,
    SIGNED_INT32,
    UNSIGNED_INT8,
    UNSIGNED_INT16,
    UNSIGNED_INT32,
    HALF_FLOAT,
    FLOAT,
    FLOAT_UNSIGNED_INT_24_8_REV
}

/**
 * Construct texture format
 * @param {ChannelOrder} order
 * @param {ChannelType} type
 *
 * @constructor
 */
export class TextureFormat {
    constructor(public order:ChannelOrder, public type:ChannelType) {
    }

    /**
     * Compare two formats
     * @param {TextureFormat} format Format to compare with
     * @return {boolean}
     */
    isEqual(format:TextureFormat):boolean {
        return this.order === format.order && this.type === format.type;
    }

    /**
     * @return {Number} pixel size in bytes
     */
    getPixelSize() {
        if (this.type == null || this.order == null) {
            // Invalid/empty format.
            return 0;
        }
        else if (this.type == ChannelType.UNORM_SHORT_565 ||
            this.type == ChannelType.UNORM_SHORT_555 ||
            this.type == ChannelType.UNORM_SHORT_4444 ||
            this.type == ChannelType.UNORM_SHORT_5551) {
            DE_ASSERT(this.order == ChannelOrder.RGB || this.order == ChannelOrder.RGBA);
            return 2;
        }
        else if (this.type == ChannelType.UNORM_INT_101010 ||
            this.type == ChannelType.UNSIGNED_INT_999_E5_REV ||
            this.type == ChannelType.UNSIGNED_INT_11F_11F_10F_REV) {
            DE_ASSERT(this.order == ChannelOrder.RGB);
            return 4;
        }
        else if (this.type == ChannelType.UNORM_INT_1010102_REV ||
            this.type == ChannelType.UNSIGNED_INT_1010102_REV) {
            DE_ASSERT(this.order == ChannelOrder.RGBA);
            return 4;
        }
        else if (this.type == ChannelType.UNSIGNED_INT_24_8) {
            DE_ASSERT(this.order == ChannelOrder.D || this.order == ChannelOrder.DS);
            return 4;
        }
        else if (this.type == ChannelType.FLOAT_UNSIGNED_INT_24_8_REV) {
            DE_ASSERT(this.order == ChannelOrder.DS);
            return 8;
        }
        else {
            var numChannels;
            var channelSize;

            switch (this.order) {
                case ChannelOrder.R:
                    numChannels = 1;
                    break;
                case ChannelOrder.A:
                    numChannels = 1;
                    break;
                case ChannelOrder.I:
                    numChannels = 1;
                    break;
                case ChannelOrder.L:
                    numChannels = 1;
                    break;
                case ChannelOrder.LA:
                    numChannels = 2;
                    break;
                case ChannelOrder.RG:
                    numChannels = 2;
                    break;
                case ChannelOrder.RA:
                    numChannels = 2;
                    break;
                case ChannelOrder.RGB:
                    numChannels = 3;
                    break;
                case ChannelOrder.RGBA:
                    numChannels = 4;
                    break;
                case ChannelOrder.ARGB:
                    numChannels = 4;
                    break;
                case ChannelOrder.BGRA:
                    numChannels = 4;
                    break;
                case ChannelOrder.sRGB:
                    numChannels = 3;
                    break;
                case ChannelOrder.sRGBA:
                    numChannels = 4;
                    break;
                case ChannelOrder.D:
                    numChannels = 1;
                    break;
                case ChannelOrder.S:
                    numChannels = 1;
                    break;
                case ChannelOrder.DS:
                    numChannels = 2;
                    break;
                default:
                    DE_ASSERT(false);
            }

            switch (this.type) {
                case ChannelType.SNORM_INT8:
                    channelSize = 1;
                    break;
                case ChannelType.SNORM_INT16:
                    channelSize = 2;
                    break;
                case ChannelType.SNORM_INT32:
                    channelSize = 4;
                    break;
                case ChannelType.UNORM_INT8:
                    channelSize = 1;
                    break;
                case ChannelType.UNORM_INT16:
                    channelSize = 2;
                    break;
                case ChannelType.UNORM_INT32:
                    channelSize = 4;
                    break;
                case ChannelType.SIGNED_INT8:
                    channelSize = 1;
                    break;
                case ChannelType.SIGNED_INT16:
                    channelSize = 2;
                    break;
                case ChannelType.SIGNED_INT32:
                    channelSize = 4;
                    break;
                case ChannelType.UNSIGNED_INT8:
                    channelSize = 1;
                    break;
                case ChannelType.UNSIGNED_INT16:
                    channelSize = 2;
                    break;
                case ChannelType.UNSIGNED_INT32:
                    channelSize = 4;
                    break;
                case ChannelType.HALF_FLOAT:
                    channelSize = 2;
                    break;
                case ChannelType.FLOAT:
                    channelSize = 4;
                    break;
                default:
                    DE_ASSERT(false);
            }

            return numChannels * channelSize;
        }
    }
}

/**
 * Is format sRGB?
 * @param {TextureFormat} format
 * @return {boolean}
 */
function isSRGB(format:TextureFormat):boolean {
    return format.order === ChannelOrder.sRGB || format.order === ChannelOrder.sRGBA;
}

/**
 * Get TypedArray type that can be used to access texture.
 * @param {ChannelType} type
 * @return {TypedArray} TypedArray that supports the channel type.
 */
function getTypedArray(type:ChannelType) {
    switch (type) {
        case ChannelType.SNORM_INT8:
            return Int8Array;
        case ChannelType.SNORM_INT16:
            return Int16Array;
        case ChannelType.SNORM_INT32:
            return Int32Array;
        case ChannelType.UNORM_INT8:
            return Uint8Array;
        case ChannelType.UNORM_INT16:
            return Uint16Array;
        case ChannelType.UNORM_INT32:
            return Uint32Array;
        case ChannelType.UNORM_SHORT_565:
            return Uint16Array;
        case ChannelType.UNORM_SHORT_555:
            return Uint16Array;
        case ChannelType.UNORM_SHORT_4444:
            return Uint16Array;
        case ChannelType.UNORM_SHORT_5551:
            return Uint16Array;
        case ChannelType.UNORM_INT_101010:
            return Uint32Array;
        case ChannelType.UNORM_INT_1010102_REV:
            return Uint32Array;
        case ChannelType.UNSIGNED_INT_1010102_REV:
            return Uint32Array;
        case ChannelType.UNSIGNED_INT_11F_11F_10F_REV:
            return Uint32Array;
        case ChannelType.UNSIGNED_INT_999_E5_REV:
            return Uint32Array;
        case ChannelType.UNSIGNED_INT_24_8:
            return Uint32Array;
        case ChannelType.FLOAT:
            return Float32Array;
        case ChannelType.SIGNED_INT8:
            return Int8Array;
        case ChannelType.SIGNED_INT16:
            return Int16Array;
        case ChannelType.SIGNED_INT32:
            return Int32Array;
        case ChannelType.UNSIGNED_INT8:
            return Uint8Array;
        case ChannelType.UNSIGNED_INT16:
            return Uint16Array;
        case ChannelType.UNSIGNED_INT32:
            return Uint32Array;
        case ChannelType.HALF_FLOAT:
            return Uint16Array;
        case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV:
            return Float32Array; /* this type is a special case */
    }

    throw new Error('Unrecognized type ' + type);
}

/**
 * @enum
 */
export enum CubeFace {
    CUBEFACE_NEGATIVE_X,
    CUBEFACE_POSITIVE_X,
    CUBEFACE_NEGATIVE_Y,
    CUBEFACE_POSITIVE_Y,
    CUBEFACE_NEGATIVE_Z,
    CUBEFACE_POSITIVE_Z,
    TOTAL_FACES
}

/**
 * Renamed from ArrayBuffer due to name clash
 * Wraps ArrayBuffer.
 * @constructor
 */
export class DeqpArrayBuffer {
    m_ptr:ArrayBuffer = null;

    constructor(numElements?:number) {
        if (numElements)
            this.m_ptr = new ArrayBuffer(numElements);
    }

    /**
     * Set array size
     * @param {Number} numElements Size in bytes
     */
    setStorage(numElements:number):void {
        this.m_ptr = new ArrayBuffer(numElements);
    }

    /**
     * @return {Number} Buffer size
     */
    size():number {
        if (this.m_ptr)
            return this.m_ptr.byteLength;

        return 0;
    }

    /**
     * Is the buffer empty (zero size)?
     * @return {boolean}
     */
    empty():boolean {
        if (!this.m_ptr)
            return true;
        return this.size() == 0;
    }
}

/*
 * @enum
 * The values are negative to avoid conflict with channels 0 - 3
 */
enum channel {
    ZERO = -1,
    ONE = -2
}

/**
 * @param {ChannelOrder} order
 * @return {Array<Number|channel>}
 */
function getChannelReadMap(order:ChannelOrder):number[] {
    switch (order) {
        /*static const Channel INV[]    = { channel.ZERO,    channel.ZERO,    channel.ZERO,    channel.ONE }; */

        case ChannelOrder.R:
            return [0, channel.ZERO, channel.ZERO, channel.ONE];
        case ChannelOrder.A:
            return [channel.ZERO, channel.ZERO, channel.ZERO, 0];
        case ChannelOrder.I:
            return [0, 0, 0, 0];
        case ChannelOrder.L:
            return [0, 0, 0, channel.ONE];
        case ChannelOrder.LA:
            return [0, 0, 0, 1];
        case ChannelOrder.RG:
            return [0, 1, channel.ZERO, channel.ONE];
        case ChannelOrder.RA:
            return [0, channel.ZERO, channel.ZERO, 1];
        case ChannelOrder.RGB:
            return [0, 1, 2, channel.ONE];
        case ChannelOrder.RGBA:
            return [0, 1, 2, 3];
        case ChannelOrder.BGRA:
            return [2, 1, 0, 3];
        case ChannelOrder.ARGB:
            return [1, 2, 3, 0];
        case ChannelOrder.sRGB:
            return [0, 1, 2, channel.ONE];
        case ChannelOrder.sRGBA:
            return [0, 1, 2, 3];
        case ChannelOrder.D:
            return [0, channel.ZERO, channel.ZERO, channel.ONE];
        case ChannelOrder.S:
            return [channel.ZERO, channel.ZERO, channel.ZERO, 0];
        case ChannelOrder.DS:
            return [0, channel.ZERO, channel.ZERO, 1];
    }

    throw new Error('Unrecognized order ' + order);
}

/**
 * @param {ChannelOrder} order
 * @return {Array<Number>}
 */
function getChannelWriteMap(order:ChannelOrder):number[] {
    switch (order) {
        case ChannelOrder.R:
            return [0];
        case ChannelOrder.A:
            return [3];
        case ChannelOrder.I:
            return [0];
        case ChannelOrder.L:
            return [0];
        case ChannelOrder.LA:
            return [0, 3];
        case ChannelOrder.RG:
            return [0, 1];
        case ChannelOrder.RA:
            return [0, 3];
        case ChannelOrder.RGB:
            return [0, 1, 2];
        case ChannelOrder.RGBA:
            return [0, 1, 2, 3];
        case ChannelOrder.ARGB:
            return [3, 0, 1, 2];
        case ChannelOrder.BGRA:
            return [2, 1, 0, 3];
        case ChannelOrder.sRGB:
            return [0, 1, 2];
        case ChannelOrder.sRGBA:
            return [0, 1, 2, 3];
        case ChannelOrder.D:
            return [0];
        case ChannelOrder.S:
            return [3];
        case ChannelOrder.DS:
            return [0, 3];
    }
    throw new Error('Unrecognized order ' + order);
}

/**
 * @param {ChannelType} type
 * @return {Number}
 */
function getChannelSize(type:ChannelType):number {
    switch (type) {
        case ChannelType.SNORM_INT8:
            return 1;
        case ChannelType.SNORM_INT16:
            return 2;
        case ChannelType.SNORM_INT32:
            return 4;
        case ChannelType.UNORM_INT8:
            return 1;
        case ChannelType.UNORM_INT16:
            return 2;
        case ChannelType.UNORM_INT32:
            return 4;
        case ChannelType.SIGNED_INT8:
            return 1;
        case ChannelType.SIGNED_INT16:
            return 2;
        case ChannelType.SIGNED_INT32:
            return 4;
        case ChannelType.UNSIGNED_INT8:
            return 1;
        case ChannelType.UNSIGNED_INT16:
            return 2;
        case ChannelType.UNSIGNED_INT32:
            return 4;
        case ChannelType.HALF_FLOAT:
            return 2;
        case ChannelType.FLOAT:
            return 4;

    }
    throw new Error('Unrecognized type ' + type);
}

/**
 * @param {Number} src Source value
 * @param {Number} bits Source value size in bits
 * @return {Number} Normalized value
 */
function channelToNormFloat(src:number, bits:number):number {
    var maxVal = (1 << bits) - 1;
    return src / maxVal;
}

/**
 * @param {Number} value Source value
 * @param {ChannelType} type
 * @return {Number} Source value converted to float
 */
function channelToFloat(value:number, type:ChannelType):number {
    switch (type) {
        case ChannelType.SNORM_INT8:
            return Math.max(-1, value / 127);
        case ChannelType.SNORM_INT16:
            return Math.max(-1, value / 32767);
        case ChannelType.SNORM_INT32:
            return Math.max(-1, value / 2147483647);
        case ChannelType.UNORM_INT8:
            return value / 255;
        case ChannelType.UNORM_INT16:
            return value / 65535;
        case ChannelType.UNORM_INT32:
            return value / 4294967295;
        case ChannelType.SIGNED_INT8:
            return value;
        case ChannelType.SIGNED_INT16:
            return value;
        case ChannelType.SIGNED_INT32:
            return value;
        case ChannelType.UNSIGNED_INT8:
            return value;
        case ChannelType.UNSIGNED_INT16:
            return value;
        case ChannelType.UNSIGNED_INT32:
            return value;
        case ChannelType.HALF_FLOAT:
            return tcuFloat.halfFloatToNumber(value);
        case ChannelType.FLOAT:
            return value;
    }
    throw new Error('Unrecognized channel type ' + type);
}

/**
 * @param {Number} value Source value
 * @param {ChannelType} type
 * @return {Number} Source value converted to int
 */
function channelToInt(value:number, type:ChannelType):number {
    switch (type) {
        case ChannelType.HALF_FLOAT:
            return Math.round(tcuFloat.halfFloatToNumber(value));
        case ChannelType.FLOAT:
            return Math.round(value);
        default:
            return value;
    }
}

/**
 * @param {ChannelOrder} order
 * @return {Number}
 */
function getNumUsedChannels(order:ChannelOrder):number {
    switch (order) {
        case ChannelOrder.R:
            return 1;
        case ChannelOrder.A:
            return 1;
        case ChannelOrder.I:
            return 1;
        case ChannelOrder.L:
            return 1;
        case ChannelOrder.LA:
            return 2;
        case ChannelOrder.RG:
            return 2;
        case ChannelOrder.RA:
            return 2;
        case ChannelOrder.RGB:
            return 3;
        case ChannelOrder.RGBA:
            return 4;
        case ChannelOrder.ARGB:
            return 4;
        case ChannelOrder.BGRA:
            return 4;
        case ChannelOrder.sRGB:
            return 3;
        case ChannelOrder.sRGBA:
            return 4;
        case ChannelOrder.D:
            return 1;
        case ChannelOrder.S:
            return 1;
        case ChannelOrder.DS:
            return 2;
    }
    throw new Error('Unrecognized channel order ' + order);
}

/**
 * @enum
 */
export enum WrapMode {
    CLAMP_TO_EDGE,      //! Clamp to edge
    CLAMP_TO_BORDER,    //! Use border color at edge
    REPEAT_GL,          //! Repeat with OpenGL semantics
    REPEAT_CL,          //! Repeat with OpenCL semantics
    MIRRORED_REPEAT_GL, //! Mirrored repeat with OpenGL semantics
    MIRRORED_REPEAT_CL  //! Mirrored repeat with OpenCL semantics
}

/**
 * @enum
 */
export enum FilterMode {
    NEAREST,
    LINEAR,

    NEAREST_MIPMAP_NEAREST,
    NEAREST_MIPMAP_LINEAR,
    LINEAR_MIPMAP_NEAREST,
    LINEAR_MIPMAP_LINEAR
}

/**
 * @enum
 */
enum CompareMode {
    COMPAREMODE_NONE,
    COMPAREMODE_LESS,
    COMPAREMODE_LESS_OR_EQUAL,
    COMPAREMODE_GREATER,
    COMPAREMODE_GREATER_OR_EQUAL,
    COMPAREMODE_EQUAL,
    COMPAREMODE_NOT_EQUAL,
    COMPAREMODE_ALWAYS,
    COMPAREMODE_NEVER
}

/**
 * @constructor
 * @param {WrapMode} wrapS
 * @param {WrapMode} wrapT
 * @param {WrapMode} wrapR
 * @param {FilterMode} minFilter
 * @param {FilterMode} magFilter
 * @param {Number} lodThreshold
 * @param {boolean} normalizedCoords
 * @param {CompareMode} compare
 * @param {Number} compareChannel
 * @param {Array<Number>} borderColor
 * @param {boolean} seamlessCubeMap
 */
export class Sampler {
    constructor(public wrapS:WrapMode,
                public wrapT:WrapMode,
                public wrapR:WrapMode,
                public minFilter:FilterMode,
                public magFilter:FilterMode,
                public lodThreshold:number = 0,
                public normalizedCoords:boolean = true,
                public compare:CompareMode = CompareMode.COMPAREMODE_NONE,
                public compareChannel:number = 0,
                public borderColor:number[] = [0, 0, 0, 0],
                public seamlessCubeMap:boolean = false) {
    }
}

/**
 * Special unnormalization for REPEAT_CL and MIRRORED_REPEAT_CL wrap modes; otherwise ordinary unnormalization.
 * @param {WrapMode} mode
 * @param {Number} c Value to unnormalize
 * @param {Number} size Unnormalized type size (integer)
 * @return {Number}
 */
function unnormalize(mode:WrapMode, c:number, size:number):number {
    switch (mode) {
        case WrapMode.CLAMP_TO_EDGE:
        case WrapMode.CLAMP_TO_BORDER:
        case WrapMode.REPEAT_GL:
        case WrapMode.MIRRORED_REPEAT_GL: // Fall-through (ordinary case).
            return size * c;

        case WrapMode.REPEAT_CL:
            return size * (c - Math.floor(c));

        case WrapMode.MIRRORED_REPEAT_CL:
            return size * Math.abs(c - 2 * deMath.rint(0.5 * c));
    }
    throw new Error('Unrecognized wrap mode ' + mode);
}

/**
 * @param {WrapMode} mode
 * @param {Number} c Source value (integer)
 * @param {Number} size Type size (integer)
 * @return {Number}
 */
function wrap(mode:WrapMode, c:number, size:number):number {
    switch (mode) {
        case WrapMode.CLAMP_TO_BORDER:
            return deMath.clamp(c, -1, size);

        case WrapMode.CLAMP_TO_EDGE:
            return deMath.clamp(c, 0, size - 1);

        case WrapMode.REPEAT_GL:
            return deMath.imod(c, size);

        case WrapMode.REPEAT_CL:
            return deMath.imod(c, size);

        case WrapMode.MIRRORED_REPEAT_GL:
            return (size - 1) - deMath.mirror(deMath.imod(c, 2 * size) - size);

        case WrapMode.MIRRORED_REPEAT_CL:
            return deMath.clamp(c, 0, size - 1); // \note Actual mirroring done already in unnormalization function.
    }
    throw new Error('Unrecognized wrap mode ' + mode);
}

/**
 * @param {Number} cs
 * @return {Number}
 */
function sRGBChannelToLinear(cs:number):number {
    if (cs <= 0.04045)
        return cs / 12.92;
    else
        return Math.pow((cs + 0.055) / 1.055, 2.4);
}

/**
 * Convert sRGB to linear colorspace
 * @param {Array<Number>} cs Vec4
 * @param {Array<Number>} Vec4
 */
function sRGBToLinear(cs:number[]):number[] {
    return [
        sRGBChannelToLinear(cs[0]),
        sRGBChannelToLinear(cs[1]),
        sRGBChannelToLinear(cs[2]),
        cs[3]
    ];
}

/**
 * Texel lookup with color conversion.
 * @param {ConstPixelBufferAccess} access
 * @param {Number} i
 * @param {Number} j
 * @param {Number} k
 * @return {Array<Number>} Vec4 pixel color
 */
function lookup(access:ConstPixelBufferAccess, i:number, j:number, k:number):number[] {
    var p = access.getPixel(i, j, k);
    // console.log('Lookup at ' + i + ' ' + j + ' ' + k + ' ' + p);
    return isSRGB(access.getFormat()) ? sRGBToLinear(p) : p;
}

/**
 * @param {ConstPixelBufferAccess} access
 * @param {Sampler} sampler
 * @param {Number} u
 * @param {Number} v
 * @param {Number} depth (integer)
 * @return {Array<Number>} Vec4 pixel color
 */
function sampleNearest2D(access:ConstPixelBufferAccess, sampler:Sampler, u:number, v:number, depth:number):number[] {
    var width = access.getWidth();
    var height = access.getHeight();

    /* TODO: Shouldn't it be just Math.round? */
    var x = Math.round(Math.floor(u));
    var y = Math.round(Math.floor(v));

    // Check for CLAMP_TO_BORDER.
    if ((sampler.wrapS == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(x, 0, width)) ||
        (sampler.wrapT == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(y, 0, height)))
        return sampler.borderColor;

    var i = wrap(sampler.wrapS, x, width);
    var j = wrap(sampler.wrapT, y, height);

    return lookup(access, i, j, depth);
}

/**
 * @param {ConstPixelBufferAccess} access
 * @param {Sampler} sampler
 * @param {Number} u
 * @param {Number} v
 * @param {Number} w
 * @return {Array<Number>} Vec4 pixel color
 */
var sampleNearest3D = function (access, sampler, u, v, w) {
    var width = access.getWidth();
    var height = access.getHeight();
    var depth = access.getDepth();

    var x = Math.round(Math.floor(u));
    var y = Math.round(Math.floor(v));
    var z = Math.round(Math.floor(w));

    // Check for CLAMP_TO_BORDER.
    if ((sampler.wrapS == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(x, 0, width)) ||
        (sampler.wrapT == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(y, 0, height)) ||
        (sampler.wrapR == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(z, 0, depth)))
        return sampler.borderColor;

    var i = wrap(sampler.wrapS, x, width);
    var j = wrap(sampler.wrapT, y, height);
    var k = wrap(sampler.wrapR, z, depth);

    return lookup(access, i, j, k);
};

/**
 * @param {Array<Number>} color Vec4 color
 * @return {Number} The color in packed 32 bit format
 */
var packRGB999E5 = function (color) {
    /** @const */ var mBits = 9;
    /** @const */ var eBits = 5;
    /** @const */ var eBias = 15;
    /** @const */ var eMax = (1 << eBits) - 1;
    /** @const */ var maxVal = (((1 << mBits) - 1) * (1 << (eMax - eBias))) / (1 << mBits);

    var rc = deMath.clamp(color[0], 0, maxVal);
    var gc = deMath.clamp(color[1], 0, maxVal);
    var bc = deMath.clamp(color[2], 0, maxVal);
    var maxc = Math.max(rc, gc, bc);
    var expp = Math.max(-eBias - 1, Math.floor(Math.log2(maxc))) + 1 + eBias;
    var e = Math.pow(2, expp - eBias - mBits);
    var maxs = Math.floor(maxc / e + 0.5);

    var exps = maxs == (1 << mBits) ? expp + 1 : expp;
    var rs = deMath.clamp(Math.floor(rc / e + 0.5), 0, (1 << 9) - 1);
    var gs = deMath.clamp(Math.floor(gc / e + 0.5), 0, (1 << 9) - 1);
    var bs = deMath.clamp(Math.floor(bc / e + 0.5), 0, (1 << 9) - 1);

    DE_ASSERT((exps & ~((1 << 5) - 1)) == 0);
    DE_ASSERT((rs & ~((1 << 9) - 1)) == 0);
    DE_ASSERT((gs & ~((1 << 9) - 1)) == 0);
    DE_ASSERT((bs & ~((1 << 9) - 1)) == 0);

    return rs | (gs << 9) | (bs << 18) | (exps << 27);
};

/**
 * @param {Number} color Color in packed 32 bit format
 * @return {Array<Number>} The color in unpacked format
 */
var unpackRGB999E5 = function (color) {
    var mBits = 9;
    var eBias = 15;

    var exp = (color >> 27) & ((1 << 5) - 1);
    var bs = (color >> 18) & ((1 << 9) - 1);
    var gs = (color >> 9) & ((1 << 9) - 1);
    var rs = color & ((1 << 9) - 1);

    var e = Math.pow(2, (exp - eBias - mBits));
    var r = rs * e;
    var g = gs * e;
    var b = bs * e;

    return [r, g, b, 1];
};

interface Descriptor {
    format: TextureFormat;
    width: number;
    height: number;
    depth?: number;
    data;
    rowPitch?: number;
    slicePitch?: number;
}

/**
 * \brief Read-only pixel data access
 *
 * ConstPixelBufferAccess encapsulates pixel data pointer along with
 * format and layout information. It can be used for read-only access
 * to arbitrary pixel buffers.
 *
 * Access objects are like iterators or pointers. They can be passed around
 * as values and are valid as long as the storage doesn't change.
 * @constructor
 */
export class ConstPixelBufferAccess {
    protected m_format:TextureFormat;
    protected m_width:number;
    protected m_height:number;
    protected m_depth:number;
    protected m_data:ArrayBuffer;
    protected m_rowPitch:number;
    protected m_slicePitch:number;

    constructor(descriptor?:Descriptor) {
        if (descriptor) {
            this.m_format = descriptor.format;
            this.m_width = descriptor.width;
            this.m_height = descriptor.height;
            if (descriptor.depth)
                this.m_depth = descriptor.depth;
            else
                this.m_depth = 1;
            this.m_data = descriptor.data;
            if (descriptor.rowPitch)
                this.m_rowPitch = descriptor.rowPitch;
            else
                this.m_rowPitch = this.m_width * this.m_format.getPixelSize();

            if (descriptor.slicePitch)
                this.m_slicePitch = descriptor.slicePitch;
            else
                this.m_slicePitch = this.m_rowPitch * this.m_height;
        }
    }

    /** @return {number} */
    getDataSize():number {
        return this.m_depth * this.m_slicePitch;
    }

    /** @return {TypedArray} */
    getDataPtr() {
        var arrayType = getTypedArray(this.m_format.type);
        return new arrayType(this.m_data);
    }

    /** @return {number} */
    getRowPitch():number {
        return this.m_rowPitch;
    }

    /** @return {number} */
    getWidth():number {
        return this.m_width;
    }

    /** @return {number} */
    getHeight():number {
        return this.m_height;
    }

    /** @return {number} */
    getDepth():number {
        return this.m_depth;
    }

    /** @return {number} */
    getSlicePitch():number {
        return this.m_slicePitch;
    }

    /** @return {TextureFormat} */
    getFormat():TextureFormat {
        return this.m_format;
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @return {Array<Number>} Pixel value as Vec4
     */
    getPixel(x:number, y:number, z:number = 0):number[] {
//    if (z == null)
//        z = 0;
        // console.log(this);
        // console.log('(' + x + ',' + y + ',' + z + ')');

        DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
        DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
        DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

        var pixelSize = this.m_format.getPixelSize();
        var arrayType = getTypedArray(this.m_format.type);
        var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
        var pixelPtr = new arrayType(this.m_data, z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize);

        function ub(pixel:number, offset:number, count:number):number {
            return (pixel >> offset) & ((1 << count) - 1);
        }

        function nb(pixel:number, offset:number, count:number):number {
            return channelToNormFloat(ub(pixel, offset, count), count);
        }

        var pixel = pixelPtr[0];

        // Packed formats.
        switch (this.m_format.type) {
            case ChannelType.UNORM_SHORT_565:
                return [nb(pixel, 11, 5), nb(pixel, 5, 6), nb(pixel, 0, 5), 1];
            case ChannelType.UNORM_SHORT_555:
                return [nb(pixel, 10, 5), nb(pixel, 5, 5), nb(pixel, 0, 5), 1];
            case ChannelType.UNORM_SHORT_4444:
                return [nb(pixel, 12, 4), nb(pixel, 8, 4), nb(pixel, 4, 4), nb(pixel, 0, 4)];
            case ChannelType.UNORM_SHORT_5551:
                return [nb(pixel, 11, 5), nb(pixel, 6, 5), nb(pixel, 1, 5), nb(pixel, 0, 1)];
            case ChannelType.UNORM_INT_101010:
                return [nb(pixel, 22, 10), nb(pixel, 12, 10), nb(pixel, 2, 10), 1];
            case ChannelType.UNORM_INT_1010102_REV:
                return [nb(pixel, 0, 10), nb(pixel, 10, 10), nb(pixel, 20, 10), nb(pixel, 30, 2)];
            case ChannelType.UNSIGNED_INT_1010102_REV:
                return [ub(pixel, 0, 10), ub(pixel, 10, 10), ub(pixel, 20, 10), ub(pixel, 30, 2)];
            case ChannelType.UNSIGNED_INT_999_E5_REV:
                return unpackRGB999E5(pixel);

            case ChannelType.UNSIGNED_INT_24_8:
                switch (this.m_format.order) {
                    // \note Stencil is always ignored.
                    case ChannelOrder.D:
                        return [nb(pixel, 8, 24), 0, 0, 1];
                    case ChannelOrder.DS:
                        return [nb(pixel, 8, 24), 0, 0, 1 /* (float)ub(0, 8) */];
                    default:
                        DE_ASSERT(false);
                }

            case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV:
            {
                DE_ASSERT(this.m_format.order == ChannelOrder.DS);
                // \note Stencil is ignored.
                return [pixel, 0, 0, 1];
            }

            case ChannelType.UNSIGNED_INT_11F_11F_10F_REV:
            {
                var f11 = function (value) {
                    return tcuFloat.float11ToNumber(value);
                };
                var f10 = function (value) {
                    return tcuFloat.float10ToNumber(value);
                };
                return [f11(ub(pixel, 0, 11)), f11(ub(pixel, 11, 11)), f10(ub(pixel, 22, 10)), 1];
            }

            default:
                break;
        }

        // Generic path.
        var result = [];
        result.length = 4;
        var channelMap = getChannelReadMap(this.m_format.order);
        var channelSize = getChannelSize(this.m_format.type);

        for (var c = 0; c < 4; c++) {
            var map = channelMap[c];
            if (map == channel.ZERO)
                result[c] = 0;
            else if (map == channel.ONE)
                result[c] = 1;
            else
                result[c] = channelToFloat(pixelPtr[map], this.m_format.type);
        }

        return result;
    }

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     * @return {Array<Number>} Pixel value as Vec4
     */
    getPixelInt(x:number, y:number, z:number = 0):number[] {
//    if (z == null)
//        z = 0;
        DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
        DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
        DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

        var pixelSize = this.m_format.getPixelSize();
        var arrayType = getTypedArray(this.m_format.type);
        var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
        var pixelPtr = new arrayType(this.m_data, z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize);

        var ub = function (pixel, offset, count) {
            return (pixel >> offset) & ((1 << count) - 1);
        };

        var pixel = pixelPtr[0];

        // Packed formats.
        switch (this.m_format.type) {
            case ChannelType.UNORM_SHORT_565:
                return [ub(pixel, 11, 5), ub(pixel, 5, 6), ub(pixel, 0, 5), 1];
            case ChannelType.UNORM_SHORT_555:
                return [ub(pixel, 10, 5), ub(pixel, 5, 5), ub(pixel, 0, 5), 1];
            case ChannelType.UNORM_SHORT_4444:
                return [ub(pixel, 12, 4), ub(pixel, 8, 4), ub(pixel, 4, 4), ub(pixel, 0, 4)];
            case ChannelType.UNORM_SHORT_5551:
                return [ub(pixel, 11, 5), ub(pixel, 6, 5), ub(pixel, 1, 5), ub(pixel, 0, 1)];
            case ChannelType.UNORM_INT_101010:
                return [ub(pixel, 22, 10), ub(pixel, 12, 10), ub(pixel, 2, 10), 1];
            case ChannelType.UNORM_INT_1010102_REV:
                return [ub(pixel, 0, 10), ub(pixel, 10, 10), ub(pixel, 20, 10), ub(pixel, 30, 2)];
            case ChannelType.UNSIGNED_INT_1010102_REV:
                return [ub(pixel, 0, 10), ub(pixel, 10, 10), ub(pixel, 20, 10), ub(pixel, 30, 2)];

            case ChannelType.UNSIGNED_INT_24_8:
                switch (this.m_format.order) {
                    // \note Stencil is always ignored.
                    case ChannelOrder.D:
                        return [ub(pixel, 8, 24), 0, 0, 1];
                    case ChannelOrder.DS:
                        return [ub(pixel, 8, 24), 0, 0, 1 /* (float)ub(0, 8) */];
                    default:
                        DE_ASSERT(false);
                }

            case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV:
            {
                DE_ASSERT(this.m_format.order == ChannelOrder.DS);
                // \note Stencil is ignored.
                return [pixel, 0, 0, 1];
            }

            default:
                break;
        }

        // Generic path.
        var result = [];
        result.length = 4;
        var channelMap = getChannelReadMap(this.m_format.order);
        var channelSize = getChannelSize(this.m_format.type);

        for (var c = 0; c < 4; c++) {
            var map = channelMap[c];
            if (map == channel.ZERO)
                result[c] = 0;
            else if (map == channel.ONE)
                result[c] = 1;
            else
                result[c] = channelToInt(pixelPtr[map], this.m_format.type);
        }

        return result;
    }

    /**
     * @param {Sampler} sampler
     * @param {FilterMode} filter
     * @param {Number} s
     * @param {Number} t
     * @param {Number} depth (integer)
     * @return {Array<Number>} Sample color
     */
    sample2D(sampler:Sampler, filter:FilterMode, s:number, t:number, depth:number):number[] {
        DE_ASSERT(deMath.deInBounds32(depth, 0, this.m_depth));

        // Non-normalized coordinates.
        var u = s;
        var v = t;

        if (sampler.normalizedCoords) {
            u = unnormalize(sampler.wrapS, s, this.m_width);
            v = unnormalize(sampler.wrapT, t, this.m_height);
        }

        switch (filter) {
            case FilterMode.NEAREST:
                return sampleNearest2D(this, sampler, u, v, depth);
            // case Sampler::LINEAR:    return sampleLinear2D    (*this, sampler, u, v, depth);
            // default:
            //     DE_ASSERT(false);
            //     return Vec4(0.0f);
        }
        throw new Error('Unimplemented');
    }

    /**
     * @param {Sampler} sampler
     * @param {FilterMode} filter
     * @param {Number} s
     * @param {Number} t
     * @param {Number} r
     * @return {Array<Number>} Sample color
     */
    sample3D(sampler:Sampler, filter:FilterMode, s:number, t:number, r:number):number[] {
        // Non-normalized coordinates.
        var u = s;
        var v = t;
        var w = r;

        if (sampler.normalizedCoords) {
            u = unnormalize(sampler.wrapS, s, this.m_width);
            v = unnormalize(sampler.wrapT, t, this.m_height);
            w = unnormalize(sampler.wrapR, r, this.m_depth);
        }

        switch (filter) {
            case FilterMode.NEAREST:
                return sampleNearest3D(this, sampler, u, v, w);
            // case Sampler::LINEAR:    return sampleLinear3D    (*this, sampler, u, v, w);
            // default:
            //     DE_ASSERT(false);
            //     return Vec4(0.0f);
        }
        throw new Error('Unimplemented');
    }

    /* TODO: do we need any of these? */
    // template<typename T>
    // Vector<T, 4>            getPixelT                    (int x, int y, int z = 0) const;

    // float                    getPixDepth                    (int x, int y, int z = 0) const;
    // int                        getPixStencil                (int x, int y, int z = 0) const;

    // Vec4                    sample1D                    (const Sampler& sampler, Sampler::FilterMode filter, float s, int level) const;
    // Vec4                    sample3D                    (const Sampler& sampler, Sampler::FilterMode filter, float s, float t, float r) const;

    // Vec4                    sample1DOffset                (const Sampler& sampler, Sampler::FilterMode filter, float s, const IVec2& offset) const;
    // Vec4                    sample2DOffset                (const Sampler& sampler, Sampler::FilterMode filter, float s, float t, const IVec3& offset) const;
    // Vec4                    sample3DOffset                (const Sampler& sampler, Sampler::FilterMode filter, float s, float t, float r, const IVec3& offset) const;

    // float                    sample1DCompare                (const Sampler& sampler, Sampler::FilterMode filter, float ref, float s, const IVec2& offset) const;
    // float                    sample2DCompare                (const Sampler& sampler, Sampler::FilterMode filter, float ref, float s, float t, const IVec3& offset) const;
}


/* Common type limits */
var deTypes = {
    deInt8: {min: -(1 << 7), max: (1 << 7) - 1},
    deInt16: {min: -(1 << 15), max: (1 << 15) - 1},
    deMath: {min: -(1 << 31), max: (1 << 31) - 1},
    deUint8: {min: 0, max: (1 << 8) - 1},
    deUint16: {min: 0, max: (1 << 16) - 1},
    deUint32: {min: 0, max: 4294967295}
};

/**
 * Round to even and saturate
 * @param {deTypes} deType
 * @param {Number} value
 * @return {Number}
 */
function convertSatRte(deType:{ min; max; }, value:number):number {
    var minVal = deType.min;
    var maxVal = deType.max;
    var floor = Math.floor(value);
    var frac = value - floor;
    if (frac == 0.5)
        if (floor % 2 != 0)
            floor += 1;
        else if (frac > 0.5)
            floor += 1;

    return Math.max(minVal, Math.min(maxVal, floor));
}

/**
 * @param {Number} src
 * @param {Number} bits
 * @return {Number}
 */
function normFloatToChannel(src:number, bits:number):number {
    var maxVal = (1 << bits) - 1;
    var intVal = convertSatRte(deTypes.deUint32, src * maxVal);
    return Math.min(maxVal, intVal);
}

/**
 * @param {Number} src
 * @param {Number} bits
 * @return {Number}
 */
function uintToChannel(src:number, bits:number):number {
    var maxVal = (1 << bits) - 1;
    return Math.min(maxVal, src);
}

/**
 * @param {Number} src
 * @param {ChannelType} type
 * @return {Number} Converted src color value
 */
function floatToChannel(src:number, type:ChannelType):number {
    switch (type) {
        case ChannelType.SNORM_INT8:
            return convertSatRte(deTypes.deInt8, src * 127);
        case ChannelType.SNORM_INT16:
            return convertSatRte(deTypes.deInt16, src * 32767);
        case ChannelType.SNORM_INT32:
            return convertSatRte(deTypes.deMath, src * 2147483647);
        case ChannelType.UNORM_INT8:
            return convertSatRte(deTypes.deUint8, src * 255);
        case ChannelType.UNORM_INT16:
            return convertSatRte(deTypes.deUint16, src * 65535);
        case ChannelType.UNORM_INT32:
            return convertSatRte(deTypes.deUint32, src * 4294967295);
        case ChannelType.SIGNED_INT8:
            return convertSatRte(deTypes.deInt8, src);
        case ChannelType.SIGNED_INT16:
            return convertSatRte(deTypes.deInt16, src);
        case ChannelType.SIGNED_INT32:
            return convertSatRte(deTypes.deMath, src);
        case ChannelType.UNSIGNED_INT8:
            return convertSatRte(deTypes.deUint8, src);
        case ChannelType.UNSIGNED_INT16:
            return convertSatRte(deTypes.deUint16, src);
        case ChannelType.UNSIGNED_INT32:
            return convertSatRte(deTypes.deUint32, src);
        case ChannelType.HALF_FLOAT:
            return tcuFloat.numberToHalfFloat(src);
        case ChannelType.FLOAT:
            return src;
    }
    throw new Error('Unrecognized type ' + type);
}

/**
 * \brief Read-write pixel data access
 *
 * This class extends read-only access object by providing write functionality.
 *
 * \note PixelBufferAccess may not have any data members nor add any
 *         virtual functions. It must be possible to reinterpret_cast<>
 *         PixelBufferAccess to ConstPixelBufferAccess.
 * @constructor
 * @extends {ConstPixelBufferAccess}
 *
 */
export class PixelBufferAccess extends ConstPixelBufferAccess {
    constructor(descriptor?:Descriptor) {
        super(descriptor);
    }

    /**
     * @param {Array<Number>} Vec4 color to set
     * @param {Number} x
     * @param {Number} y
     * @param {Number} z
     */
    setPixel(color:ArrayLike<number>, x:number, y:number, z:number = 0) {
        //if (z == null)
        //    z = 0;
        // Packed formats.
        DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
        DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
        DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

        var pixelSize = this.m_format.getPixelSize();
        var arrayType = getTypedArray(this.m_format.type);
        var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
        var pixelPtr = new arrayType(this.m_data, offset);

        function pn(val, offs, bits) {
            return normFloatToChannel(val, bits) << offs;
        }

        function pu(val, offs, bits) {
            return uintToChannel(val, bits) << offs;
        }

        switch (this.m_format.type) {
            case ChannelType.UNORM_SHORT_565:
                pixelPtr[0] = pn(color[0], 11, 5) | pn(color[1], 5, 6) | pn(color[2], 0, 5);
                break;
            case ChannelType.UNORM_SHORT_555:
                pixelPtr[0] = pn(color[0], 10, 5) | pn(color[1], 5, 5) | pn(color[2], 0, 5);
                break;
            case ChannelType.UNORM_SHORT_4444:
                pixelPtr[0] = pn(color[0], 12, 4) | pn(color[1], 8, 4) | pn(color[2], 4, 4) | pn(color[3], 0, 4);
                break;
            case ChannelType.UNORM_SHORT_5551:
                pixelPtr[0] = pn(color[0], 11, 5) | pn(color[1], 6, 5) | pn(color[2], 1, 5) | pn(color[3], 0, 1);
                break;
            case ChannelType.UNORM_INT_101010:
                pixelPtr[0] = pn(color[0], 22, 10) | pn(color[1], 12, 10) | pn(color[2], 2, 10);
                break;
            case ChannelType.UNORM_INT_1010102_REV:
                pixelPtr[0] = pn(color[0], 0, 10) | pn(color[1], 10, 10) | pn(color[2], 20, 10) | pn(color[3], 30, 2);
                break;
            case ChannelType.UNSIGNED_INT_1010102_REV:
                pixelPtr[0] = pu(color[0], 0, 10) | pu(color[1], 10, 10) | pu(color[2], 20, 10) | pu(color[3], 30, 2);
                break;
            case ChannelType.UNSIGNED_INT_999_E5_REV:
                pixelPtr[0] = packRGB999E5(color);
                break;

            case ChannelType.UNSIGNED_INT_24_8:
                switch (this.m_format.order) {
                    // \note Stencil is always ignored.
                    case ChannelOrder.D:
                        pixelPtr[0] = pn(color[0], 8, 24);
                        break;
                    case ChannelOrder.S:
                        pixelPtr[0] = pn(color[3], 8, 24);
                        break;
                    case ChannelOrder.DS:
                        pixelPtr[0] = pn(color[0], 8, 24) | pu(color[3], 0, 8);
                        break;
                    default:
                        throw new Error('Unsupported channel order ' + this.m_format.order);
                }
                break;

            case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV:
            {
                pixelPtr[0] = color[0];
                var u32array = new Uint32Array(this.m_data, offset + 4, 1);
                u32array[0] = pu(color[3], 0, 8);
                break;
            }

            case ChannelType.UNSIGNED_INT_11F_11F_10F_REV:
            {
                var f11 = function (value) {
                    return tcuFloat.numberToFloat11(value);
                };
                var f10 = function (value) {
                    return tcuFloat.numberToFloat10(value);
                };

                pixelPtr[0] = f11(color[0]) | (f11(color[1]) << 11) | (f10(color[2]) << 22);
                break;
            }
            case ChannelType.FLOAT:
                if (this.m_format.order == ChannelOrder.D) {
                    pixelPtr[0] = color[0];
                    break;
                }
            // else fall-through to default case!

            default:
            {
                // Generic path.
                var numChannels = getNumUsedChannels(this.m_format.order);
                var map = getChannelWriteMap(this.m_format.order);

                for (var c = 0; c < numChannels; c++)
                    pixelPtr[c] = floatToChannel(color[map[c]], this.m_format.type);
            }
        }
    }
}

/* TODO: Port */
// {
// public:
//                             PixelBufferAccess            (void) {}
//                             PixelBufferAccess            (TextureLevel& level);
//                             PixelBufferAccess            (const TextureFormat& format, int width, int height, int depth, void* data);
//                             PixelBufferAccess            (const TextureFormat& format, int width, int height, int depth, int rowPitch, int slicePitch, void* data);

//     void*                    getDataPtr                    (void) const { return m_data; }

//     void                    setPixels                    (const void* buf, int bufSize) const;
//     void                    setPixel                    (const tcu::Vec4& color, int x, int y, int z = 0) const;
//     void                    setPixel                    (const tcu::IVec4& color, int x, int y, int z = 0) const;
//     void                    setPixel                    (const tcu::UVec4& color, int x, int y, int z = 0) const { setPixel(color.cast<int>(), x, y, z); }

//     void                    setPixDepth                    (float depth, int x, int y, int z = 0) const;
//     void                    setPixStencil                (int stencil, int x, int y, int z = 0) const;
// };

/*--------------------------------------------------------------------*//*!
 * \brief Generic pixel data container
 *
 * This container supports all valid TextureFormat combinations and
 * both 2D and 3D textures. To read or manipulate data access object must
 * be queried using getAccess().
 *//*--------------------------------------------------------------------*/
export class TextureLevel {
    private m_format:TextureFormat;
    private m_width:number;
    private m_height:number;
    private m_depth:number;
    private m_data:ArrayBuffer;

    constructor(format:TextureFormat, width:number = 0, height:number = 0, depth:number = 1) {
        this.m_format = format;
        this.setSize(width, height, depth)
    }

    getWidth():number {
        return this.m_width;
    }

    getHeight():number {
        return this.m_height;
    }

    getDepth():number {
        return this.m_depth;
    }

    isEmpty():boolean {
        return this.m_width === 0 || this.m_height === 0 || this.m_depth === 0;
    }

    getFormat():TextureFormat {
        return this.m_format;
    }

    setStorage(format:TextureFormat, width:number, height:number, depth:number = 1):void {
        this.m_format = format;
        this.setSize(width, height, depth);
    }

    setSize(width:number, height:number, depth:number = 1):void {
        var pixelSize:number = this.m_format.getPixelSize();
        this.m_width = width;
        this.m_height = height;
        this.m_depth = depth;

        this.m_data = new ArrayBuffer(this.m_width * this.m_height * this.m_depth * pixelSize);
    }

    getAccessW():PixelBufferAccess {
        return new PixelBufferAccess({
            format: this.m_format,
            width: this.m_width,
            height: this.m_height,
            depth: this.m_depth,
            data: this.m_data
        });
    }

    getAccess():ConstPixelBufferAccess {
        return new ConstPixelBufferAccess({
            format: this.m_format,
            width: this.m_width,
            height: this.m_height,
            depth: this.m_depth,
            data: this.m_data
        });
    }
}

class TextureLevelPyramid {
    protected m_format:TextureFormat;
    protected m_data:DeqpArrayBuffer[];
    protected m_access:PixelBufferAccess[];

    /**
     * @constructor
     * @param {TextureFormat} format
     * @param {Number} numLevels
     */
    constructor(format:TextureFormat, numLevels:number) {
        this.m_format = format;
        this.m_data = [];
        for (var i = 0; i < numLevels; i++)
            this.m_data.push(new DeqpArrayBuffer());
        this.m_access = [];
        this.m_access.length = numLevels;
    }

    /** @return {bool} */
    isLevelEmpty(levelNdx:number):boolean {
        return this.m_data[levelNdx].empty();
    }

    /** @return {TextureFormat} */
    getFormat():TextureFormat {
        return this.m_format;
    }

    /** @return {Number} */
    getNumLevels():number {
        return this.m_access.length;
    }

    /** @return {PixelBufferAccess} */
    getLevel(ndx:number):PixelBufferAccess {
        return this.m_access[ndx];
    }

    /** @return {Array<PixelBufferAccess>} */
    getLevels():PixelBufferAccess[] {
        return this.m_access;
    }

    /**
     * @param {Number} levelNdx
     * @param {Number} width
     * @param {Number} height
     * @param {Number} depth
     */
    allocLevel(levelNdx:number, width:number, height:number, depth:number):void {
        var size = this.m_format.getPixelSize() * width * height * depth;

        DE_ASSERT(this.isLevelEmpty(levelNdx));

        this.m_data[levelNdx].setStorage(size);
        this.m_access[levelNdx] = new PixelBufferAccess({
            format: this.m_format,
            width: width,
            height: height,
            depth: depth,
            data: this.m_data[levelNdx].m_ptr
        });
    }

    clearLevel(levelNdx:number):void {
        /* TODO: Implement */
        throw new Error('Not implemented');
    }
}

/**
 * @param {Array<ConstPixelBufferAccess>} levels
 * @param {Number} numLevels
 * @param {Sampler} sampler
 * @param {Number} s
 * @param {Number} t
 * @param {Number} depth (integer)
 * @param {Number} lod
 * @return {Array<Number>} Vec4 pixel color
 */
function sampleLevelArray2D(levels:ConstPixelBufferAccess[],
                            numLevels:number,
                            sampler:Sampler,
                            s:number,
                            t:number,
                            depth:number,
                            lod:number):number[] {
    var magnified = lod <= sampler.lodThreshold;
    var filterMode = magnified ? sampler.magFilter : sampler.minFilter;

    switch (filterMode) {
        case FilterMode.NEAREST:
            return levels[0].sample2D(sampler, filterMode, s, t, depth);
        /* TODO: Implement other filters */
        // case Sampler::LINEAR:    return levels[0].sample2D(sampler, filterMode, s, t, depth);

        // case Sampler::NEAREST_MIPMAP_NEAREST:
        // case Sampler::LINEAR_MIPMAP_NEAREST:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level        = deClamp32((int)deFloatCeil(lod + 0.5f) - 1, 0, maxLevel);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_NEAREST) ? Sampler::LINEAR : Sampler::NEAREST;

        //     return levels[level].sample2D(sampler, levelFilter, s, t, depth);
        // }

        // case Sampler::NEAREST_MIPMAP_LINEAR:
        // case Sampler::LINEAR_MIPMAP_LINEAR:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level0        = deClamp32((int)deFloatFloor(lod), 0, maxLevel);
        //     int                    level1        = de::min(maxLevel, level0 + 1);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_LINEAR) ? Sampler::LINEAR : Sampler::NEAREST;
        //     float                f            = deFloatFrac(lod);
        //     tcu::Vec4            t0            = levels[level0].sample2D(sampler, levelFilter, s, t, depth);
        //     tcu::Vec4            t1            = levels[level1].sample2D(sampler, levelFilter, s, t, depth);

        //     return t0*(1.0f - f) + t1*f;
        // }

        // default:
        //     DE_ASSERT(false);
        //     return Vec4(0.0f);
    }
    throw new Error('Unimplemented');
}

/**
 * @param {Array<ConstPixelBufferAccess>} levels
 * @param {Number} numLevels
 * @param {Sampler} sampler
 * @param {Number} s
 * @param {Number} t
 * @param {Number} r
 * @param {Number} lod
 * @return {Array<Number>} Vec4 pixel color
 */
function sampleLevelArray3D(levels:ConstPixelBufferAccess[],
                            numLevels:number,
                            sampler:Sampler,
                            s:number,
                            t:number,
                            r:number,
                            lod:number):number[] {
    var magnified = lod <= sampler.lodThreshold;
    var filterMode = magnified ? sampler.magFilter : sampler.minFilter;

    switch (filterMode) {
        case FilterMode.NEAREST:
            return levels[0].sample3D(sampler, filterMode, s, t, r);
        // case Sampler::LINEAR:    return levels[0].sample3D(sampler, filterMode, s, t, r);

        // case Sampler::NEAREST_MIPMAP_NEAREST:
        // case Sampler::LINEAR_MIPMAP_NEAREST:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level        = deClamp32((int)deFloatCeil(lod + 0.5f) - 1, 0, maxLevel);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_NEAREST) ? Sampler::LINEAR : Sampler::NEAREST;

        //     return levels[level].sample3D(sampler, levelFilter, s, t, r);
        // }

        // case Sampler::NEAREST_MIPMAP_LINEAR:
        // case Sampler::LINEAR_MIPMAP_LINEAR:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level0        = deClamp32((int)deFloatFloor(lod), 0, maxLevel);
        //     int                    level1        = de::min(maxLevel, level0 + 1);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_LINEAR) ? Sampler::LINEAR : Sampler::NEAREST;
        //     float                f            = deFloatFrac(lod);
        //     tcu::Vec4            t0            = levels[level0].sample3D(sampler, levelFilter, s, t, r);
        //     tcu::Vec4            t1            = levels[level1].sample3D(sampler, levelFilter, s, t, r);

        //     return t0*(1.0f - f) + t1*f;
        // }

        // default:
        //     DE_ASSERT(false);
        //     return Vec4(0.0f);
    }
    throw new Error('Unimplemented');
}

class CubeFaceCoords {
    face:CubeFace;
    s:number;
    t:number;

    /**
     * @constructor
     * @param {CubeFace} face
     * @param {Array<Number>} Vec2 coordinates
     */
    constructor(face:CubeFace, coords:number[]) {
        this.face = face;
        this.s = coords[0];
        this.t = coords[1];
    }
}

/**
 * \brief 2D Texture View
 */
class Texture2DView {
    private m_numLevels:number;
    private m_levels:ConstPixelBufferAccess[];

    /**
     * @constructor
     * @param {Number} numLevels
     * @param {Array<ConstPixelBufferAccess>} levels
     */
    constructor(numLevels:number, levels:ConstPixelBufferAccess[]) {
        this.m_numLevels = numLevels;
        this.m_levels = levels;
    }

    /** @return {Number} */
    getNumLevels():number {
        return this.m_numLevels;
    }

    /** @return {Number} */
    getWidth():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getWidth() : 0;
    }

    /** @return {Number} */
    getHeight():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getHeight() : 0;
    }

    /**
     * @param {Number} ndx
     * @return {ConstPixelBufferAccess}
     */
    getLevel(ndx:number):ConstPixelBufferAccess {
        DE_ASSERT(deMath.deInBounds32(ndx, 0, this.m_numLevels));
        return this.m_levels[ndx];
    }

    /** @return {Array<ConstPixelBufferAccess>} */
    getLevels():ConstPixelBufferAccess[] {
        return this.m_levels;
    }

    /**
     * @param {Number} baseLevel
     * @param {Number} maxLevel
     * return {Texture2DView}
     */
    getSubView(baseLevel:number, maxLevel:number):Texture2DView {
        var clampedBase = deMath.clamp(baseLevel, 0, this.m_numLevels - 1);
        var clampedMax = deMath.clamp(maxLevel, clampedBase, this.m_numLevels - 1);
        var numLevels = clampedMax - clampedBase + 1;
        return new Texture2DView(numLevels, this.m_levels.slice(clampedBase, numLevels));
    }

    /**
     * @param {Sampler} sampler
     * @param {Array<Number>} texCoord
     * @param {Number} lod
     * @return {Array<Number>} Pixel color
     */
    sample(sampler:Sampler, texCoord:number[], lod:number):number[] {
        return sampleLevelArray2D(this.m_levels, this.m_numLevels, sampler, texCoord[0], texCoord[1], 0 /* depth */, lod);
    }

    /* TODO: Port
     Vec4                            sample                (const Sampler& sampler, float s, float t, float lod) const;
     Vec4                            sampleOffset        (const Sampler& sampler, float s, float t, float lod, const IVec2& offset) const;
     float                            sampleCompare        (const Sampler& sampler, float ref, float s, float t, float lod) const;
     float                            sampleCompareOffset    (const Sampler& sampler, float ref, float s, float t, float lod, const IVec2& offset) const;

     Vec4                            gatherOffsets        (const Sampler& sampler, float s, float t, int componentNdx, const IVec2 (&offsets)[4]) const;
     Vec4                            gatherOffsetsCompare(const Sampler& sampler, float ref, float s, float t, const IVec2 (&offsets)[4]) const;
     */
}

class Texture2DArrayView {
    private m_numLevels:number;
    private m_levels:ConstPixelBufferAccess[];

    /**
     * @constructor
     * @param {Number} numLevels
     * @param {Array<ConstPixelBufferAccess>} levels
     */
    constructor(numLevels, levels) {
        this.m_numLevels = numLevels;
        this.m_levels = levels;
    }

    /** @return {Number} */
    getNumLevels():number {
        return this.m_numLevels;
    }

    /** @return {Number} */
    getWidth():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getWidth() : 0;
    }

    /** @return {Number} */
    getHeight():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getHeight() : 0;
    }

    /** @return {Number} */
    getNumLayers():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getDepth() : 0;
    }

    /**
     * @param {Number} ndx
     * @return {ConstPixelBufferAccess}
     */
    getLevel(ndx:number):ConstPixelBufferAccess {
        DE_ASSERT(deMath.deInBounds32(ndx, 0, this.m_numLevels));
        return this.m_levels[ndx];
    }

    /** @return {Array<ConstPixelBufferAccess>} */
    getLevels():ConstPixelBufferAccess[] {
        return this.m_levels;
    }

    /**
     * @param {Number} r
     * @return {Number} layer corresponding to requested sampling 'r' coordinate
     */
    selectLayer(r:number):number {
        DE_ASSERT(this.m_numLevels > 0 && this.m_levels);
        return deMath.clamp(Math.round(r), 0, this.m_levels[0].getDepth() - 1);
    }

    /**
     * @param {Sampler} sampler
     * @param {Array<Number>} texCoord
     * @param {Number} lod
     * @return {Array<Number>} Pixel color
     */
    sample(sampler:Sampler, texCoord:number[], lod:number):number[] {
        return sampleLevelArray2D(this.m_levels, this.m_numLevels, sampler, texCoord[0], texCoord[1], this.selectLayer(texCoord[2]), lod);
    }
}

class Texture3DView {
    private m_numLevels:number;
    private m_levels:ConstPixelBufferAccess[];

    /**
     * @constructor
     * @param {Number} numLevels
     * @param {Array<ConstPixelBufferAccess>} levels
     */
    constructor(numLevels:number, levels:ConstPixelBufferAccess[]) {
        this.m_numLevels = numLevels;
        this.m_levels = levels;
    }

    /** @return {Number} */
    getNumLevels():number {
        return this.m_numLevels;
    }

    /** @return {Number} */
    getWidth():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getWidth() : 0;
    }

    /** @return {Number} */
    getHeight():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getHeight() : 0;
    }

    /** @return {Number} */
    getDepth():number {
        return this.m_numLevels > 0 ? this.m_levels[0].getDepth() : 0;
    }

    /**
     * @param {Number} ndx
     * @return {ConstPixelBufferAccess}
     */
    getLevel(ndx:number):ConstPixelBufferAccess {
        DE_ASSERT(deMath.deInBounds32(ndx, 0, this.m_numLevels));
        return this.m_levels[ndx];
    }

    /** @return {Array<ConstPixelBufferAccess>} */
    getLevels():ConstPixelBufferAccess[] {
        return this.m_levels;
    }

    /**
     * @param {Number} baseLevel
     * @param {Number} maxLevel
     * return {Texture3DView}
     */
    getSubView(baseLevel:number, maxLevel:number):Texture3DView {
        var clampedBase = deMath.clamp(baseLevel, 0, this.m_numLevels - 1);
        var clampedMax = deMath.clamp(maxLevel, clampedBase, this.m_numLevels - 1);
        var numLevels = clampedMax - clampedBase + 1;
        return new Texture3DView(numLevels, this.m_levels.slice(clampedBase, numLevels));
    }

    /**
     * @param {Sampler} sampler
     * @param {Array<Number>} texCoord
     * @param {Number} lod
     * @return {Array<Number>} Pixel color
     */
    sample(sampler:Sampler, texCoord:number[], lod:number):number[] {
        return sampleLevelArray3D(this.m_levels, this.m_numLevels, sampler, texCoord[0], texCoord[1], texCoord[2], lod);
    }
}
/* TODO: All view classes are very similar. They should have a common base class */

/**
 * @param {Number} width
 * @param {Number} height
 * @return {Number} Number of pyramid levels
 */
function computeMipPyramidLevels(width:number, height?:number):number {
    var h = height || width;
    return Math.floor(Math.log2(Math.max(width, h))) + 1;
}

/**
 * @param {Number} baseLevelSize
 * @param {Number} levelNdx
 */
function getMipPyramidLevelSize(baseLevelSize:number, levelNdx:number):number {
    return Math.max(baseLevelSize >> levelNdx, 1);
}

/**
 * @param {Array<Number>} coords Vec3 cube coordinates
 * @return {CubeFaceCoords}
 */
function getCubeFaceCoords(coords:number[]):CubeFaceCoords {
    var face = selectCubeFace(coords);
    return new CubeFaceCoords(face, projectToFace(face, coords));
}

/**
 * @extends {TextureLevelPyramid}
 */
export class Texture2D extends TextureLevelPyramid {
    private m_width:number;
    private m_height:number;
    private m_view:Texture2DView;

    /**
     * @constructor
     * @param {TextureFormat} format
     * @param {Number} width
     * @param {Number} height
     */
    constructor(format:TextureFormat, width:number, height:number) {
        super(format, computeMipPyramidLevels(width, height));
        this.m_width = width;
        this.m_height = height;
        this.m_view = new Texture2DView(this.getNumLevels(), this.getLevels());
    }

    /**
     * @param {Number} baseLevel
     * @param {Number} maxLevel
     * @return {Texture2DView}
     */
    getSubView(baseLevel:number, maxLevel:number):Texture2DView {
        return this.m_view.getSubView(baseLevel, maxLevel);
    }

    /**
     * @param {Number} levelNdx
     */
    allocLevel(levelNdx:number):void {
        DE_ASSERT(deMath.deInBounds32(levelNdx, 0, this.getNumLevels()));

        var width = getMipPyramidLevelSize(this.m_width, levelNdx);
        var height = getMipPyramidLevelSize(this.m_height, levelNdx);

        // console.log('w ' + width + ' h ' + height);
        TextureLevelPyramid.prototype.allocLevel.call(this, levelNdx, width, height, 1);
    }
}

/**
 * \brief Texture2DArray
 * @extends {TextureLevelPyramid}
 */
export class Texture2DArray extends TextureLevelPyramid {
    private m_width:number;
    private m_height:number;
    private m_numLayers:number;
    private m_view:Texture2DArrayView;

    /**
     * @constructor
     * @param {TextureFormat} format
     * @param {Number} width
     * @param {Number} height
     * @param {Number} numLayers
     */
    constructor(format:TextureFormat, width:number, height:number, numLayers:number) {
        super(format, computeMipPyramidLevels(width, height));
        this.m_width = width;
        this.m_height = height;
        this.m_numLayers = numLayers;
        this.m_view = new Texture2DArrayView(this.getNumLevels(), this.getLevels());
    }

    /** @return {Texture2DArrayView} */
    getView():Texture2DArrayView {
        return this.m_view;
    }

    /**
     * @param {Number} levelNdx
     */
    allocLevel(levelNdx:number) {
        DE_ASSERT(deMath.deInBounds32(levelNdx, 0, this.getNumLevels()));

        var width = getMipPyramidLevelSize(this.m_width, levelNdx);
        var height = getMipPyramidLevelSize(this.m_height, levelNdx);

        TextureLevelPyramid.prototype.allocLevel.call(this, levelNdx, width, height, this.m_numLayers);
    }
}

/**
 * \brief Texture3D
 * @extends {TextureLevelPyramid}
 */
export class Texture3D extends TextureLevelPyramid {
    private m_width:number;
    private m_height:number;
    private m_depth:number;
    private m_view:Texture3DView;

    /**
     * @constructor
     * @param {TextureFormat} format
     * @param {Number} width
     * @param {Number} height
     * @param {Number} depth
     */
    constructor(format:TextureFormat, width:number, height:number, depth:number) {
        super(format, computeMipPyramidLevels(width, height));
        this.m_width = width;
        this.m_height = height;
        this.m_depth = depth;
        this.m_view = new Texture3DView(this.getNumLevels(), this.getLevels());
    }

    /**
     * @param {Number} baseLevel
     * @param {Number} maxLevel
     * @return {Texture3DView}
     */
    getSubView(baseLevel:number, maxLevel:number):Texture3DView {
        return this.m_view.getSubView(baseLevel, maxLevel);
    }

    /**
     * @param {Number} levelNdx
     */
    allocLevel(levelNdx:number) {
        DE_ASSERT(deMath.deInBounds32(levelNdx, 0, this.getNumLevels()));

        var width = getMipPyramidLevelSize(this.m_width, levelNdx);
        var height = getMipPyramidLevelSize(this.m_height, levelNdx);
        var depth = getMipPyramidLevelSize(this.m_depth, levelNdx);

        TextureLevelPyramid.prototype.allocLevel.call(this, levelNdx, width, height, depth);
    }
}

class TextureCubeView {
    private m_numLevels:number;
    private m_levels:ConstPixelBufferAccess[][];

    /**
     * @constructor
     * @param {Number} numLevels
     * @param {Array<Array<ConstPixelBufferAccess>>} levels
     */
    constructor(numLevels:number, levels:ConstPixelBufferAccess[][]) {
        this.m_numLevels = numLevels;
        this.m_levels = levels;
    }

    /**
     * @param {Sampler} sampler
     * @param {Array<Number>} texCoord
     * @param {Number} lod
     * @return {Array<Number>} Pixel color
     */
    sample(sampler:Sampler, texCoord:number[], lod:number):number[] {
        DE_ASSERT(sampler.compare == CompareMode.COMPAREMODE_NONE);

        // Computes (face, s, t).
        var coords = getCubeFaceCoords(texCoord);
        if (sampler.seamlessCubeMap) {
            DE_ASSERT(false); // TODO: Implement sampleLevelArrayCubeSeamless
            //return sampleLevelArrayCubeSeamless(this.m_levels, this.m_numLevels, coords.face, sampler, coords.s, coords.t, 0 /* depth */, lod);
            return [0, 0, 0, 0];
        }
        else {
            return sampleLevelArray2D(this.m_levels[coords.face], this.m_numLevels, sampler, coords.s, coords.t, 0 /* depth */, lod);
        }
    }

    /**
     * @param {CubeFace} face
     * @return {Array<ConstPixelBufferAccess>}
     */
    getFaceLevels(face:CubeFace):ConstPixelBufferAccess[] {
        return this.m_levels[face];
    }

    /** @return {Number} */
    getSize():number {
        return this.m_numLevels > 0 ? this.m_levels[0][0].getWidth() : 0;
    }

    /**
     * @param {Number} baseLevel
     * @param {Number} maxLevel
     * @return {TextureCubeView}
     */
    getSubView(baseLevel:number, maxLevel:number):TextureCubeView {
        var clampedBase = deMath.clamp(baseLevel, 0, this.m_numLevels - 1);
        var clampedMax = deMath.clamp(maxLevel, clampedBase, this.m_numLevels - 1);
        var numLevels = clampedMax - clampedBase + 1;
        var levels = [];
        for (var face = 0; face < CubeFace.TOTAL_FACES; face++)
            levels.push(this.getFaceLevels(face).slice(clampedBase, numLevels));

        return new TextureCubeView(numLevels, levels);
    }
}

export class TextureCube {
    private m_format:TextureFormat;
    private m_size:number;
    private m_data:DeqpArrayBuffer[][];
    private m_access:ConstPixelBufferAccess[][];
    private m_view:TextureCubeView;

    /**
     * @constructor
     * @param {TextureFormat} format
     * @param {Number} size
     */
    constructor(format:TextureFormat, size:number) {
        this.m_format = format;
        this.m_size = size;
        this.m_data = [];
        this.m_data.length = CubeFace.TOTAL_FACES;
        this.m_access = [];
        this.m_access.length = CubeFace.TOTAL_FACES;

        var numLevels = computeMipPyramidLevels(this.m_size);
        var levels = [];
        levels.length = CubeFace.TOTAL_FACES;

        for (var face = 0; face < CubeFace.TOTAL_FACES; face++) {
            this.m_data[face] = [];
            for (var i = 0; i < numLevels; i++)
                this.m_data[face].push(new DeqpArrayBuffer());
            this.m_access[face] = [];
            this.m_access[face].length = numLevels;
            levels[face] = this.m_access[face];
        }

        this.m_view = new TextureCubeView(numLevels, levels);
    }

    /** @return {TextureFormat} */
    getFormat():TextureFormat {
        return this.m_format;
    }

    /** @return {Number} */
    getSize():number {
        return this.m_size;
    }

    /**
     * @param {Number} ndx Level index
     * @param {CubeFace} face
     * @return {ConstPixelBufferAccess}
     */
    getLevelFace(ndx:number, face:CubeFace):ConstPixelBufferAccess {
        return this.m_access[face][ndx];
    }

    /** @return {Number} */
    getNumLevels():number {
        return this.m_access[0].length;
    }

    /**
     * @param {Sampler} sampler
     * @param {Array<Number>} texCoord
     * @param {Number} lod
     * @return {Array<Number>} Pixel color
     */
    sample(sampler:Sampler, texCoord:number[], lod:number):number[] {
        return this.m_view.sample(sampler, texCoord, lod);
    }

    /**
     * @param {Number} baseLevel
     * @param {Number} maxLevel
     * @return {TextureCubeView}
     */
    getSubView(baseLevel:number, maxLevel:number):TextureCubeView {
        return this.m_view.getSubView(baseLevel, maxLevel);
    }

    /**
     * @param {CubeFace} face
     * @param {Number} levelNdx
     * @return {boolean}
     */
    isLevelEmpty(face:CubeFace, levelNdx:number):boolean {
        return this.m_data[face][levelNdx].empty();
    }

    /**
     * @param {CubeFace} face
     * @param {Number} levelNdx
     */
    allocLevel(face:CubeFace, levelNdx:number):void {
        var size:number = getMipPyramidLevelSize(this.m_size, levelNdx);
        var dataSize:number = this.m_format.getPixelSize() * size * size;
        DE_ASSERT(this.isLevelEmpty(face, levelNdx));

        this.m_data[face][levelNdx].setStorage(dataSize);
        this.m_access[face][levelNdx] = new PixelBufferAccess({
            format: this.m_format,
            width: size,
            height: size,
            depth: 1,
            data: this.m_data[face][levelNdx].m_ptr
        });
    }
}

/**
 * @param {Array<Number>} coords Cube coordinates
 * @return {CubeFace}
 */
export function selectCubeFace(coords:number[]):CubeFace {
    var x = coords[0];
    var y = coords[1];
    var z = coords[2];
    var ax = Math.abs(x);
    var ay = Math.abs(y);
    var az = Math.abs(z);

    if (ay < ax && az < ax)
        return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
    else if (ax < ay && az < ay)
        return y >= 0 ? CubeFace.CUBEFACE_POSITIVE_Y : CubeFace.CUBEFACE_NEGATIVE_Y;
    else if (ax < az && ay < az)
        return z >= 0 ? CubeFace.CUBEFACE_POSITIVE_Z : CubeFace.CUBEFACE_NEGATIVE_Z;
    else {
        // Some of the components are equal. Use tie-breaking rule.
        if (ax == ay) {
            if (ax < az)
                return z >= 0 ? CubeFace.CUBEFACE_POSITIVE_Z : CubeFace.CUBEFACE_NEGATIVE_Z;
            else
                return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
        } else if (ax == az) {
            if (az < ay)
                return y >= 0 ? CubeFace.CUBEFACE_POSITIVE_Y : CubeFace.CUBEFACE_NEGATIVE_Y;
            else
                return z >= 0 ? CubeFace.CUBEFACE_POSITIVE_Z : CubeFace.CUBEFACE_NEGATIVE_Z;
        } else if (ay == az) {
            if (ay < ax)
                return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
            else
                return y >= 0 ? CubeFace.CUBEFACE_POSITIVE_Y : CubeFace.CUBEFACE_NEGATIVE_Y;
        } else
            return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
    }
}

/**
 * @param {CubeFace} face
 * @param {Array<Number>} coord  Cube coordinates (Vec3)
 * @return {Array<Number>} face coordinates (Vec2)
 */
function projectToFace(face:CubeFace, coord:number[]):number[] {
    var rx = coord[0];
    var ry = coord[1];
    var rz = coord[2];
    var sc = 0;
    var tc = 0;
    var ma = 0;

    switch (face) {
        case CubeFace.CUBEFACE_NEGATIVE_X:
            sc = +rz;
            tc = -ry;
            ma = -rx;
            break;
        case CubeFace.CUBEFACE_POSITIVE_X:
            sc = -rz;
            tc = -ry;
            ma = +rx;
            break;
        case CubeFace.CUBEFACE_NEGATIVE_Y:
            sc = +rx;
            tc = -rz;
            ma = -ry;
            break;
        case CubeFace.CUBEFACE_POSITIVE_Y:
            sc = +rx;
            tc = +rz;
            ma = +ry;
            break;
        case CubeFace.CUBEFACE_NEGATIVE_Z:
            sc = -rx;
            tc = -ry;
            ma = -rz;
            break;
        case CubeFace.CUBEFACE_POSITIVE_Z:
            sc = +rx;
            tc = -ry;
            ma = +rz;
            break;
        default:
            throw new Error('Unrecognized face ' + face);
    }

    // Compute s, t
    var s = ((sc / ma) + 1) / 2;
    var t = ((tc / ma) + 1) / 2;

    return [s, t];
}
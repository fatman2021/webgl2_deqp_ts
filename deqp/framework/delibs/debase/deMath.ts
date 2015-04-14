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

var DE_ASSERT = function(x: boolean): void {
    if (!x)
        throw new Error('Assert failed');
};

/* Dummy type */
var deUint32 = function() {};

export var deInRange32 = function(a: number, mn: number, mx: number): boolean {
    return (a >= mn) && (a <= mx);
};

export var deInBounds32 = function(a: number, mn: number, mx: number): boolean {
    return (a >= mn) && (a < mx);
};

/**
 * Check if a value is a power-of-two.
 * @param {number} a Input value.
 * @return {boolean} return True if input is a power-of-two value, false otherwise.
 * (Also returns true for zero).
 */
export var deIsPowerOfTwo32 = function(a: number): boolean
{
    return ((a & (a - 1)) == 0);
};

/**
 * Align an integer to given power-of-two size.
 * @param {number} val The number to align.
 * @param {number} align The size to align to.
 * @return {number} The aligned value
 */
export var deAlign32 = function(val: number, align: number): number {
    DE_ASSERT(deIsPowerOfTwo32(align));
    return ((val + align - 1) & ~(align - 1)) & 0xFFFFFFFF; //0xFFFFFFFF make sure it returns a 32 bit calculation in 64 bit browsers.
};

/**
 * Compute the bit population count of an integer.
 * @param {number} a
 * @return {number} The number of one bits in
 */
export var dePop32 = function(a: number): number {
    /** @type {deUint32} */ var mask0 = 0x55555555; /* 1-bit values. */
    /** @type {deUint32} */ var mask1 = 0x33333333; /* 2-bit values. */
    /** @type {deUint32} */ var mask2 = 0x0f0f0f0f; /* 4-bit values. */
    /** @type {deUint32} */ var mask3 = 0x00ff00ff; /* 8-bit values. */
    /** @type {deUint32} */ var mask4 = 0x0000ffff; /* 16-bit values. */
    /** @type {deUint32} */ var t = a & 0xFFFFFFFF; /* Crop to 32-bit value */
    t = (t & mask0) + ((t >> 1) & mask0);
    t = (t & mask1) + ((t >> 2) & mask1);
    t = (t & mask2) + ((t >> 4) & mask2);
    t = (t & mask3) + ((t >> 8) & mask3);
    t = (t & mask4) + (t >> 16);
    return t;
};

export var clamp = function(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(val, max));
};

export var imod = function(a: number, b: number): number {
    var m = a % b;
    return m < 0 ? m + b : m;
};

export var mirror = function(a: number): number {
    return a >= 0 ? a : -(1 + a);
};

/**
 * @param {Array.<number>} a Source array
 * @param {Array.<number>} indices
 * @return {Array.<number>} Swizzled array
 */
export var swizzle = function(a: number[], indices: number[]): number[] {
    if (!indices.length)
        throw new Error('Argument must be an array');
    var dst = [];
    for (var i = 0; i < indices.length; i++)
        dst.push(a[indices[i]]);
    return dst;
};

/**
 * Multiply two vectors, element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} Result array
 */
export var multiply = function(a: number[], b: number[]): number[] {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] * b[i]);
    return dst;
};

/**
 * Add two vectors, element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} Result array
 */
export var add = function(a: number[], b: number[]): number[] {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] + b[i]);
    return dst;
};

/**
 * Subtract two vectors, element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} Result array
 */
export var subtract = function(a: number[], b: number[]): number[] {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] - b[i]);
    return dst;
};

/**
 * Calculate absolute difference between two vectors
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} abs(diff(a - b))
 */
export var absDiff = function(a: ArrayLike<number>, b: ArrayLike<number>): number[] {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.abs(a[i] - b[i]));
    return dst;
};

/**
 * Is a <= b (element by element)?
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<boolean>} Result array of booleans
 */
export var lessThanEqual = function(a: ArrayLike<number>, b: ArrayLike<number>): boolean[] {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] <= b[i]);
    return dst;
};

/**
 * Are all values in the array true?
 * @param {Array.<number>} a
 * @return {boolean}
 */
export var boolAll = function(a: boolean[]): boolean {
    for (var i = 0; i < a.length; i++)
        if (!a[i])
            return false;
    return true;
};

/**
 * max(a, b) element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
export function max<T extends ArrayLike<number>, U extends ArrayLike<number>>(a: T, b: U): T {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = a.constructor(a.length);//[];
    for (var i = 0; i < a.length; i++)
        dst[i] = Math.max(a[i], b[i]);
    return dst;
}

/**
 * min(a, b) element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
export var min = function(a: number[], b: number[]): number[] {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.min(a[i], b[i]));
    return dst;
};

// Nearest-even rounding in case of tie (fractional part 0.5), otherwise ordinary rounding.
export var rint = function(a: number): number {
    var floorVal = Math.floor(a);
    var fracVal = a - floorVal;

    if (fracVal != 0.5)
        return Math.round(a); // Ordinary case.

    var roundUp = (floorVal % 2) != 0;

    return floorVal + (roundUp ? 1 : 0);
};

/** deMathHash
 * @param {number} a
 * @return {number}
 */
export var deMathHash = function(a: number): number {
    var key = a;
    key = (key ^ 61) ^ (key >> 16);
    key = key + (key << 3);
    key = key ^ (key >> 4);
    key = key * 0x27d4eb2d; /* prime/odd constant */
    key = key ^ (key >> 15);
    return key;
};

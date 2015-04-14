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

declare function assertMsgOptions(assertion, msg, verbose, exthrow);
declare function bufferedLogToConsole(msg);
declare function testFailedOptions(msg, exthrow);

/**
 * Description of a vertex array binding
 * @param {number} type GL Type of data
 * @param {string|number} location Binding location
 * @param {number} components Number of components per vertex
 * @param {number} elements Number of elements in the array
 * @param {Array.<number>} data Source data
 */
export class VertexArrayBinding {
    constructor(public type: number, public location: string | number, public components: number, public elements: number, public data: number[]) {
    }
}

/**
 * ! Lower named bindings to locations and eliminate bindings that are not used by program.
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {number} program ID, ID of the shader program
 * @param {Array} inputArray, Array with the named binding locations
 * @param {Array} outputArray, Array with the lowered locations
 */
export function namedBindingsToProgramLocations(gl: WebGLRenderingContext, program, inputArray:VertexArrayBinding[], outputArray?: VertexArrayBinding[]): VertexArrayBinding[] {
    outputArray = outputArray || [];

    for (var i = 0; i < inputArray.length; i++)
    {
        var cur: VertexArrayBinding = inputArray[i];
        if (typeof cur.location === 'string')
        {
            //assert(binding.location >= 0);
            var location = gl.getAttribLocation(program.getProgram(), <string>cur.location);
            if (location >= 0)
            {
                // Add binding.location as an offset to accomodate matrices.
                outputArray.push(new VertexArrayBinding(cur.type, location, cur.components, cur.elements, cur.data));
            }
        }
        else
        {
            outputArray.push(cur);
        }
    }

    return outputArray;
}

/**
 * Creates vertex buffer, binds it and draws elements
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {number} program ID, vertexProgramID
 * @param {Array.<number>} vertexArrays
 * @param {PrimitiveList} primitives to draw
 * @param {function()} callback
 */
export function drawFromBuffers(gl: WebGL2RenderingContext, program, vertexArrays, primitives, callback) {
    /** TODO: finish implementation */
    var objects: WebGLBuffer[] = [];

    // Lower bindings to locations
    vertexArrays = namedBindingsToProgramLocations(gl, program, vertexArrays);

    for (var i = 0; i < vertexArrays.length; i++) {
        /** @type {WebGLBuffer} */ var buffer = vertexBuffer(gl, vertexArrays[i]);
        objects.push(buffer);
    }

    if (primitives.indices) {
        /** @type {WebGLBuffer} */ var elemBuffer = indexBuffer(gl, primitives);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);

        if (callback)
            callback.beforeDrawCall();

        drawIndexed(gl, primitives, 0);

        if (callback)
            callback.afterDrawCall();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    } else {
    /** TODO: implement */
    }

    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'drawArrays', false, true);
    for (var i = 0; i < vertexArrays.length; i++) {
        gl.disableVertexAttribArray(vertexArrays[i].location);
    }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

/**
 * Creates vertex buffer, binds it and draws elements
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {number} program ID, vertexProgramID
 * @param {Array.<number>} vertexArrays
 * @param {PrimitiveList} primitives to draw
 * @param {function()} callback
 */
export function draw(gl: WebGL2RenderingContext, program, vertexArrays, primitives, callback) {
    /** TODO: finish implementation */
    /** @type {Array.<WebGLBuffer>} */ var objects = [];

    for (var i = 0; i < vertexArrays.length; i++) {
        /** @type {WebGLBuffer} */ var buffer = vertexBuffer(gl, vertexArrays[i]);
        objects.push(buffer);
    }

    if (primitives.indices) {
        /** @type {WebGLBuffer} */ var elemBuffer = indexBuffer(gl, primitives);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);

        if (callback)
            callback.beforeDrawCall();

        drawIndexed(gl, primitives, 0);

        if (callback)
            callback.afterDrawCall();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    } else {
    /** TODO: implement */
    }

  assertMsgOptions(gl.getError() === gl.NO_ERROR, 'drawArrays', false, true);
    for (var i = 0; i < vertexArrays.length; i++) {
        gl.disableVertexAttribArray(vertexArrays[i].location);
    }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

/**
 * Creates vertex buffer, binds it and draws elements
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {PrimitiveList} primitives Primitives to draw
 * @param {number} offset
 */
function drawIndexed(gl: WebGL2RenderingContext, primitives, offset): void {
/** @type {WebGLRenderingContext.GLEnum} */ var mode = getPrimitiveGLType(gl, primitives.type);
    /** TODO: C++ implementation supports different index types, we use only int16.
        Could it cause any issues?

        deUint32 indexGLType = getIndexGLType(primitives.indexType);
    */

    gl.drawElements(mode, primitives.indices.length, gl.UNSIGNED_SHORT, offset);
}

/**
 * Enums for primitive types
 * @enum
 */
export enum  primitiveType {
    TRIANGLES,
    TRIANGLE_STRIP,
    TRIANGLE_FAN,

    LINES,
    LINE_STRIP,
    LINE_LOOP,

    POINTS,

    PATCHES
}

/**
 * get GL type from primitive type
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {primitiveType} type primitiveType
 * @return {WebGLRenderingContext.GLEnum} GL primitive type
 */
export function getPrimitiveGLType(gl: WebGL2RenderingContext, type): number {
    switch (type) {
        case primitiveType.TRIANGLES: return gl.TRIANGLES;
        case primitiveType.TRIANGLE_STRIP: return gl.TRIANGLE_STRIP;
        case primitiveType.TRIANGLE_FAN: return gl.TRIANGLE_FAN;
        case primitiveType.LINES: return gl.LINES;
        case primitiveType.LINE_STRIP: return gl.LINE_STRIP;
        case primitiveType.LINE_LOOP: return gl.LINE_LOOP;
        case primitiveType.POINTS: return gl.POINTS;
//      case primitiveType.PATCHES: return gl.PATCHES;
        default:
            testFailedOptions('Unknown primitive type ' + type, true);
            return undefined;
    }
}

/**
 * Calls PrimitiveList() to create primitive list for Triangles
 * @param {number} indices
 */
export function triangles(indices) {
    return new PrimitiveList(primitiveType.TRIANGLES, indices);
}

/**
 * Calls PrimitiveList() to create primitive list for Patches
 * @param {number} indices
 */
export function patches(indices) {
    return new PrimitiveList(primitiveType.PATCHES, indices);
}

/**
 * Creates primitive list for Triangles or Patches, depending on type
 * @param {primitiveType} type primitiveType
 * @param {number} indices
 */
class PrimitiveList {
    constructor(public type:primitiveType, public indices:number) {
    }
}

/**
 * Create Element Array Buffer
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {PrimitiveList} primitives to construct the buffer from
 * @return {WebGLBuffer} indexObject buffer with elements
 */
function indexBuffer(gl: WebGL2RenderingContext, primitives) {
    /** @type {WebGLBuffer} */ var indexObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexObject);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bindBuffer', false, true);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(primitives.indices), gl.STATIC_DRAW);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bufferData', false, true);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return indexObject;
}

/**
 * Create Array Buffer
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {VertexArrayBinding} vertexArray primitives, Array buffer descriptor
 * @return {WebGLBuffer} buffer of vertices
 */
function vertexBuffer(gl: WebGL2RenderingContext, vertexArray) {
    /** @type {WebGLBuffer} */ var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bindBuffer', false, true);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray.data), gl.STATIC_DRAW);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bufferData', false, true);
    gl.enableVertexAttribArray(vertexArray.location);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'enableVertexAttribArray', false, true);
    gl.vertexAttribPointer(vertexArray.location, vertexArray.components, vertexArray.type, false, 0, 0);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'vertexAttribPointer', false, true);
    bufferedLogToConsole(vertexArray);
    return buffer;
}

export class Pixel {
    constructor(public rgba) {
    }

    getRed() {
        return this.rgba[0];
    }

    getGreen() {
        return this.rgba[1];
    }

    getBlue() {
        return this.rgba[2];
    }

    getAlpha() {
        return this.rgba[3];
    }

    equals(otherPixel:Pixel):boolean {
        return this.rgba[0] == otherPixel.rgba[0] &&
               this.rgba[1] == otherPixel.rgba[1] &&
               this.rgba[2] == otherPixel.rgba[2] &&
               this.rgba[3] == otherPixel.rgba[3];
    }
}

export class Surface
{
    buffer: Uint8Array;
    x: number;
    y: number;
    width: number;
    height: number;

    readSurface(gl, x: number, y: number, width: number, height: number)
    {
        this.buffer = new Uint8Array(width * height * 4);
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, this.buffer);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        return this.buffer;
    }

    getPixel(x: number, y: number): Pixel {
        var base = (x + y * this.width) * 4;
        var rgba = [
            this.buffer[base],
            this.buffer[base + 1],
            this.buffer[base + 2],
            this.buffer[base + 3]
        ];
        return new Pixel(rgba);
    }
}
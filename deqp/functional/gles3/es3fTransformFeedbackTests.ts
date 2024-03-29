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

import deqpUtils = require('framework/opengl/gluShaderUtil');
import deqpDraw = require('framework/opengl/gluDrawUtil');
import gluVT = require('framework/opengl/gluVarType');
import gluVTU = require('framework/opengl/gluVarTypeUtil');
import deqpProgram = require('framework/opengl/gluShaderProgram');
import deRandom = require('framework/delibs/debase/deRandom');
import deMath = require('framework/delibs/debase/deMath');
import deString = require('framework/delibs/debase/deString');
import deqpTests = require('framework/common/tcuTestCase');
import tcuSurface = require('framework/common/tcuSurface');
import tcuImageCompare = require('framework/common/tcuImageCompare');

/** @const @type {number} */ var VIEWPORT_WIDTH:number = 128;
/** @const @type {number} */ var VIEWPORT_HEIGHT:number = 128;
/** @const @type {number} */ var BUFFER_GUARD_MULTIPLIER:number = 2;

/**
 * Enums for interpolation
 * @enum {number}
 */

enum interpolation {
    SMOOTH,
    FLAT,
    CENTROID
}

/**
 * Returns interpolation name: smooth, flat or centroid
 * @param {number} interpol interpolation enum value
 * @return {string}
 */
function getInterpolationName(interpol:interpolation):string {
    switch (interpol) {
        case interpolation.SMOOTH:
            return 'smooth';
        case interpolation.FLAT:
            return 'flat';
        case interpolation.CENTROID:
            return 'centroid';
        default:
            throw new Error('Unrecognized interpolation name ' + interpol);
    }
}

function GLU_EXPECT_NO_ERROR(gl:WebGLRenderingContext, err, msg:string):void {
    if (err != gl.NO_ERROR) {
        if (msg) msg += ': ';

        msg += "gl.GetError() returned " + err;

        throw new Error(msg)
    }
}

function DE_ASSERT(x:boolean):void {
    if (!x)
        throw new Error('Assert failed');
}

/**
 * Returns a Varying object, it's a struct, invoked in the C version as a function
 * @param {string} name
 * @param {gluVT.VarType} type
 * @param {number} interpolation
 * @return {Object}
 */
class Varying {
    constructor(public name:string, public type:gluVT.VarType, public interpolation:interpolation) {
    }
}

/** findAttributeNameEquals
 * Replaces original implementation of "VaryingNameEquals" and "AttributeNameEquals" in the C++ version
 * Returns an Attribute or Varying object which matches its name with the passed string value in the function
 * @param {Array.<Attribute> || Array.<Varying>} array
 * @param {string} name
 * @return {Attribute || Varying}
 */
var findAttributeNameEquals = function (array, name) {
    for (var pos = 0; pos < array.length; pos++) {
        if (array[pos].name === name) {
            return array[pos];
        }
    }
};

/**
 * Constructs an Attribute object, it's a struct, invoked in the C version as a function
 * @param {string} name
 * @param {gluVT.VarType} type
 * @param {number} offset
 */
class Attribute {
    constructor(public name:string, public type:gluVT.VarType, public offset:number) {
    }
}

/**
 * Constructs an Output object
 */
class Output {
    constructor(public bufferNdx:number = 0,
                public offset:number = 0,
                public name:string = null,
                public type:gluVT.VarType = null,
                public inputs:Attribute[] = []) {
    }
}

/**
 * Constructs an object type DrawCall.
 * Contains the number of elements as well as whether the Transform Feedback is enabled or not.
 * It's a struct, but as occurs in Varying, is invoked in the C++ version as a function.
 * @param {number} numElements
 * @param {boolean} tfEnabled is Transform Feedback enabled or not
 */
class DrawCall {
    constructor(public numElements:number, public transformFeedbackEnabled:boolean) {
    }
}

// it's a class
class ProgramSpec {

    /** @type {Array.<gluVT.StructType>} */ m_structs:gluVT.StructType[] = [];
    /** @type {Array.<Varying>}          */ m_varyings:Varying[] = [];
    /** @type {Array.<string>}           */ m_transformFeedbackVaryings:string[] = [];

    createStruct(name:string):gluVT.StructType {
        var struct = gluVT.newStructType(name);
        this.m_structs.push(struct);
        return struct;
    }

    addVarying(name:string, type:gluVT.VarType, interp:number):void {
        this.m_varyings.push(new Varying(name, type, interp));
    }

    addTransformFeedbackVarying(name:string):void {
        this.m_transformFeedbackVaryings.push(name);
    }

    getStructs():gluVT.StructType[] {
        return this.m_structs;
    }

    getVaryings():Varying[] {
        return this.m_varyings;
    }

    getTransformFeedbackVaryings():string[] {
        return this.m_transformFeedbackVaryings;
    }

    isPointSizeUsed():boolean {
        for (var i = 0; i < this.m_transformFeedbackVaryings.length; ++i) {
            if (this.m_transformFeedbackVaryings[i] == 'gl_PointSize')
                return true;
        }
        return false;
    }
}

/** Returns if the program is supported or not
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {ProgramSpec} spec
 * @param {number} tfMode
 * @return {boolean}
 */
var isProgramSupported = function (gl, spec:ProgramSpec, tfMode:number):boolean {

    var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    var maxTfInterleavedComponents = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS);
    var maxTfSeparateAttribs = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS);
    var maxTfSeparateComponents = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS);

    // Check vertex attribs.
    var totalVertexAttribs:number = (
    1 /* a_position */ + (spec.isPointSizeUsed() ? 1 : 0)
    );

    for (var i = 0; i < spec.getVaryings().length; ++i) {
        for (var v_iter = new gluVTU.VectorTypeIterator(spec.getVaryings()[i].type); !v_iter.end(); v_iter.next()) {
            totalVertexAttribs += 1;
        }
    }

    if (totalVertexAttribs > maxVertexAttribs)
        return false; // Vertex attribute count exceeded.

    // check varyings
    /** @type {number}                  */ var totalTfComponents = 0;
    /** @type {number}                  */ var totalTfAttribs = 0;
    /** @type {Object.<number, number>} */ var presetNumComponents = {
        gl_Position: 4,
        gl_PointSize: 1
    };
    for (var i = 0; i < spec.getTransformFeedbackVaryings().length; ++i) {
        /** @type {Array.<string>} */ var name = spec.getTransformFeedbackVaryings()[i];
        /** @type {number} */ var numComponents = 0;

        if (typeof(presetNumComponents[name]) != 'undefined') {
            numComponents = presetNumComponents[name];
        } else {
            var varName = gluVTU.parseVariableName(name);
            // find the varying called varName
            /** @type {Varying} */ var varying = (function (varyings) {
                for (var i = 0; i < varyings.length; ++i) {
                    if (varyings[i].name == varName) {
                        return varyings[i];
                    }
                }
                return null;
            }(spec.getVaryings()));

            // glu::TypeComponentVector
            var varPath = gluVTU.parseTypePath(name, varying.type);
            numComponents = gluVTU.getVarType(varying.type, varPath).getScalarSize();
        }

        if (tfMode == gl.SEPARATE_ATTRIBS && numComponents > maxTfSeparateComponents)
            return false; // Per-attribute component count exceeded.

        totalTfComponents += numComponents;
        totalTfAttribs += 1;
    }

    if (tfMode == gl.SEPARATE_ATTRIBS && totalTfAttribs > maxTfSeparateAttribs)
        return false;

    if (tfMode == gl.INTERLEAVED_ATTRIBS && totalTfComponents > maxTfInterleavedComponents)
        return false;

    return true;

};

/**
 * @param {string} varyingName
 * @param {Array.<string>} path
 * @return {string}
 */
var getAttributeName = function (varyingName:string, path):string {
    var str = 'a_' + varyingName.substr(/^v_/.test(varyingName) ? 2 : 0);

    for (var i = 0; i < path.length; ++i) {
        var prefix:string;

        switch (path[i].type) {
            case gluVTU.ComponentType.STRUCT_MEMBER:
                prefix = '_m';
                break;
            case gluVTU.ComponentType.ARRAY_ELEMENT:
                prefix = '_e';
                break;
            case gluVTU.ComponentType.MATRIX_COLUMN:
                prefix = '_c';
                break;
            case gluVTU.ComponentType.VECTOR_COMPONENT:
                prefix = '_s';
                break;
            default:
                throw new Error('invalid type in the component path.');
        }
        str += prefix + path[i].index;
    }
    return str;
};

/**
 * original definition:
 * static void genShaderSources (const ProgramSpec& spec, std::string& vertSource, std::string& fragSource, bool pointSizeRequired)
 * in place of the std::string references, this function returns those params in an object
 *
 * @param {ProgramSpec} spec
 * @param {boolean} pointSizeRequired
 * @return {Object.<string, string>}
 */
var genShaderSources = function (spec, pointSizeRequired) {

    var vtx = {str: null};
    var frag = {str: null};
    var addPointSize = spec.isPointSizeUsed();

    vtx.str = '#version 300 es\n'
    + 'in highp vec4 a_position;\n';
    frag.str = '#version 300 es\n'
    + 'layout(location = 0) out mediump vec4 o_color;\n'
    + 'uniform highp vec4 u_scale;\n'
    + 'uniform highp vec4 u_bias;\n';

    if (addPointSize) {
        vtx.str += 'in highp float a_pointSize;\n';
    }

    // Declare attributes.
    for (var i = 0; i < spec.getVaryings().length; ++i) {

        /** @type {string} */ var name = spec.getVaryings()[i].name;
        /** @type {gluVarType.VarType} */ var type = spec.getVaryings()[i].type;

        // TODO: check loop, original code:
        // for (glu::VectorTypeIterator vecIter = glu::VectorTypeIterator::begin(&type); vecIter != glu::VectorTypeIterator::end(&type); vecIter++)
        for (var vecIter = new gluVTU.VectorTypeIterator(type); !vecIter.end(); vecIter.next()) {

            /** @type {gluVarType.VarType} */
            var attribType = gluVTU.getVarType(type, vecIter.getPath());

            /** @type {string} */
            var attribName = getAttributeName(name, vecIter.getPath());

            // TODO: only strings are needed for attribType, attribName
            vtx.str += 'in ' + gluVT.declareVariable(attribType, attribName) + ';\n';

        }
    }

    // Declare varyings.
    for (var ndx = 0; ndx < 2; ++ndx) {
        /** @type {string} */ var inout = ndx ? 'in' : 'out';
        /** @type {string} */ var shader = ndx ? frag : vtx;

        for (var i = 0; i < spec.getStructs().length; ++i) {
            var struct = spec.getStructs()[i];
            if (struct.hasTypeName()) {
                shader.str += gluVT.declareStructType(struct) + ';\n'; // TODO: only a string is needed for struct
            }
        }

        /** @type {Array.<Varying>} */ var varyings = spec.getVaryings();
        for (var i = 0; i < varyings.length; ++i) {
            var varying = varyings[i];
            shader.str += getInterpolationName(varying.interpolation)
            + ' ' + inout + ' '
            + gluVT.declareVariable(varying.type, varying.name) // TODO: only strings are needed for varyings.type and varyings.name
            + ';\n';
        }
    }

    vtx.str += '\nvoid main (void)\n{\n'
    + '\tgl_Position = a_position;\n';
    frag.str += '\nvoid main (void)\n{\n'
    + '\thighp vec4 res = vec4(0.0);\n';

    if (addPointSize) {
        vtx.str += '\tgl_PointSize = a_pointSize;\n';
    } else if (pointSizeRequired) {
        vtx.str += '\tgl_PointSize = 1.0;\n';
    }

    for (var i = 0; i < spec.getVaryings().length; ++i) {
        /** @type {string} */ var name = spec.getVaryings()[i].name;
        /** @type {gluVarType.VarType} */ var type = spec.getVaryings()[i].type;

        // TODO: check this loop, original code:
        // for (glu::VectorTypeIterator vecIter = glu::VectorTypeIterator::begin(&type); vecIter != glu::VectorTypeIterator::end(&type); vecIter++)
        for (var vecIter = new gluVTU.VectorTypeIterator(type); !vecIter.end(); vecIter.next()) {
            /** @type {gluVarType.VarType} */var subType = gluVTU.getVarType(type, vecIter.getPath());
            /** @type {string} */ var attribName = getAttributeName(name, vecIter.getPath());

            if (!(
                subType.isBasicType() &&
                deqpUtils.isDataTypeScalarOrVector(subType.getBasicType())
                )) throw new Error('Not a scalar or vector.');

            /* TODO: Fix converting type and vecIter to string */

            // Vertex: assign from attribute.
            vtx.str += '\t' + name + vecIter.toString() + ' = ' + attribName + ';\n';

            // Fragment: add to res variable.
            var scalarSize = deqpUtils.getDataTypeScalarSize(subType.getBasicType());

            frag.str += '\tres += ';
            if (scalarSize == 1) frag.str += 'vec4(' + name + vecIter.toString() + ')';
            else if (scalarSize == 2) frag.str += 'vec2(' + name + vecIter.toString() + ').xxyy';
            else if (scalarSize == 3) frag.str += 'vec3(' + name + vecIter.toString() + ').xyzx';
            else if (scalarSize == 4) frag.str += 'vec4(' + name + vecIter.toString() + ')';

            frag.str += ';\n';
        }
    }

    frag.str += '\to_color = res * u_scale + u_bias;\n}\n';
    vtx.str += '}\n';

    return {
        vertSource: vtx.str,
        fragSource: frag.str
    };
};

/**
 * Returns a Shader program
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {ProgramSpec} spec
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 * @return {deqpProgram.ShaderProgram}
 */
var count = 0;
var createVertexCaptureProgram = function (gl, spec, bufferMode, primitiveType) {

    debugger;

    /** @type {Object.<string, string>} */ var source = genShaderSources(spec, primitiveType === deqpDraw.primitiveType.POINTS /* Is point size required? */);

    /** @type {deqpProgram.ShaderProgram} */ var programSources = new deqpProgram.ProgramSources();
    programSources.add(new deqpProgram.VertexSource(source.vertSource))
        .add(new deqpProgram.FragmentSource(source.fragSource))
        .add(new deqpProgram.TransformFeedbackVaryings(spec.getTransformFeedbackVaryings()))
        .add(new deqpProgram.TransformFeedbackMode(bufferMode));

    return new deqpProgram.ShaderProgram(gl, programSources);

};

/**
 * @param {Array.<Attribute>} attributes
 * @param {Array.<Varying>} varyings
 * @param {boolean} usePointSize
 * @return {Number} input stride
 */
var computeInputLayout = function (attributes, varyings, usePointSize) {

    var inputStride = 0;

    // Add position
    var dataTypeVec4 = gluVT.newTypeBasic(deqpUtils.DataType.FLOAT_VEC4, deqpUtils.precision.PRECISION_HIGHP);
    attributes.push(new Attribute('a_position', dataTypeVec4, inputStride));
    inputStride += 4 * 4;
    /*sizeof(deUint32)*/

    if (usePointSize) {
        var dataTypeFloat = gluVT.newTypeBasic(deqpUtils.DataType.FLOAT, deqpUtils.precision.PRECISION_HIGHP);
        attributes.push(new Attribute('a_pointSize', dataTypeFloat, inputStride));
        inputStride += 1 * 4;
        /*sizeof(deUint32)*/
    }

    for (var i = 0; i < varyings.length; i++) {
        // TODO: check loop's conditions
        // original code:
        // for (glu::VectorTypeIterator vecIter = glu::VectorTypeIterator::begin(&var->type); vecIter != glu::VectorTypeIterator::end(&var->type); vecIter++)

        for (var vecIter = new gluVTU.VectorTypeIterator(varyings[i].type); !vecIter.end(); vecIter.next()) {
            var type = vecIter.getType(); // originally getType() in getVarType() within gluVARTypeUtil.hpp.
            var name = getAttributeName(varyings[i].name, vecIter.getPath()); // TODO: getPath(), originally in gluVARTypeUtil.hpp

            attributes.push(new Attribute(name, type, inputStride));
            inputStride += deqpUtils.getDataTypeScalarSize(type.getBasicType()) * 4;
            /*sizeof(deUint32)*/
        }
    }

    return inputStride;
};

/**
 * @param {Array.<Output>} transformFeedbackOutputs
 * @param {Array.<Attribute>} attributes
 * @param {Array.<Varying>} varyings
 * @param {Array.<string>} transformFeedbackVaryings
 * @param {number} bufferMode
 */
var computeTransformFeedbackOutputs = function (gl, transformFeedbackOutputs, attributes, varyings, transformFeedbackVaryings, bufferMode) {

    /** @type {number} */ var accumulatedSize = 0;

    // transformFeedbackOutputs.resize(transformFeedbackVaryings.size());
    for (var varNdx = 0; varNdx < transformFeedbackVaryings.length; varNdx++) {
        /** @type {string} */ var name = transformFeedbackVaryings[varNdx];
        /** @type {number} */ var bufNdx = (bufferMode === gl.SEPARATE_ATTRIBS ? varNdx : 0);
        /** @type {number} */ var offset = (bufferMode === gl.SEPARATE_ATTRIBS ? 0 : accumulatedSize);
        /** @type {Output} */ var output = new Output();

        output.name = name;
        output.bufferNdx = bufNdx;
        output.offset = offset;

        if (name === 'gl_Position') {
            /** @type {Attribute} */ var posIn = findAttributeNameEquals(attributes, 'a_position');
            output.type = posIn.type;
            output.inputs.push(posIn);
        }
        else if (name === 'gl_PointSize') {
            /** @type {Attribute} */ var sizeIn = findAttributeNameEquals(attributes, 'a_pointSize');
            output.type = sizeIn.type;
            output.inputs.push(sizeIn);
        }
        else {
            /** @type {string} */ var varName = gluVTU.parseVariableName(name);
            /** @type {Varying} */ var varying = findAttributeNameEquals(varyings, varName);

            var varPath = gluVTU.parseTypePath(name, varying.type);
            output.type = gluVTU.getVarType(varying.type, varPath);

            // Add all vectorized attributes as inputs.
            // TODO: check loop, original code:
            // for (glu::VectorTypeIterator iter = glu::VectorTypeIterator::begin(&output.type); iter != glu::VectorTypeIterator::end(&output.type); iter++)
            for (var iter = new gluVTU.VectorTypeIterator(output.type); !iter.end(); iter.next()) {
                /** @type {array} */     var fullpath = varPath.concat(iter.getPath());
                /** @type {string} */    var attribName = getAttributeName(varName, fullpath);
                /** @type {Attribute} */ var attrib = findAttributeNameEquals(attributes, attribName);
                output.inputs.push(attrib);
            }
        }
        transformFeedbackOutputs.push(output);

        // TODO: getScalarSize() called correctly? already implemented in glsVarType.js
        accumulatedSize += output.type.getScalarSize() * 4;
        /*sizeof(deUint32)*/
    }
};

/**
 * @param {Attribute} attrib
 * @param {ArrayBuffer} buffer
 * @param {number} stride
 * @param {number} numElements
 * @param {deRandom} rnd
 */
var genAttributeData = function (attrib, buffer, stride, numElements, rnd) {

    /** @type {number} */ var elementSize = 4;
    /*sizeof(deUint32)*/
    /** @type {boolean} */ var isFloat = deqpUtils.isDataTypeFloatOrVec(attrib.type.getBasicType());
    /** @type {boolean} */ var isInt = deqpUtils.isDataTypeIntOrIVec(attrib.type.getBasicType());
    /** @type {boolean} */ var isUint = deqpUtils.isDataTypeUintOrUVec(attrib.type.getBasicType());

    // TODO: below type glsUBC.UniformFlags ?
    /** @type {deqpUtils.precision} */ var precision = attrib.type.getPrecision(); // TODO: getPrecision() called correctly? implemented in glsVarType.js

    /** @type {number} */ var numComps = deqpUtils.getDataTypeScalarSize(attrib.type.getBasicType());

    for (var elemNdx = 0; elemNdx < numElements; elemNdx++) {
        for (var compNdx = 0; compNdx < numComps; compNdx++) {
            /** @type {number} */ var offset = attrib.offset + elemNdx * stride + compNdx * elementSize;
            if (isFloat) {
                var pos = new Float32Array(buffer, offset, 1);
                switch (precision) {
                    case deqpUtils.precision.PRECISION_LOWP:
                        pos[0] = 0.25 * rnd.getInt(0, 4);
                        break;
                    case deqpUtils.precision.PRECISION_MEDIUMP:
                        pos[0] = rnd.getFloat(-1e3, 1e3);
                        break;
                    case deqpUtils.precision.PRECISION_HIGHP:
                        pos[0] = rnd.getFloat(-1e5, 1e5);
                        break;
                    default:
                        DE_ASSERT(false);
                }
            }
            else if (isInt) {
                var pos = new Int32Array(buffer, offset, 1);
                switch (precision) {
                    case deqpUtils.precision.PRECISION_LOWP:
                        pos[0] = rnd.getInt(-128, 127);
                        break;
                    case deqpUtils.precision.PRECISION_MEDIUMP:
                        pos[0] = rnd.getInt(-32768, 32767);
                        break;
                    case deqpUtils.precision.PRECISION_HIGHP:
                        pos[0] = rnd.getInt();
                        break;
                    default:
                        DE_ASSERT(false);
                }
            }
            else if (isUint) {
                var pos = new Uint32Array(buffer, offset, 1);
                switch (precision) {
                    case deqpUtils.precision.PRECISION_LOWP:
                        pos[0] = rnd.getInt(0, 255);
                        break;
                    case deqpUtils.precision.PRECISION_MEDIUMP:
                        pos[0] = rnd.getInt(0, 65535);
                        break;
                    case deqpUtils.precision.PRECISION_HIGHP:
                        pos[0] = Math.abs(rnd.getInt());
                        break;
                    default:
                        DE_ASSERT(false);
                }
            }
        }
    }
};

/**
 * @param {Array.<Attribute>} attributes
 * @param {number} numInputs
 * @param {number} inputStride
 * @param {deRandom} rnd
 * @return {ArrayBuffer}
 */
var genInputData = function (attributes, numInputs, inputStride, rnd) {
    var buffer = new ArrayBuffer(numInputs * inputStride);

    var position = findAttributeNameEquals(attributes, 'a_position');
    if (!position)
        throw new Error('Position attribute not found.');

    for (var ndx = 0; ndx < numInputs; ndx++) {
        var pos = new Float32Array(buffer, position.offset + inputStride * ndx, 4);
        pos[0] = rnd.getFloat(-1.2, 1.2);
        pos[1] = rnd.getFloat(-1.2, 1.2);
        pos[2] = rnd.getFloat(-1.2, 1.2);
        pos[3] = rnd.getFloat(0.1, 2.0);
    }

    var pointSizePos = findAttributeNameEquals(attributes, 'a_pointSize');
    if (pointSizePos)
        for (var ndx = 0; ndx < numInputs; ndx++) {
            var pos = new Float32Array(buffer, pointSizePos.offset + inputStride * ndx, 1);
            pos[0] = rnd.getFloat(1, 8);
        }

    // Random data for rest of components.
    for (var i = 0; i < attributes.length; i++) {
        if (attributes[i].name != 'a_position' && attributes[i].name != 'a_pointSize')
            genAttributeData(attributes[i], buffer, inputStride, numInputs, rnd);
    }

    return buffer;
};

/**
 * Returns the number of outputs with the count for the Primitives in the Transform Feedback.
 * @param {deqpDraw.primitiveType} primitiveType primitiveType that specifies what kind of primitive is
 * @param {number} numElements
 * @return {number}
 */
var getTransformFeedbackOutputCount = function (primitiveType, numElements) {

    switch (primitiveType) {
        case deqpDraw.primitiveType.TRIANGLES:
            return numElements - numElements % 3;
        case deqpDraw.primitiveType.TRIANGLE_STRIP:
            return Math.max(0, numElements - 2) * 3;
        case deqpDraw.primitiveType.TRIANGLE_FAN:
            return Math.max(0, numElements - 2) * 3;
        case deqpDraw.primitiveType.LINES:
            return numElements - numElements % 2;
        case deqpDraw.primitiveType.LINE_STRIP:
            return Math.max(0, numElements - 1) * 2;
        case deqpDraw.primitiveType.LINE_LOOP:
            return numElements > 1 ? numElements * 2 : 0;
        case deqpDraw.primitiveType.POINTS:
            return numElements;
        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
    }

};

/**
 * Returns a number with the count for the Primitives in the Transform Feedback.
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {deqpDraw.primitiveType} primitiveType primitiveType that specifies what kind of primitive is
 * @param {number} numElements
 * @return {number}
 */
/* Suspisciously, this looks like getTransformFeedbackOutputCount. */
var getTransformFeedbackPrimitiveCount = function (gl, primitiveType, numElements) {

    switch (primitiveType) {
        case deqpDraw.primitiveType.TRIANGLES:
            return numElements - numElements / 3;
        case deqpDraw.primitiveType.TRIANGLE_STRIP:
            return Math.max(0, numElements - 2);
        case deqpDraw.primitiveType.TRIANGLE_FAN:
            return Math.max(0, numElements - 2);
        case deqpDraw.primitiveType.LINES:
            return numElements - numElements / 2;
        case deqpDraw.primitiveType.LINE_STRIP:
            return Math.max(0, numElements - 1);
        case deqpDraw.primitiveType.LINE_LOOP:
            return numElements > 1 ? numElements : 0;
        case deqpDraw.primitiveType.POINTS:
            return numElements;
        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
    }

};

/**
 * Returns the type of Primitive Mode: Triangles for all Triangle Primitive's type and same for Line and Points.
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {deqpDraw.primitiveType} primitiveType primitiveType that specifies what kind of primitive is
 * @return {GLenum} primitiveType
 */
var getTransformFeedbackPrimitiveMode = function (gl, primitiveType) {

    switch (primitiveType) {
        case deqpDraw.primitiveType.TRIANGLES:
        case deqpDraw.primitiveType.TRIANGLE_STRIP:
        case deqpDraw.primitiveType.TRIANGLE_FAN:
            return gl.TRIANGLES;

        case deqpDraw.primitiveType.LINES:
        case deqpDraw.primitiveType.LINE_STRIP:
        case deqpDraw.primitiveType.LINE_LOOP:
            return gl.LINES;

        case deqpDraw.primitiveType.POINTS:
            return gl.POINTS;

        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
    }

};

/**
 * Returns the attribute index for a certain primitive type.
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {deqpDraw.primitiveType} primitiveType that specifies what kind of primitive is
 * @param {number} numInputs
 * @param {number} outNdx
 * @return {number}
 */
var getAttributeIndex = function (gl, primitiveType, numInputs, outNdx) {

    switch (primitiveType) {

        case deqpDraw.primitiveType.TRIANGLES:
            return outNdx;
        case deqpDraw.primitiveType.LINES:
            return outNdx;
        case deqpDraw.primitiveType.POINTS:
            return outNdx;

        case deqpDraw.primitiveType.TRIANGLE_STRIP:
        {
            /** @type {number} */ var triNdx = outNdx / 3;
            /** @type {number} */ var vtxNdx = outNdx % 3;
            return (triNdx % 2 != 0 && vtxNdx < 2) ? (triNdx + 1 - vtxNdx) : (triNdx + vtxNdx);
        }

        case deqpDraw.primitiveType.TRIANGLE_FAN:
            return (outNdx % 3 != 0) ? (outNdx / 3 + outNdx % 3) : 0;

        case deqpDraw.primitiveType.LINE_STRIP:
            return outNdx / 2 + outNdx % 2;

        case deqpDraw.primitiveType.LINE_LOOP:
        {
            var inNdx = outNdx / 2 + outNdx % 2;
            return inNdx < numInputs ? inNdx : 0;
        }

        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
    }

};

interface CompareBuffer { buffer: ArrayBuffer; offset: number; stride: number;
}
interface CompareBuffers { input: CompareBuffer; output: CompareBuffer;
}

/**
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {deqpDraw.primitiveType} primitiveType type number in deqpDraw.primitiveType
 * @param {Output} output
 * @param {number} numInputs
 * @param {Object} buffers
 * @return {boolean} isOk
 */
function compareTransformFeedbackOutput(gl:WebGLRenderingContext,
                                        primitiveType:deqpDraw.primitiveType,
                                        output:Output,
                                        numInputs:number,
                                        buffers:CompareBuffers) {

    var isOk = true;
    var outOffset = output.offset;

    var tmp_a = new Uint32Array(buffers.input.buffer);
    var tmp_b = new Uint32Array(buffers.output.buffer);

    for (var attrNdx = 0; attrNdx < output.inputs.length; attrNdx++) {
        var attribute = output.inputs[attrNdx];
        var type = attribute.type.getBasicType();
        var numComponents = deqpUtils.getDataTypeScalarSize(type);

        // TODO: below type glsUBC.UniformFlags ?
        var precision = attribute.type.getPrecision(); // TODO: getPrecision() called correctly? implemented in gluVarType.js

        var scalarType = deqpUtils.getDataTypeScalarType(type);
        var numOutputs = getTransformFeedbackOutputCount(primitiveType, numInputs);

        for (var outNdx = 0; isOk && outNdx < numOutputs; outNdx++) {
            var inNdx = getAttributeIndex(gl, primitiveType, numInputs, outNdx);

            for (var compNdx = 0; isOk && compNdx < numComponents; compNdx++) {
                var isEqual = false;

                if (scalarType === 'float') {
                    var outBuffer = new Float32Array(buffers.output.buffer, buffers.output.offset + buffers.output.stride * outNdx + outOffset + compNdx * 4, 1);
                    var inBuffer = new Float32Array(buffers.input.buffer, buffers.input.offset + buffers.input.stride * inNdx + attribute.offset + compNdx * 4, 1);
                    var difInOut = inBuffer[0] - outBuffer[0];
                    /* TODO: Original code used ULP comparison for highp and mediump precision. This could cause failures. */
                    switch (precision) {
                        case deqpUtils.precision.PRECISION_HIGHP:
                        {
                            isEqual = Math.abs(difInOut) < 0.1;
                            break;
                        }

                        case deqpUtils.precision.PRECISION_MEDIUMP:
                        {
                            isEqual = Math.abs(difInOut) < 0.1;
                            break;
                        }

                        case deqpUtils.precision.PRECISION_LOWP:
                        {
                            isEqual = Math.abs(difInOut) < 0.1;
                            break;
                        }
                        default:
                            DE_ASSERT(false);
                    }
                } else {
                    var outBuffer = new Uint32Array(buffers.output.buffer, buffers.output.offset + buffers.output.stride * outNdx + outOffset + compNdx * 4, 1);
                    var inBuffer = new Uint32Array(buffers.input.buffer, buffers.input.offset + buffers.input.stride * inNdx + attribute.offset + compNdx * 4, 1);
                    isEqual = (inBuffer[0] == outBuffer[0]); // Bit-exact match required for integer types.
                }

                if (!isEqual) {
                    bufferedLogToConsole('Mismatch in ' + output.name + ' (' + attribute.name + '), output = ' + outNdx + ', input = ' + inNdx + ', component = ' + compNdx);
                    debug('Mismatch in ' + output.name + ' (' + attribute.name + '), output = ' + outNdx + ', input = ' + inNdx + ', component = ' + compNdx + ', input offset = ' +
                    (buffers.input.offset + buffers.input.stride * inNdx + attribute.offset + compNdx * 4) + ', output offset = ' +
                    (buffers.output.offset + buffers.output.stride * outNdx + outOffset + compNdx * 4));
                    isOk = false;
                    debugger;
                    break;
                }
            }
        }

        outOffset += numComponents * 4;
    }

    return isOk;
}

/**
 * Returns (for all the draw calls) the type of Primitive Mode, as it calls "getTransformFeedbackPrimitiveCount".
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 * @param {Object.<number, boolean>} array DrawCall object
 * @return {number} primCount
 */
var computeTransformFeedbackPrimitiveCount = function (gl, primitiveType, array) {

    /** @type {number} */ var primCount = 0;

    for (var i = 0; i < array.length; ++i) {
        if (array[i].transformFeedbackEnabled)
            primCount += getTransformFeedbackPrimitiveCount(gl, primitiveType, array[i].numElements);
    }

    return primCount;
};

/**
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {number} target
 * @param {number} bufferSize
 * @param {number} guardSize
 */
var writeBufferGuard = function (gl, target, bufferSize, guardSize) {
    // var guardBytes = new Uint8Array(guardSize).fill(0xCD);
    // gl.bufferSubData(target, bufferSize, guardBytes);
    var guardBytes = new Uint8Array(bufferSize + guardSize).fill(0xCD);
    gl.bufferSubData(target, 0, guardBytes);
    GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'writeBufferGuard');
};

/**
 * Verifies guard
 * @param {Array.<number>} buffer
 * @return {boolean}
 */
var verifyGuard = function (buffer) {
    for (var i = 0; i < buffer.length; i++) {
        if (buffer[i] != 0xcd)
            return false;
    }
    return true;
};

/**
 * It is a child class of the original C++ TestCase
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {string} name
 * @param {string} desc
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 */
class TransformFeedbackCase extends deqpTests.DeqpTest {

    protected m_gl:WebGL2RenderingContext = null;  // render context
    protected m_bufferMode:number;
    protected m_primitiveType:deqpDraw.primitiveType;
    protected m_progSpec:ProgramSpec;

    // Derived from ProgramSpec in init()
    private m_inputStride:number;
    private m_attributes:Attribute[];
    private m_transformFeedbackOutputs:Output[];
    private m_bufferStrides:number[];

    // GL state.
    private m_program:deqpProgram.ShaderProgram;
    private m_transformFeedback:WebGLTransformFeedback;
    private m_outputBuffers:WebGLBuffer[];

    // Test state.
    private m_iterNdx:number;

    constructor(context, name:string, description:string, bufferMode:number, primitiveType:deqpDraw.primitiveType) {
        super(name, description);
        this.m_gl = context;
        this.m_bufferMode = bufferMode;
        this.m_primitiveType = primitiveType;
        this.m_progSpec = new ProgramSpec();

        this.m_inputStride = 0;
        this.m_attributes = [];
        this.m_transformFeedbackOutputs = [];
        this.m_bufferStrides = [];

        this.m_program = null;
        this.m_transformFeedback = null;
        this.m_outputBuffers = [];

        this.m_iterNdx = 0;
    }

    init():void {
        //  var log = this.m_testCtx.getLog(); // TestLog&
        var gl = this.m_gl; // const glw::Functions&

        if (this.m_program != null) {
            throw new Error('this.m_program isnt null.');
        }
        this.m_program = createVertexCaptureProgram(
            gl,
            this.m_progSpec,
            this.m_bufferMode,
            this.m_primitiveType
        );

        bufferedLogToConsole(this.m_program);

        if (!this.m_program.isOk()) {

            var linkFail = this.m_program.shadersOK && !this.m_program.getProgramInfo().linkOk;

            if (linkFail) {
                if (!isProgramSupported(gl, this.m_progSpec, this.m_bufferMode)) {
                    throw new Error('Not Supported. Implementation limits exceeded.');
                } else if (hasArraysInTFVaryings(this.m_progSpec)) {
                    throw new Error('Capturing arrays is not supported (undefined in specification)');
                } else {
                    throw new Error('Link failed');
                }
            } else {
                throw new Error('Compile failed');
            }
        }

//          bufferedLogToConsole('Transform feedback varyings: ' + tcu.formatArray(this.m_progSpec.getTransformFeedbackVaryings()));
        bufferedLogToConsole('Transform feedback varyings: ' + this.m_progSpec.getTransformFeedbackVaryings());

        // Print out transform feedback points reported by GL.
        // bufferedLogToConsole('Transform feedback varyings reported by compiler:');
        //logTransformFeedbackVaryings(log, gl, this.m_program.getProgram());

        // Compute input specification.
        this.m_inputStride = computeInputLayout(this.m_attributes, this.m_progSpec.getVaryings(), this.m_progSpec.isPointSizeUsed());

        // Build list of varyings used in transform feedback.
        computeTransformFeedbackOutputs(
            this.m_gl,
            this.m_transformFeedbackOutputs, // TODO: make sure this param is working as intended
            this.m_attributes,
            this.m_progSpec.getVaryings(),
            this.m_progSpec.getTransformFeedbackVaryings(),
            this.m_bufferMode
        );

        if (!this.m_transformFeedbackOutputs.length) {
            throw new Error('transformFeedbackOutputs cannot be empty.');
        }

        if (this.m_bufferMode == gl.SEPARATE_ATTRIBS) {
            for (var i = 0; i < this.m_transformFeedbackOutputs.length; ++i) {
                this.m_bufferStrides.push(this.m_transformFeedbackOutputs[i].type.getScalarSize() * 4 /*sizeof(deUint32)*/);
            }
        } else {
            var totalSize = 0;
            for (var i = 0; i < this.m_transformFeedbackOutputs.length; ++i) {
                totalSize += this.m_transformFeedbackOutputs[i].type.getScalarSize() * 4 /*sizeof(deUint32)*/;
            }
            this.m_bufferStrides.push(totalSize);
        }

        this.m_outputBuffers.length = this.m_bufferStrides.length;
        for (var i = 0; i < this.m_outputBuffers.length; i++)
            this.m_outputBuffers[i] = gl.createBuffer();

        DE_ASSERT(!this.m_transformFeedback);
        if (this.m_transformFeedback != null) {
            throw new Error('transformFeedback is already set.');
        }
        this.m_transformFeedback = gl.createTransformFeedback();

        GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'init');

//          this.m_iterNdx = 0;
//          this.m_testCtx.setTestResult(QP_TEST_RESULT_PASS, 'Pass');

    }

    deinit():void {
        var gl = this.m_gl;

        for (var i = 0; i < this.m_outputBuffers.length; i++)
            gl.deleteBuffer(this.m_outputBuffers[i]);

        //    delete this.m_transformFeedback;
        gl.deleteTransformFeedback(this.m_transformFeedback);
        this.m_transformFeedback = null;

        //    delete this.m_program;
        this.m_program = null;

        // Clean up state.
        this.m_attributes = null;
        this.m_transformFeedbackOutputs = null;
        this.m_bufferStrides = null;
        this.m_inputStride = 0;
    }

    iterate() {

        // static vars
        var s = TransformFeedbackCase.s_iterate;

//          var log = this.m_textCtx.getLog();
        var seed = /*deString.deStringHash(getName()) ^ */ deMath.deMathHash(this.m_iterNdx);
        var numIterations = s.iterations.length;
        // first and end ignored.

        var sectionName = 'Iteration' + (this.m_iterNdx + 1);
        var sectionDesc = 'Iteration ' + (this.m_iterNdx + 1) + ' / ' + numIterations;
//            var section; // something weird.

        debug(sectionDesc);

        var currentIteration = s.iterations[this.m_iterNdx];
        var currentTestCase = s.testCases[currentIteration];

        bufferedLogToConsole('Testing ' +
            currentTestCase.length +
            ' draw calls, (element count, TF state): ' +
                //  tcu.formatArray(
            currentTestCase
            //  )
        );

        var isOk = this.runTest(currentTestCase, seed);

        if (!isOk) {
            // fail the test
            testFailedOptions('Result comparison failed', false);
//              this.m_testCtx.setTestResult(QP_TEST_RESULT_FAIL, 'Result comparison failed');
        }

        this.m_iterNdx += 1;

        return (isOk && this.m_iterNdx < numIterations)
            ? deqpTests.runner.IterateResult.CONTINUE
            : deqpTests.runner.IterateResult.STOP;

    }

    /* private */
    private runTest(calls, seed) {
//debugger;
        //  var log = this.m_testCtx.getLog();
        var gl = this.m_gl;
        var rnd = new deRandom.Random(seed);
        var numInputs = 0;
        var numOutputs = 0;
        var numOutputs = 0;
        var width = gl.drawingBufferWidth;
        var height = gl.drawingBufferHeight;
        var viewportW = Math.min(VIEWPORT_WIDTH, width);
        var viewportH = Math.min(VIEWPORT_HEIGHT, height);
        var viewportX = rnd.getInt(0, width - viewportW);
        var viewportY = rnd.getInt(0, height - viewportH);
        var frameWithTf = new tcuSurface.Surface(viewportW, viewportH); // tcu::Surface
        var frameWithoutTf = new tcuSurface.Surface(viewportW, viewportH); // tcu::Surface
        var primitiveQuery = gl.createQuery();
        var outputsOk = true;
        var imagesOk = true;
        var queryOk = true;

        // Compute totals.
        for (var i = 0; i < calls.length; ++i) {
            var call = calls[i];
            numInputs += call.numElements;
            numOutputs += call.transformFeedbackEnabled ? getTransformFeedbackOutputCount(this.m_primitiveType, call.numElements) : 0;
        }

        // Input data.
        var inputData = genInputData(this.m_attributes, numInputs, this.m_inputStride, rnd);

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.m_transformFeedback);
        GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glBindTransformFeedback()');

        // Allocate storage for transform feedback output buffers and bind to targets.
        for (var bufNdx = 0; bufNdx < this.m_outputBuffers.length; ++bufNdx) {
            var buffer = this.m_outputBuffers[bufNdx]; // deUint32
            var stride = this.m_bufferStrides[bufNdx]; // int
            var target = bufNdx; // int
            var size = stride * numOutputs; // int
            var guardSize = stride * BUFFER_GUARD_MULTIPLIER; // int
            var usage = gl.DYNAMIC_READ; // const deUint32

            gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'bindBuffer');
            gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, size + guardSize, usage);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'bufferData');
            writeBufferGuard(gl, gl.TRANSFORM_FEEDBACK_BUFFER, size, guardSize);

            // \todo [2012-07-30 pyry] glBindBufferRange()?
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, target, buffer);

            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'transform feedback buffer setup');
        }

        var attribBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, inputData, gl.STATIC_DRAW);
        GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'Attributes buffer setup');

        // Setup attributes.
        for (var i = 0; i < this.m_attributes.length; ++i) {
            var attrib = this.m_attributes[i];
            var loc = gl.getAttribLocation(this.m_program.getProgram(), attrib.name);
            /** @type {string} */
            var scalarType = deqpUtils.getDataTypeScalarType(attrib.type.getBasicType());
            /** @type {number} */
            var numComponents = deqpUtils.getDataTypeScalarSize(attrib.type.getBasicType());

            if (loc >= 0) {
                gl.enableVertexAttribArray(loc);
                switch (scalarType) {
                    case "float":
                        gl.vertexAttribPointer(loc, numComponents, gl.FLOAT, false, this.m_inputStride, attrib.offset);
                        break;
                    case "int":
                        gl.vertexAttribIPointer(loc, numComponents, gl.INT, this.m_inputStride, attrib.offset);
                        break;
                    case "uint":
                        gl.vertexAttribIPointer(loc, numComponents, gl.UNSIGNED_INT, this.m_inputStride, attrib.offset);
                        break;
                }
            }
        }

        // Setup viewport.
        gl.viewport(viewportX, viewportY, viewportW, viewportH);

        // Setup program.
        gl.useProgram(this.m_program.getProgram());

        gl.uniform4fv(
            gl.getUniformLocation(this.m_program.getProgram(), 'u_scale'),
            [0.01, 0.01, 0.01, 0.01]
        );
        gl.uniform4fv(
            gl.getUniformLocation(this.m_program.getProgram(), 'u_bias'),
            [0.5, 0.5, 0.5, 0.5]
        );

        // Enable query.
        gl.beginQuery(gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, primitiveQuery);
        GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glBeginQuery(GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN)');

        // Draw
        try {
            var offset = 0;
            var tfEnabled = true;

            gl.clear(gl.COLOR_BUFFER_BIT);

            try {
                var tfPrimitiveMode = getTransformFeedbackPrimitiveMode(gl, this.m_primitiveType);
                gl.beginTransformFeedback(tfPrimitiveMode);
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glBeginTransformFeedback');

                for (var i = 0; i < calls.length; ++i) {
                    var call = calls[i];

                    // Pause or resume transform feedback if necessary.
                    if (call.transformFeedbackEnabled != tfEnabled) {
                        if (call.transformFeedbackEnabled) {
                            debug('resumeTransformFeedback');
                            gl.resumeTransformFeedback();
                            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glResumeTransformFeedback');
                        } else {
                            debug('pauseTransformFeedback');
                            gl.pauseTransformFeedback();
                            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glPauseTransformFeedback');
                        }
                        tfEnabled = call.transformFeedbackEnabled;
                    }

                    var glPrim = deqpDraw.getPrimitiveGLType(gl, this.m_primitiveType);
                    gl.drawArrays(glPrim, offset, call.numElements);
                    debug('gl.drawArrays(' + glPrim + ', ' + offset + ', ' + call.numElements + ')');
                    GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glDrawArrays');
                    offset += call.numElements;
                }
            } finally {
                // Resume feedback before finishing it.
                if (!tfEnabled)
                    gl.resumeTransformFeedback();

                gl.endTransformFeedback();
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glEndTransformFeedback');
            }
        } catch (e) {
            gl.deleteQuery(primitiveQuery);
            throw e;
        }

        gl.endQuery(gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN);
        GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glEndQuery(GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN)');

        // Check and log query status right after submit
        (function () {
            var available = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT_AVAILABLE);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'getQueryParameter()'); // formerly glGetQueryObjectuiv()

            bufferedLogToConsole('GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN status after submit: ' + (available ? 'GL_TRUE' : 'GL_FALSE'));
        })();


        // Compare result buffers.
        for (var bufferNdx = 0; bufferNdx < this.m_outputBuffers.length; ++bufferNdx) {
            var stride = this.m_bufferStrides[bufferNdx];   // int
            var size = stride * numOutputs;               // int
            var guardSize = stride * BUFFER_GUARD_MULTIPLIER;  // int
            var result = new ArrayBuffer(size + guardSize); // const void*

            // Bind buffer for reading.
            gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.m_outputBuffers[bufferNdx]);

            gl.finish(); // TODO: HACK!
            gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, result); // (spec says to use ArrayBufferData)
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'mapping buffer');

            // inline function for variable scoping
            (function() {
                var available:number = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT_AVAILABLE);
                var numPrimitives:number = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT);
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'getQueryParameter()'); // formerly getQueryObjectuiv()

                if (!available) {
                    debug('ERROR: GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN result not available after mapping buffers!');
                }
                else {
                    debug('GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = ' + numPrimitives);
                }
            })();

            for (var i = 0; i < this.m_transformFeedbackOutputs.length; ++i) {
                var out = this.m_transformFeedbackOutputs[i];

                if (out.bufferNdx != bufferNdx)
                    continue;

                var inputOffset = 0;
                var outputOffset = 0;

                // Process all draw calls and check ones with transform feedback enabled
                for (var callNdx = 0; callNdx < calls.length; ++callNdx) {
                    var call = calls[callNdx];

                    if (call.transformFeedbackEnabled) {
                        if (!compareTransformFeedbackOutput(gl, this.m_primitiveType, out, call.numElements, {
                                input: {
                                    buffer: inputData,
                                    offset: inputOffset * this.m_inputStride,
                                    stride: this.m_inputStride
                                },
                                output: {
                                    buffer: result,
                                    offset: outputOffset * stride,
                                    stride: stride
                                }
                            })) {
                            outputsOk = false;
                            break;
                        }
                    }

                    inputOffset += call.numElements;
                    outputOffset += call.transformFeedbackEnabled ? getTransformFeedbackOutputCount(this.m_primitiveType, call.numElements) : 0;
                }
            }

            // Verify guardband.
            if (!verifyGuard(new Uint8Array(result, size, guardSize))) {
                bufferedLogToConsole('Error: Transform feedback buffer overrun detected');
                outputsOk = false;
            }

            //    Javascript, and lazy memory management
            //    gl.unmapBuffer(GL_TRANSFORM_FEEDBACK_BUFFER);

        }

        // Check status after mapping buffers.
        {
            var mustBeReady:boolean = (this.m_outputBuffers.length > 0); // Mapping buffer forces synchronization.
            var expectedCount:number = computeTransformFeedbackPrimitiveCount(gl, this.m_primitiveType, calls);
            var available:number = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT_AVAILABLE);
            var numPrimitives:number = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'getQueryParameter()'); // formerly getQueryObjectuiv()

            if (!mustBeReady && !available) {
                bufferedLogToConsole('ERROR: GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN result not available after mapping buffers!');
                queryOk = false;
            }

            bufferedLogToConsole('GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = ' + numPrimitives);

            if (numPrimitives != expectedCount) {
                bufferedLogToConsole('ERROR: Expected ' + expectedCount + ' primitives!');
                queryOk = false;
            }
        }

        // Clear transform feedback state.
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        for (var bufNdx = 0; bufNdx < this.m_outputBuffers.length; ++bufNdx) {
            gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, bufNdx, null);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Read back rendered image.
        gl.readPixels(viewportX, viewportY, viewportW, viewportH, gl.RGBA, gl.UNSIGNED_BYTE, frameWithTf.getAccess().getDataPtr());

        GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glReadPixels()');

        // Render without transform feedback.
        {
            var offset = 0; // int

            gl.clear(gl.COLOR_BUFFER_BIT);

            for (var i = 0; i < calls.length; ++i) {
                var call = calls[i];
                var glPrim = deqpDraw.getPrimitiveGLType(gl, this.m_primitiveType);
                gl.drawArrays(glPrim, offset, call.numElements);
                offset += call.numElements;
            }


            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'render');
            gl.readPixels(viewportX, viewportY, viewportW, viewportH, gl.RGBA, gl.UNSIGNED_BYTE, frameWithoutTf.getAccess().getDataPtr());
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glReadPixels()');
        }

        // Compare images with and without transform feedback.
        imagesOk = tcuImageCompare.pixelThresholdCompare('Result', 'Image comparison result', frameWithoutTf, frameWithTf, [1, 1, 1, 1], tcuImageCompare.CompareLogMode.ON_ERROR);

        if (imagesOk) {
            bufferedLogToConsole('Rendering result comparison between TF enabled and TF disabled passed.');
        } else {
            bufferedLogToConsole('ERROR: Rendering result comparison between TF enabled and TF disabled failed!');
        }

        bufferedLogToConsole('outputsOk: ' + outputsOk + ', imagesOk: ' + imagesOk + ', queryOk: ' + queryOk);

        return outputsOk && imagesOk && queryOk;

    } // runTest();
}

function dc(numElements:number, tfEnabled:boolean):DrawCall {
    return new DrawCall(numElements, tfEnabled);
}

module TransformFeedbackCase {
    // static data
    export var s_iterate = {

        testCases: {
            elemCount1: [dc(1, true)],
            elemCount2: [dc(2, true)],
            elemCount3: [dc(3, true)],
            elemCount4: [dc(4, true)],
            elemCount123: [dc(123, true)],
            basicPause1: [dc(64, false), dc(64, true), dc(64, true)],
            basicPause2: [dc(13, true), dc(5, true), dc(17, false),
                dc(3, true), dc(7, false)],
            startPaused: [dc(123, false), dc(123, true)],
            random1: [dc(65, true), dc(135, false), dc(74, true),
                dc(16, false), dc(226, false), dc(9, true),
                dc(174, false)],
            random2: [dc(217, true), dc(171, true), dc(147, true),
                dc(152, false), dc(55, true)]
        },
        iterations: [
            'elemCount1', 'elemCount2', 'elemCount3', 'elemCount4', 'elemCount123',
            'basicPause1', 'basicPause2', 'startPaused',
            'random1', 'random2'
        ]
    }
}

function hasArraysInTFVaryings(spec:ProgramSpec):boolean {

    for (var i = 0; i < spec.getTransformFeedbackVaryings().length; ++i) {
        var tfVar = spec.getTransformFeedbackVaryings()[i];
        var varName = gluVTU.parseVariableName(tfVar);

        if (findAttributeNameEquals(spec.getVaryings(), varName))
            return true;
    }
    return false;

}

/** PositionCase
 * It is a child class of TransformFeedbackCase
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {string} name
 * @param {string} desc
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 */
class PositionCase extends TransformFeedbackCase {
    constructor(context, name, desc, bufferMode, primitiveType) {
        super(context, name, desc, bufferMode, primitiveType);
        this.m_progSpec.addTransformFeedbackVarying('gl_Position');
    }
}

/** PointSizeCase
 * It is a child class of TransformFeedbackCase
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {string} name
 * @param {string} desc
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 */
class PointSizeCase extends TransformFeedbackCase {
    constructor(context, name, desc, bufferMode, primitiveType) {
        super(context, name, desc, bufferMode, primitiveType);
        this.m_progSpec.addTransformFeedbackVarying('gl_PointSize');
    }
}

/** BasicTypeCase
 * It is a child class of TransformFeedbackCase
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {string} name
 * @param {string} desc
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 * @param {gluVT.VarType} type
 * @param {deqpUtils.precision} precision
 * @param {interpolation} interpolation enum number in this javascript
 */
class BasicTypeCase extends TransformFeedbackCase {
    constructor(context, name, desc, bufferMode, primitiveType, type, precision, interpolation) {
        super(context, name, desc, bufferMode, primitiveType);

        this.m_progSpec.addVarying('v_varA', gluVT.newTypeBasic(type, precision), interpolation);
        this.m_progSpec.addVarying('v_varB', gluVT.newTypeBasic(type, precision), interpolation);

        this.m_progSpec.addTransformFeedbackVarying('v_varA');
        this.m_progSpec.addTransformFeedbackVarying('v_varB');
    }
}

/** BasicArrayCase
 * It is a child class of TransformFeedbackCase
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {string} name
 * @param {string} desc
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 * @param {gluVT.VarType} type
 * @param {deqpUtils.precision} precision
 * @param {interpolation} interpolation enum number in this javascript
 */
class BasicArrayCase extends TransformFeedbackCase {
    constructor(context, name, desc, bufferMode, primitiveType, type, precision, interpolation) {

        super(context, name, desc, bufferMode, primitiveType);
        if (deqpUtils.isDataTypeMatrix(type) || this.m_bufferMode === this.m_gl.SEPARATE_ATTRIBS) {
            // note For matrix types we need to use reduced array sizes or otherwise we will exceed maximum attribute (16)
            // or transform feedback component count (64).
            // On separate attribs mode maximum component count per varying is 4.
            this.m_progSpec.addVarying('v_varA', gluVT.newTypeArray(gluVT.newTypeBasic(type, precision), 1), interpolation);
            this.m_progSpec.addVarying('v_varB', gluVT.newTypeArray(gluVT.newTypeBasic(type, precision), 2), interpolation);
        }
        else {
            this.m_progSpec.addVarying('v_varA', gluVT.newTypeArray(gluVT.newTypeBasic(type, precision), 3), interpolation);
            this.m_progSpec.addVarying('v_varB', gluVT.newTypeArray(gluVT.newTypeBasic(type, precision), 4), interpolation);
        }

        this.m_progSpec.addTransformFeedbackVarying('v_varA');
        this.m_progSpec.addTransformFeedbackVarying('v_varB');
    }
}

/** ArrayElementCase
 * It is a child class of TransformFeedbackCase
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {string} name
 * @param {string} desc
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 * @param {gluVT.VarType} type
 * @param {deqpUtils.precision} precision
 * @param {interpolation} interpolation enum number in this javascript
 */
class ArrayElementCase extends TransformFeedbackCase {
    constructor(context, name, desc, bufferMode, primitiveType, type, precision, interpolation) {
        super(context, name, desc, bufferMode, primitiveType);

        this.m_progSpec.addVarying('v_varA', gluVT.newTypeBasic(type, precision), interpolation);
        this.m_progSpec.addVarying('v_varB', gluVT.newTypeBasic(type, precision), interpolation);

        this.m_progSpec.addTransformFeedbackVarying('v_varA[1]');
        this.m_progSpec.addTransformFeedbackVarying('v_varB[0]');
        this.m_progSpec.addTransformFeedbackVarying('v_varB[3]');
    }
}

/** RandomCase
 * It is a child class of TransformFeedbackCase
 * @param {WebGLRenderingContext} context gl WebGL context
 * @param {string} name
 * @param {string} desc
 * @param {number} bufferMode
 * @param {deqpDraw.primitiveType} primitiveType GLenum that specifies what kind of primitive is
 * @param {number} seed
 */
class RandomCase extends TransformFeedbackCase {
    constructor(context, name, desc, bufferMode, primitiveType, public seed:number) {
        super(context, name, desc, bufferMode, primitiveType);
    }

    init():void {
        var typeCandidates = [
            deqpUtils.DataType.FLOAT,
            deqpUtils.DataType.FLOAT_VEC2,
            deqpUtils.DataType.FLOAT_VEC3,
            deqpUtils.DataType.FLOAT_VEC4,
            deqpUtils.DataType.INT,
            deqpUtils.DataType.INT_VEC2,
            deqpUtils.DataType.INT_VEC3,
            deqpUtils.DataType.INT_VEC4,
            deqpUtils.DataType.UINT,
            deqpUtils.DataType.UINT_VEC2,
            deqpUtils.DataType.UINT_VEC3,
            deqpUtils.DataType.UINT_VEC4,

            deqpUtils.DataType.FLOAT_MAT2,
            deqpUtils.DataType.FLOAT_MAT2X3,
            deqpUtils.DataType.FLOAT_MAT2X4,

            deqpUtils.DataType.FLOAT_MAT3X2,
            deqpUtils.DataType.FLOAT_MAT3,
            deqpUtils.DataType.FLOAT_MAT3X4,

            deqpUtils.DataType.FLOAT_MAT4X2,
            deqpUtils.DataType.FLOAT_MAT4X3,
            deqpUtils.DataType.FLOAT_MAT4
        ];

        // TODO: could we use /** @type {Array.<glsUBC.UniformFlags>} */ instead ???
        var precisions = [
            deqpUtils.precision.PRECISION_LOWP,
            deqpUtils.precision.PRECISION_MEDIUMP,
            deqpUtils.precision.PRECISION_HIGHP
        ];

        var interpModes = [
            {name: 'smooth', interp: interpolation.SMOOTH},
            {name: 'flat', interp: interpolation.FLAT},
            {name: 'centroid', interp: interpolation.CENTROID}
        ];

        var maxAttributeVectors = 16;
        //** @type {number} */  var maxTransformFeedbackComponents    = 64; // note It is enough to limit attribute set size.
        var isSeparateMode = (this.m_bufferMode === this.m_gl.SEPARATE_ATTRIBS);
        var maxTransformFeedbackVars = (isSeparateMode) ? 4 : maxAttributeVectors;
        var arrayWeight = 0.3;
        var positionWeight = 0.7;
        var pointSizeWeight = 0.1;
        var captureFullArrayWeight = 0.5;

        var rnd = new deRandom.Random(this.seed);
        var usePosition:boolean = (rnd.getFloat() < positionWeight);
        var usePointSize:boolean = (rnd.getFloat() < pointSizeWeight);
        var numAttribVectorsToUse:number = rnd.getInt(
            1, maxAttributeVectors - 1/*position*/ - (usePointSize ? 1 : 0)
        );

        var numAttributeVectors = 0;
        var varNdx = 0;

        // Generate varyings.
        while (numAttributeVectors < numAttribVectorsToUse) {
            var maxVecs = isSeparateMode ? Math.min(2 /*at most 2*mat2*/, numAttribVectorsToUse - numAttributeVectors) : numAttribVectorsToUse - numAttributeVectors;
            var begin = typeCandidates[0];
            var endCandidates = begin + (
                    maxVecs >= 4 ? 21 : (
                        maxVecs >= 3 ? 18 : (
                            maxVecs >= 2 ? (isSeparateMode ? 13 : 15) : 12
                        )
                    )
                );
            var end = typeCandidates[endCandidates];
            var type = rnd.choose(typeCandidates)[0];
            var precision = rnd.choose(precisions)[0];

            var interp:interpolation = (deqpUtils.getDataTypeScalarTypeAsDataType(type) === deqpUtils.DataType.FLOAT)
                ? rnd.choose(interpModes)
                : interpolation.FLAT;

            var numVecs:number = deqpUtils.isDataTypeMatrix(type) ? deqpUtils.getDataTypeMatrixNumColumns(type) : 1;
            var numComps:number = deqpUtils.getDataTypeScalarSize(type);
            var maxArrayLen:number = Math.max(1, isSeparateMode ? (4 / numComps) : (maxVecs / numVecs));
            var useArray:boolean = rnd.getFloat() < arrayWeight;
            var arrayLen:number = useArray ? rnd.getInt(1, maxArrayLen) : 1;
            var name:string = 'v_var' + varNdx;

            if (useArray)
                this.m_progSpec.addVarying(name, gluVT.newTypeArray(gluVT.newTypeBasic(type, precision), arrayLen), interp);
            else
                this.m_progSpec.addVarying(name, gluVT.newTypeBasic(type, precision), interp);

            numAttributeVectors += arrayLen * numVecs;
            varNdx += 1;
        }

        // Generate transform feedback candidate set.
        var tfCandidates:string[] = [];

        if (usePosition)
            tfCandidates.push('gl_Position');
        if (usePointSize)
            tfCandidates.push('gl_PointSize');

        for (var ndx = 0; ndx < varNdx; ndx++) {
            var varying:Varying = this.m_progSpec.getVaryings()[ndx];

            if (varying.type.isArrayType()) {
                var captureFull:boolean = (rnd.getFloat() < captureFullArrayWeight);

                if (captureFull) {
                    tfCandidates.push(varying.name);
                }
                else {
                    var numElem:number = varying.type.getArraySize();
                    for (var elemNdx = 0; elemNdx < numElem; elemNdx++) {
                        tfCandidates.push(varying.name + '[' + elemNdx + ']');
                    }
                }
            }
            else {
                tfCandidates.push(varying.name);
            }
        }

        // Pick random selection.
        var tfVaryings = [];
        rnd.choose(tfCandidates, tfVaryings, Math.min(tfCandidates.length, maxTransformFeedbackVars));
        rnd.shuffle(tfVaryings);
        for (var i = 0; i < tfVaryings.length; i++)
            this.m_progSpec.addTransformFeedbackVarying(tfVaryings[i]);

        super.init();
    }
}

/**
 * Creates the test in order to be executed
 **/
function init(context:WebGL2RenderingContext) {

    /** @const @type {deqpTests.DeqpTest} */
    var testGroup = deqpTests.runner.getState().testCases;

    /** @type {Array.<string, number>} */
    var bufferModes = [
        {name: 'separate', mode: context.SEPARATE_ATTRIBS},
        {name: 'interleaved', mode: context.INTERLEAVED_ATTRIBS}
    ];

    /** @type {Array.<string, deqpDraw.primitiveType>} */
    var primitiveTypes = [
        {name: 'points', type: deqpDraw.primitiveType.POINTS},
        {name: 'lines', type: deqpDraw.primitiveType.LINES},
        {name: 'triangles', type: deqpDraw.primitiveType.TRIANGLES}
    ];

    /** @type {Array.<deqpUtils.DataType>} */
    var basicTypes = [
        deqpUtils.DataType.FLOAT,
        deqpUtils.DataType.FLOAT_VEC2,
        deqpUtils.DataType.FLOAT_VEC3,
        deqpUtils.DataType.FLOAT_VEC4,
        deqpUtils.DataType.FLOAT_MAT2,
        deqpUtils.DataType.FLOAT_MAT2X3,
        deqpUtils.DataType.FLOAT_MAT2X4,
        deqpUtils.DataType.FLOAT_MAT3X2,
        deqpUtils.DataType.FLOAT_MAT3,
        deqpUtils.DataType.FLOAT_MAT3X4,
        deqpUtils.DataType.FLOAT_MAT4X2,
        deqpUtils.DataType.FLOAT_MAT4X3,
        deqpUtils.DataType.FLOAT_MAT4,
        deqpUtils.DataType.INT,
        deqpUtils.DataType.INT_VEC2,
        deqpUtils.DataType.INT_VEC3,
        deqpUtils.DataType.INT_VEC4,
        deqpUtils.DataType.UINT,
        deqpUtils.DataType.UINT_VEC2,
        deqpUtils.DataType.UINT_VEC3,
        deqpUtils.DataType.UINT_VEC4
    ];

    // TODO: could we use /** @type {Array.<glsUBC.UniformFlags>} */ instead ???
    /** @type {Array.<deqpUtils.precision>} */
    var precisions = [

        deqpUtils.precision.PRECISION_LOWP,
        deqpUtils.precision.PRECISION_MEDIUMP,
        deqpUtils.precision.PRECISION_HIGHP

        // glsUBC.UniformFlags.PRECISION_LOW,
        // glsUBC.UniformFlags.PRECISION_MEDIUM,
        // glsUBC.UniformFlags.PRECISION_HIGH
    ];

    /** @type {Array.<string, interpolation>} */
    var interpModes = [
        {name: 'smooth', interp: interpolation.SMOOTH},
        {name: 'flat', interp: interpolation.FLAT},
        {name: 'centroid', interp: interpolation.CENTROID}
    ];

    // .position
    (function () {
        var positionGroup = deqpTests.newTest('position', 'gl_Position capture using transform feedback');
        testGroup.addChild(positionGroup);

        for (var primitiveType = 0; primitiveType < primitiveTypes.length; primitiveType++) {
            for (var bufferMode = 0; bufferMode < bufferModes.length; bufferMode++) {
                var name:string = primitiveTypes[primitiveType].name + '_' + bufferModes[bufferMode].name;

                positionGroup.addChild(new PositionCase(
                    context,
                    name,
                    '',
                    bufferModes[bufferMode].mode,
                    primitiveTypes[primitiveType].type
                ));
            }
        }
    })();

    // .point_size
    (function () {
        /** @type {deqpTests.DeqpTest} */ var pointSizeGroup = deqpTests.newTest('point_size', 'gl_PointSize capture using transform feedback');
        testGroup.addChild(pointSizeGroup);

        for (var primitiveType = 0; primitiveType < primitiveTypes.length; primitiveType++) {
            for (var bufferMode = 0; bufferMode < bufferModes.length; bufferMode++) {
                /** @type {string} */
                var name = primitiveTypes[primitiveType].name + '_' + bufferModes[bufferMode].name;

                pointSizeGroup.addChild(new PointSizeCase(
                    context,
                    name,
                    '',
                    bufferModes[bufferMode].mode,
                    primitiveTypes[primitiveType].type
                ));
            }
        }
    })();

    // .basic_type
    (function () {
        var basicTypeGroup = deqpTests.newTest('basic_types', 'Basic types in transform feedback');
        testGroup.addChild(basicTypeGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++) {
            var modeGroup = deqpTests.newTest(bufferModes[bufferModeNdx].name, '');
            var bufferMode = bufferModes[bufferModeNdx].mode;
            basicTypeGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++) {
                var primitiveGroup = deqpTests.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                var primitiveType = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var typeNdx = 0; typeNdx < basicTypes.length; typeNdx++) {
                    var type = basicTypes[typeNdx];
                    var isFloat = (deqpUtils.getDataTypeScalarTypeAsDataType(type) === deqpUtils.DataType.FLOAT);

                    for (var precNdx = 0; precNdx < precisions.length; precNdx++) {
                        var precision = precisions[precNdx];
                        var name = deqpUtils.getPrecisionName(precision) + '_' + deqpUtils.getDataTypeName(type);

                        primitiveGroup.addChild(new BasicTypeCase(
                            context,
                            name,
                            '',
                            bufferMode,
                            primitiveType,
                            type,
                            precision,
                            isFloat ? interpolation.SMOOTH : interpolation.FLAT
                        ));
                    }
                }
            }
        }
    })();

    // .array
    (function () {
        var arrayGroup = deqpTests.newTest('array', 'Capturing whole array in TF');
        testGroup.addChild(arrayGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++) {
            var modeGroup = deqpTests.newTest(bufferModes[bufferModeNdx].name, '');
            var bufferMode = bufferModes[bufferModeNdx].mode;
            arrayGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++) {
                var primitiveGroup:deqpTests.DeqpTest = deqpTests.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                var primitiveType = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var typeNdx = 0; typeNdx < basicTypes.length; typeNdx++) {
                    var type:deqpUtils.DataType = basicTypes[typeNdx];
                    var isFloat:boolean = (deqpUtils.getDataTypeScalarTypeAsDataType(type) === deqpUtils.DataType.FLOAT);

                    for (var precNdx = 0; precNdx < precisions.length; precNdx++) {
                        var precision:deqpUtils.precision = precisions[precNdx];
                        var name:string = deqpUtils.getPrecisionName(precision) + '_' + deqpUtils.getDataTypeName(type);

                        primitiveGroup.addChild(new BasicArrayCase(
                            context,
                            name,
                            '',
                            bufferMode,
                            primitiveType,
                            type,
                            precision,
                            isFloat ? interpolation.SMOOTH : interpolation.FLAT
                        ));
                    }
                }
            }
        }
    })();

    // .array_element
    (function () {
        var arrayElemGroup = deqpTests.newTest('array_element', 'Capturing single array element in TF');
        testGroup.addChild(arrayElemGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++) {
            var modeGroup = deqpTests.newTest(bufferModes[bufferModeNdx].name, '');
            var bufferMode = bufferModes[bufferModeNdx].mode;
            arrayElemGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++) {
                var primitiveGroup = deqpTests.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                var primitiveType = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var typeNdx = 0; typeNdx < basicTypes.length; typeNdx++) {
                    var type:deqpUtils.DataType = basicTypes[typeNdx];
                    var isFloat:boolean = (deqpUtils.getDataTypeScalarTypeAsDataType(type) === deqpUtils.DataType.FLOAT);

                    for (var precNdx = 0; precNdx < precisions.length; precNdx++) {
                        var precision:deqpUtils.precision = precisions[precNdx];
                        var name:string = deqpUtils.getPrecisionName(precision) + '_' + deqpUtils.getDataTypeName(type);

                        primitiveGroup.addChild(new ArrayElementCase(
                            context,
                            name,
                            '',
                            bufferMode,
                            primitiveType,
                            type,
                            precision,
                            isFloat ? interpolation.SMOOTH : interpolation.FLAT
                        ));
                    }
                }
            }
        }
    })();

    // .interpolation
    (function () {
        var interpolationGroup = deqpTests.newTest(
            'interpolation', 'Different interpolation modes in transform feedback varyings'
        );
        testGroup.addChild(interpolationGroup);

        for (var modeNdx = 0; modeNdx < interpModes.length; modeNdx++) {
            var interp = interpModes[modeNdx].interp;
            var modeGroup = deqpTests.newTest(interpModes[modeNdx].name, '');

            interpolationGroup.addChild(modeGroup);

            for (var precNdx = 0; precNdx < precisions.length; precNdx++) {
                var precision = precisions[precNdx];

                for (var primitiveType = 0; primitiveType < primitiveTypes.length; primitiveType++) {
                    for (var bufferMode = 0; bufferMode < bufferModes.length; bufferMode++) {
                        var name = (
                        deqpUtils.getPrecisionName(precision) +
                        '_vec4_' + primitiveTypes[primitiveType].name +
                        '_' + bufferModes[bufferMode].name
                        );

                        modeGroup.addChild(new BasicTypeCase(
                            context,
                            name,
                            '',
                            bufferModes[bufferMode].mode,
                            primitiveTypes[primitiveType].type,
                            deqpUtils.DataType.FLOAT_VEC4,
                            precision,
                            interp
                        ));
                    }
                }
            }
        }
    })();

    // .random
    (function () {
        var randomGroup = deqpTests.newTest('random', 'Randomized transform feedback cases');
        testGroup.addChild(randomGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++) {
            var modeGroup = deqpTests.newTest(bufferModes[bufferModeNdx].name, '');
            var bufferMode = bufferModes[bufferModeNdx].mode;
            randomGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++) {
                var primitiveGroup = deqpTests.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                var primitiveType = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var ndx = 0; ndx < 10; ndx++) {
                    var seed = deMath.deMathHash(bufferMode) ^ deMath.deMathHash(primitiveType) ^ deMath.deMathHash(ndx);

                    primitiveGroup.addChild(new RandomCase(
                        context,
                        (ndx + 1).toString(),
                        '',
                        bufferMode,
                        primitiveType,
                        seed
                    )); // TODO: check, toString() omitted?
                }
            }
        }
    })();
}

/**
 * Create and execute the test cases
 */
export function run(gl:WebGL2RenderingContext):void {
    var testName = 'transform_feedback';
    var testDescription = 'Transform Feedback Tests';
    var state = deqpTests.runner.getState();

    //state.testName = testName; // unused by test runner
    state.testCases = deqpTests.newTest(testName, testDescription, null);

    //Set up name and description of this test series.
    setCurrentTestName(testName);
    description(testDescription);

    try {
        init(gl);
        deqpTests.runner.runCallback(deqpTests.runTestCases);
    } catch (err) {
        console.log(err);
        bufferedLogToConsole(err);
        deqpTests.runner.terminate();
    }
}

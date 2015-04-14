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

function DE_ASSERT(x: any): void {
    if (!x)
        throw new Error('Assert failed');
}

/**
 * ShadingLanguageVersion
 * @enum
 */
enum GLSLVersion {
    V100_ES = 0, //!< GLSL ES 1.0
    V300_ES = 1, //!< GLSL ES 3.0

    V_LAST
}

/**
 * getGLSLVersion - Returns a GLSLVersion based on a given webgl context.
 * @param {WebGLRenderingContext} gl
 * @return {GLSLVersion}
 */
export function getGLSLVersion(gl: WebGLRenderingContext): GLSLVersion {
    var webglversion = gl.getParameter(gl.VERSION);

    if (webglversion.indexOf('WebGL 1.0') != -1) return GLSLVersion.V100_ES;
    if (webglversion.indexOf('WebGL 2.0') != -1) return GLSLVersion.V300_ES;

    throw new Error('Invalid WebGL version');
};

/**
 * getGLSLVersionDeclaration - Returns a string declaration for the glsl version in a shader.
 * @param {GLSLVersion} version
 * @return {string}
 */
export function getGLSLVersionDeclaration(version: GLSLVersion): string {
    var s_decl: string[] =
    [
        '#version 100',
        '#version 300 es'
    ];

    if (version > s_decl.length - 1)
        DE_ASSERT(false);

    return s_decl[version];
}

/**
 * @enum
 */
export enum precision {
    PRECISION_LOWP = 0,
    PRECISION_MEDIUMP = 1,
    PRECISION_HIGHP = 2,

    PRECISION_LAST
}

export function getPrecisionName(prec: precision): string {
    var s_names: string[] = [
        'lowp',
        'mediump',
        'highp'
    ];

    return s_names[prec];
}

/** @const */ var deUint32_size = 4; //To replace all sizeof calls
/**
 * The Type constants
 * @enum {number}
 */
export enum DataType {
    INVALID,

    FLOAT,
    FLOAT_VEC2,
    FLOAT_VEC3,
    FLOAT_VEC4,
    FLOAT_MAT2,
    FLOAT_MAT2X3,
    FLOAT_MAT2X4,
    FLOAT_MAT3X2,
    FLOAT_MAT3,
    FLOAT_MAT3X4,
    FLOAT_MAT4X2,
    FLOAT_MAT4X3,
    FLOAT_MAT4,

    INT,
    INT_VEC2,
    INT_VEC3,
    INT_VEC4,

    UINT,
    UINT_VEC2,
    UINT_VEC3,
    UINT_VEC4,

    BOOL,
    BOOL_VEC2,
    BOOL_VEC3,
    BOOL_VEC4,

    SAMPLER_2D,
    SAMPLER_CUBE,
    SAMPLER_2D_ARRAY,
    SAMPLER_3D,

    SAMPLER_2D_SHADOW,
    SAMPLER_CUBE_SHADOW,
    SAMPLER_2D_ARRAY_SHADOW,

    INT_SAMPLER_2D,
    INT_SAMPLER_CUBE,
    INT_SAMPLER_2D_ARRAY,
    INT_SAMPLER_3D,

    UINT_SAMPLER_2D,
    UINT_SAMPLER_CUBE,
    UINT_SAMPLER_2D_ARRAY,
    UINT_SAMPLER_3D,

    LAST
}

/**
 * Returns type of float scalars
 * @param {DataType} dataType
 * @return {string} type of float scalar
 */
export function getDataTypeFloatScalars(dataType: DataType): string {

    switch (dataType) {
        case DataType.FLOAT: return 'float';
        case DataType.FLOAT_VEC2: return 'vec2';
        case DataType.FLOAT_VEC3: return 'vec3';
        case DataType.FLOAT_VEC4: return 'vec4';
        case DataType.FLOAT_MAT2: return 'mat2';
        case DataType.FLOAT_MAT2X3: return 'mat2x3';
        case DataType.FLOAT_MAT2X4: return 'mat2x4';
        case DataType.FLOAT_MAT3X2: return 'mat3x2';
        case DataType.FLOAT_MAT3: return 'mat3';
        case DataType.FLOAT_MAT3X4: return 'mat3x4';
        case DataType.FLOAT_MAT4X2: return 'mat4x2';
        case DataType.FLOAT_MAT4X3: return 'mat4x3';
        case DataType.FLOAT_MAT4: return 'mat4';
        case DataType.INT: return 'float';
        case DataType.INT_VEC2: return 'vec2';
        case DataType.INT_VEC3: return 'vec3';
        case DataType.INT_VEC4: return 'vec4';
        case DataType.UINT: return 'float';
        case DataType.UINT_VEC2: return 'vec2';
        case DataType.UINT_VEC3: return 'vec3';
        case DataType.UINT_VEC4: return 'vec4';
        case DataType.BOOL: return 'float';
        case DataType.BOOL_VEC2: return 'vec2';
        case DataType.BOOL_VEC3: return 'vec3';
        case DataType.BOOL_VEC4: return 'vec4';
    }
    throw Error('Unrecognized dataType ' + dataType);
}

/**
 * getDataTypeVector
 * @param {DataType} scalarType
 * @param {number} size
 * @return {DataType}
 */
export function getDataTypeVector(scalarType: DataType, size: number): DataType
{
    //DE_ASSERT(deInRange32(size, 1, 4));
    switch (scalarType)
    {
        case DataType.FLOAT:
        case DataType.INT:
        case DataType.UINT:
        case DataType.BOOL:
            return scalarType + size - 1;
        default:
            return DataType.INVALID;
    }
}

/**
 * getDataTypeFloatVec
 * @param {number} vecSize
 * @return {DataType}
 */
export function getDataTypeFloatVec(vecSize: number): DataType
{
    return getDataTypeVector(DataType.FLOAT, vecSize);
}

/**
 * isDataTypeBoolOrBVec
 * @param {DataType} dataType
 * @return {boolean}
 */
export function isDataTypeBoolOrBVec(dataType: DataType): boolean {
    return (dataType >= DataType.BOOL) && (dataType <= DataType.BOOL_VEC4);
}

/**
 * Returns type of scalar
 * @param {DataType} dataType shader
 * @return {string} type of scalar type
 */
export function getDataTypeScalarType(dataType: DataType): string {
    switch (dataType) {
        case DataType.FLOAT: return 'float';
        case DataType.FLOAT_VEC2: return 'float';
        case DataType.FLOAT_VEC3: return 'float';
        case DataType.FLOAT_VEC4: return 'float';
        case DataType.FLOAT_MAT2: return 'float';
        case DataType.FLOAT_MAT2X3: return 'float';
        case DataType.FLOAT_MAT2X4: return 'float';
        case DataType.FLOAT_MAT3X2: return 'float';
        case DataType.FLOAT_MAT3: return 'float';
        case DataType.FLOAT_MAT3X4: return 'float';
        case DataType.FLOAT_MAT4X2: return 'float';
        case DataType.FLOAT_MAT4X3: return 'float';
        case DataType.FLOAT_MAT4: return 'float';
        case DataType.INT: return 'int';
        case DataType.INT_VEC2: return 'int';
        case DataType.INT_VEC3: return 'int';
        case DataType.INT_VEC4: return 'int';
        case DataType.UINT: return 'uint';
        case DataType.UINT_VEC2: return 'uint';
        case DataType.UINT_VEC3: return 'uint';
        case DataType.UINT_VEC4: return 'uint';
        case DataType.BOOL: return 'bool';
        case DataType.BOOL_VEC2: return 'bool';
        case DataType.BOOL_VEC3: return 'bool';
        case DataType.BOOL_VEC4: return 'bool';
        case DataType.SAMPLER_2D: return 'sampler2D';
        case DataType.SAMPLER_CUBE: return 'samplerCube';
        case DataType.SAMPLER_2D_ARRAY: return 'sampler2DArray';
        case DataType.SAMPLER_3D: return 'sampler3D';
        case DataType.SAMPLER_2D_SHADOW: return 'sampler2DShadow';
        case DataType.SAMPLER_CUBE_SHADOW: return 'samplerCubeShadow';
        case DataType.SAMPLER_2D_ARRAY_SHADOW: return 'sampler2DArrayShadow';
        case DataType.INT_SAMPLER_2D: return 'isampler2D';
        case DataType.INT_SAMPLER_CUBE: return 'isamplerCube';
        case DataType.INT_SAMPLER_2D_ARRAY: return 'isampler2DArray';
        case DataType.INT_SAMPLER_3D: return 'isampler3D';
        case DataType.UINT_SAMPLER_2D: return 'usampler2D';
        case DataType.UINT_SAMPLER_CUBE: return 'usamplerCube';
        case DataType.UINT_SAMPLER_2D_ARRAY: return 'usampler2DArray';
        case DataType.UINT_SAMPLER_3D: return 'usampler3D';
    }
    throw Error('Unrecognized dataType ' + dataType);
}

/**
 * Returns type of scalar
 * @param {DataType} dataType shader
 * @return {DataType} type of scalar type
 */
export function getDataTypeScalarTypeAsDataType(dataType: DataType): DataType {
    switch (dataType) {
        case DataType.FLOAT: return DataType.FLOAT;
        case DataType.FLOAT_VEC2: return DataType.FLOAT;
        case DataType.FLOAT_VEC3: return DataType.FLOAT;
        case DataType.FLOAT_VEC4: return DataType.FLOAT;
        case DataType.FLOAT_MAT2: return DataType.FLOAT;
        case DataType.FLOAT_MAT2X3: return DataType.FLOAT;
        case DataType.FLOAT_MAT2X4: return DataType.FLOAT;
        case DataType.FLOAT_MAT3X2: return DataType.FLOAT;
        case DataType.FLOAT_MAT3: return DataType.FLOAT;
        case DataType.FLOAT_MAT3X4: return DataType.FLOAT;
        case DataType.FLOAT_MAT4X2: return DataType.FLOAT;
        case DataType.FLOAT_MAT4X3: return DataType.FLOAT;
        case DataType.FLOAT_MAT4: return DataType.FLOAT;
        case DataType.INT: return DataType.INT;
        case DataType.INT_VEC2: return DataType.INT;
        case DataType.INT_VEC3: return DataType.INT;
        case DataType.INT_VEC4: return DataType.INT;
        case DataType.UINT: return DataType.UINT;
        case DataType.UINT_VEC2: return DataType.UINT;
        case DataType.UINT_VEC3: return DataType.UINT;
        case DataType.UINT_VEC4: return DataType.UINT;
        case DataType.BOOL: return DataType.BOOL;
        case DataType.BOOL_VEC2: return DataType.BOOL;
        case DataType.BOOL_VEC3: return DataType.BOOL;
        case DataType.BOOL_VEC4: return DataType.BOOL;
        case DataType.SAMPLER_2D:
        case DataType.SAMPLER_CUBE:
        case DataType.SAMPLER_2D_ARRAY:
        case DataType.SAMPLER_3D:
        case DataType.SAMPLER_2D_SHADOW:
        case DataType.SAMPLER_CUBE_SHADOW:
        case DataType.SAMPLER_2D_ARRAY_SHADOW:
        case DataType.INT_SAMPLER_2D:
        case DataType.INT_SAMPLER_CUBE:
        case DataType.INT_SAMPLER_2D_ARRAY:
        case DataType.INT_SAMPLER_3D:
        case DataType.UINT_SAMPLER_2D:
        case DataType.UINT_SAMPLER_CUBE:
        case DataType.UINT_SAMPLER_2D_ARRAY:
        case DataType.UINT_SAMPLER_3D:
            return dataType;
    }
    throw Error('Unrecognized dataType ' + dataType);
}

/**
 * Checks if dataType is integer or vectors of integers
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType integer or integer vector
 */
export function isDataTypeIntOrIVec(dataType: DataType): boolean {
    var retVal = false;
    switch (dataType) {
        case DataType.INT:
        case DataType.INT_VEC2:
        case DataType.INT_VEC3:
        case DataType.INT_VEC4:
            retVal = true;
    }

    return retVal;
}

/**
 * Checks if dataType is unsigned integer or vectors of unsigned integers
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType unsigned integer or unsigned integer vector
 */
export function isDataTypeUintOrUVec(dataType: DataType): boolean {
    var retVal = false;
    switch (dataType) {
        case DataType.UINT:
        case DataType.UINT_VEC2:
        case DataType.UINT_VEC3:
        case DataType.UINT_VEC4:
            retVal = true;
    }

    return retVal;
};

/**
* Returns type of scalar size
* @param {DataType} dataType shader
* @return {number} with size of the type of scalar
*/
export function getDataTypeScalarSize(dataType: DataType): number {
    switch (dataType) {
        case DataType.FLOAT: return 1;
        case DataType.FLOAT_VEC2: return 2;
        case DataType.FLOAT_VEC3: return 3;
        case DataType.FLOAT_VEC4: return 4;
        case DataType.FLOAT_MAT2: return 4;
        case DataType.FLOAT_MAT2X3: return 6;
        case DataType.FLOAT_MAT2X4: return 8;
        case DataType.FLOAT_MAT3X2: return 6;
        case DataType.FLOAT_MAT3: return 9;
        case DataType.FLOAT_MAT3X4: return 12;
        case DataType.FLOAT_MAT4X2: return 8;
        case DataType.FLOAT_MAT4X3: return 12;
        case DataType.FLOAT_MAT4: return 16;
        case DataType.INT: return 1;
        case DataType.INT_VEC2: return 2;
        case DataType.INT_VEC3: return 3;
        case DataType.INT_VEC4: return 4;
        case DataType.UINT: return 1;
        case DataType.UINT_VEC2: return 2;
        case DataType.UINT_VEC3: return 3;
        case DataType.UINT_VEC4: return 4;
        case DataType.BOOL: return 1;
        case DataType.BOOL_VEC2: return 2;
        case DataType.BOOL_VEC3: return 3;
        case DataType.BOOL_VEC4: return 4;
        case DataType.SAMPLER_2D: return 1;
        case DataType.SAMPLER_CUBE: return 1;
        case DataType.SAMPLER_2D_ARRAY: return 1;
        case DataType.SAMPLER_3D: return 1;
        case DataType.SAMPLER_2D_SHADOW: return 1;
        case DataType.SAMPLER_CUBE_SHADOW: return 1;
        case DataType.SAMPLER_2D_ARRAY_SHADOW: return 1;
        case DataType.INT_SAMPLER_2D: return 1;
        case DataType.INT_SAMPLER_CUBE: return 1;
        case DataType.INT_SAMPLER_2D_ARRAY: return 1;
        case DataType.INT_SAMPLER_3D: return 1;
        case DataType.UINT_SAMPLER_2D: return 1;
        case DataType.UINT_SAMPLER_CUBE: return 1;
        case DataType.UINT_SAMPLER_2D_ARRAY: return 1;
        case DataType.UINT_SAMPLER_3D: return 1;
    }
    throw Error('Unrecognized dataType ' + dataType);
}

/**
 * Checks if dataType is float or vector
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType float or vector
 */
export function isDataTypeFloatOrVec(dataType: DataType): boolean {
    switch (dataType) {
        case DataType.FLOAT:
        case DataType.FLOAT_VEC2:
        case DataType.FLOAT_VEC3:
        case DataType.FLOAT_VEC4:
            return true;
    }
    return false;
}

/**
 * Checks if dataType is a matrix
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType matrix or not
 */
export function isDataTypeMatrix(dataType: DataType): boolean {
    switch (dataType) {
        case DataType.FLOAT_MAT2:
        case DataType.FLOAT_MAT2X3:
        case DataType.FLOAT_MAT2X4:
        case DataType.FLOAT_MAT3X2:
        case DataType.FLOAT_MAT3:
        case DataType.FLOAT_MAT3X4:
        case DataType.FLOAT_MAT4X2:
        case DataType.FLOAT_MAT4X3:
        case DataType.FLOAT_MAT4:
            return true;
    }
    return false;
}

/**
 * Checks if dataType is a vector
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or not
 */
export function isDataTypeScalar(dataType: DataType): boolean {
    switch (dataType) {
        case DataType.FLOAT:
        case DataType.INT:
        case DataType.UINT:
        case DataType.BOOL:
            return true;
    }
    return false;
}

/**
 * Checks if dataType is a vector
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or not
 */
export function isDataTypeVector(dataType: DataType): boolean {
    switch (dataType) {
        case DataType.FLOAT_VEC2:
        case DataType.FLOAT_VEC3:
        case DataType.FLOAT_VEC4:
        case DataType.INT_VEC2:
        case DataType.INT_VEC3:
        case DataType.INT_VEC4:
        case DataType.UINT_VEC2:
        case DataType.UINT_VEC3:
        case DataType.UINT_VEC4:
        case DataType.BOOL_VEC2:
        case DataType.BOOL_VEC3:
        case DataType.BOOL_VEC4:
            return true;
    }
    return false;
}

/**
 * Checks if dataType is a vector or a scalar type
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or scalar or not
 */
export function isDataTypeScalarOrVector(dataType: DataType): boolean {
    switch (dataType) {
        case DataType.FLOAT:
        case DataType.FLOAT_VEC2:
        case DataType.FLOAT_VEC3:
        case DataType.FLOAT_VEC4:
        case DataType.INT:
        case DataType.INT_VEC2:
        case DataType.INT_VEC3:
        case DataType.INT_VEC4:
        case DataType.UINT:
        case DataType.UINT_VEC2:
        case DataType.UINT_VEC3:
        case DataType.UINT_VEC4:
        case DataType.BOOL:
        case DataType.BOOL_VEC2:
        case DataType.BOOL_VEC3:
        case DataType.BOOL_VEC4:
            return true;
    }
    return false;
}

/**
 * Checks if dataType is a sampler
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or scalar or not
 */
export function isDataTypeSampler(dataType: DataType): boolean {
    return (dataType >= DataType.SAMPLER_2D) && (dataType <= DataType.UINT_SAMPLER_3D);
}

/**
 * Returns number of rows of a DataType Matrix
 * @param {DataType} dataType shader
 * @return {number} with number of rows depending on DataType Matrix
 */
export function getDataTypeMatrixNumRows(dataType: DataType): number {
    switch (dataType) {
        case DataType.FLOAT_MAT2: return 2;
        case DataType.FLOAT_MAT2X3: return 3;
        case DataType.FLOAT_MAT2X4: return 4;
        case DataType.FLOAT_MAT3X2: return 2;
        case DataType.FLOAT_MAT3: return 3;
        case DataType.FLOAT_MAT3X4: return 4;
        case DataType.FLOAT_MAT4X2: return 2;
        case DataType.FLOAT_MAT4X3: return 3;
        case DataType.FLOAT_MAT4: return 4;
    }
    throw Error('Unrecognized dataType ' + dataType);
}

/**
 * Returns number of columns of a DataType Matrix
 * @param {DataType} dataType shader
 * @return {number} with number of columns depending on DataType Matrix
 */
export function getDataTypeMatrixNumColumns(dataType: DataType): number {
    switch (dataType) {
        case DataType.FLOAT_MAT2: return 2;
        case DataType.FLOAT_MAT2X3: return 2;
        case DataType.FLOAT_MAT2X4: return 2;
        case DataType.FLOAT_MAT3X2: return 3;
        case DataType.FLOAT_MAT3: return 3;
        case DataType.FLOAT_MAT3X4: return 3;
        case DataType.FLOAT_MAT4X2: return 4;
        case DataType.FLOAT_MAT4X3: return 4;
        case DataType.FLOAT_MAT4: return 4;
    }
    throw Error('Unrecognized dataType ' + dataType);
}

/**
 * Returns name of the dataType
 * @param {DataType} dataType shader
 * @return {string} dataType name
 */
export function getDataTypeName(dataType: DataType): string {
    switch (dataType) {
        case DataType.INVALID: return 'invalid';

        case DataType.FLOAT: return 'float';
        case DataType.FLOAT_VEC2: return 'vec2';
        case DataType.FLOAT_VEC3: return 'vec3';
        case DataType.FLOAT_VEC4: return 'vec4';
        case DataType.FLOAT_MAT2: return 'mat2';
        case DataType.FLOAT_MAT2X3: return 'mat2x3';
        case DataType.FLOAT_MAT2X4: return 'mat2x4';
        case DataType.FLOAT_MAT3X2: return 'mat3x2';
        case DataType.FLOAT_MAT3: return 'mat3';
        case DataType.FLOAT_MAT3X4: return 'mat3x4';
        case DataType.FLOAT_MAT4X2: return 'mat4x2';
        case DataType.FLOAT_MAT4X3: return 'mat4x3';
        case DataType.FLOAT_MAT4: return 'mat4';

        case DataType.INT: return 'int';
        case DataType.INT_VEC2: return 'ivec2';
        case DataType.INT_VEC3: return 'ivec3';
        case DataType.INT_VEC4: return 'ivec4';

        case DataType.UINT: return 'uint';
        case DataType.UINT_VEC2: return 'uvec2';
        case DataType.UINT_VEC3: return 'uvec3';
        case DataType.UINT_VEC4: return 'uvec4';

        case DataType.BOOL: return 'bool';
        case DataType.BOOL_VEC2: return 'bvec2';
        case DataType.BOOL_VEC3: return 'bvec3';
        case DataType.BOOL_VEC4: return 'bvec4';

        case DataType.SAMPLER_2D: return 'sampler2D';
        case DataType.SAMPLER_CUBE: return 'samplerCube';
        case DataType.SAMPLER_2D_ARRAY: return 'sampler2DArray';
        case DataType.SAMPLER_3D: return 'sampler3D';

        case DataType.SAMPLER_2D_SHADOW: return 'sampler2DShadow';
        case DataType.SAMPLER_CUBE_SHADOW: return 'samplerCubeShadow';
        case DataType.SAMPLER_2D_ARRAY_SHADOW: return 'sampler2DArrayShadow';

        case DataType.INT_SAMPLER_2D: return 'isampler2D';
        case DataType.INT_SAMPLER_CUBE: return 'isamplerCube';
        case DataType.INT_SAMPLER_2D_ARRAY: return 'isampler2DArray';
        case DataType.INT_SAMPLER_3D: return 'isampler3D';

        case DataType.UINT_SAMPLER_2D: return 'usampler2D';
        case DataType.UINT_SAMPLER_CUBE: return 'usamplerCube';
        case DataType.UINT_SAMPLER_2D_ARRAY: return 'usampler2DArray';
        case DataType.UINT_SAMPLER_3D: return 'usampler3D';
    }
    throw Error('Unrecognized dataType ' + dataType);
}

/**
 * Returns the DataType from the GL type
 * @param {WebGL2RenderingContext} gl
 * @param {deMath.deUint32} glType
 * @return {DataType}
 */
export function getDataTypeFromGLType(gl: WebGL2RenderingContext, glType: number): DataType {
    switch (glType)
    {
        case gl.FLOAT: return DataType.FLOAT;
        case gl.FLOAT_VEC2: return DataType.FLOAT_VEC2;
        case gl.FLOAT_VEC3: return DataType.FLOAT_VEC3;
        case gl.FLOAT_VEC4: return DataType.FLOAT_VEC4;

        case gl.FLOAT_MAT2: return DataType.FLOAT_MAT2;
        case gl.FLOAT_MAT2x3: return DataType.FLOAT_MAT2X3;
        case gl.FLOAT_MAT2x4: return DataType.FLOAT_MAT2X4;

        case gl.FLOAT_MAT3x2: return DataType.FLOAT_MAT3X2;
        case gl.FLOAT_MAT3: return DataType.FLOAT_MAT3;
        case gl.FLOAT_MAT3x4: return DataType.FLOAT_MAT3X4;

        case gl.FLOAT_MAT4x2: return DataType.FLOAT_MAT4X2;
        case gl.FLOAT_MAT4x3: return DataType.FLOAT_MAT4X3;
        case gl.FLOAT_MAT4: return DataType.FLOAT_MAT4;

        case gl.INT: return DataType.INT;
        case gl.INT_VEC2: return DataType.INT_VEC2;
        case gl.INT_VEC3: return DataType.INT_VEC3;
        case gl.INT_VEC4: return DataType.INT_VEC4;

        case gl.UNSIGNED_INT: return DataType.UINT;
        case gl.UNSIGNED_INT_VEC2: return DataType.UINT_VEC2;
        case gl.UNSIGNED_INT_VEC3: return DataType.UINT_VEC3;
        case gl.UNSIGNED_INT_VEC4: return DataType.UINT_VEC4;

        case gl.BOOL: return DataType.BOOL;
        case gl.BOOL_VEC2: return DataType.BOOL_VEC2;
        case gl.BOOL_VEC3: return DataType.BOOL_VEC3;
        case gl.BOOL_VEC4: return DataType.BOOL_VEC4;

        case gl.SAMPLER_2D: return DataType.SAMPLER_2D;
        case gl.SAMPLER_CUBE: return DataType.SAMPLER_CUBE;
        case gl.SAMPLER_2D_ARRAY: return DataType.SAMPLER_2D_ARRAY;
        case gl.SAMPLER_3D: return DataType.SAMPLER_3D;

        case gl.SAMPLER_2D_SHADOW: return DataType.SAMPLER_2D_SHADOW;
        case gl.SAMPLER_CUBE_SHADOW: return DataType.SAMPLER_CUBE_SHADOW;
        case gl.SAMPLER_2D_ARRAY_SHADOW: return DataType.SAMPLER_2D_ARRAY_SHADOW;

        case gl.INT_SAMPLER_2D: return DataType.INT_SAMPLER_2D;
        case gl.INT_SAMPLER_CUBE: return DataType.INT_SAMPLER_CUBE;
        case gl.INT_SAMPLER_2D_ARRAY: return DataType.INT_SAMPLER_2D_ARRAY;
        case gl.INT_SAMPLER_3D: return DataType.INT_SAMPLER_3D;

        case gl.UNSIGNED_INT_SAMPLER_2D: return DataType.UINT_SAMPLER_2D;
        case gl.UNSIGNED_INT_SAMPLER_CUBE: return DataType.UINT_SAMPLER_CUBE;
        case gl.UNSIGNED_INT_SAMPLER_2D_ARRAY: return DataType.UINT_SAMPLER_2D_ARRAY;
        case gl.UNSIGNED_INT_SAMPLER_3D: return DataType.UINT_SAMPLER_3D;

        default:
            return DataType.LAST;
    }
}

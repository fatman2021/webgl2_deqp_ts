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

declare function bufferedLogToConsole(msg: string): void;

import deqpUtils = require('framework/opengl/gluShaderUtil');

function DE_ASSERT(x: any): void {
    if (!x)
        throw new Error('Assert failed');
}

/**
 * VarType types enum
 * @enum {number}
 */
enum Type {
    TYPE_BASIC,
    TYPE_ARRAY,
    TYPE_STRUCT
}

/** Array length for unsized arrays */
export var UNSIZED_ARRAY: number = -1;


class BasicData { type: deqpUtils.DataType; precision: deqpUtils.precision }
class ArrayData { elementType: VarType; size: number }

/**
 * VarType class
 */
export class VarType {
    private m_type: Type;
    private m_data: BasicData|ArrayData|StructType;

    constructor() {
        this.m_type = undefined;
        /*
         * m_data used to be a 'Data' union in C++. Using a var is enough here.
         * it will contain any necessary value.
         */
        this.m_data = undefined;
    }

    /**
     * Creates a basic type VarType. Use this after the constructor call.
     * @param {deqpUtils.DataType} basicType
     * @param {deMath.deUint32} flags
     * @return {VarType} The currently modified object
     */
    VarTypeBasic(basicType: deqpUtils.DataType, precision: deqpUtils.precision): VarType {
        this.m_type = Type.TYPE_BASIC;
        this.m_data = { type: basicType, precision: precision };

        return this;
    }

    /**
     * Creates an array type VarType. Use this after the constructor call.
     * @param {VarType} elementType
     * @param {number} arraySize
     * @return {VarType} The currently modified object
     */
    VarTypeArray(elementType: VarType, arraySize: number):VarType {
        this.m_type = Type.TYPE_ARRAY;
        this.m_data = { elementType: elementType, size: arraySize };

        return this;
    }

    /**
     * Creates a struct type VarType. Use this after the constructor call.
     * @param {StructType} structPtr
     * @return {VarType} The currently modified object
     */
    VarTypeStruct(structPtr:StructType):VarType {
        this.m_type = Type.TYPE_STRUCT;
        this.m_data = structPtr;

        return this;
    }

    /** isBasicType
     * @return {boolean} true if the VarType represents a basic type.
     */
    isBasicType():boolean {
        return this.m_type === Type.TYPE_BASIC;
    }

    /** isArrayType
     * @return {boolean} true if the VarType represents an array.
     */
    isArrayType():boolean {
        return this.m_type === Type.TYPE_ARRAY;
    }

    /** isStructType
     * @return {boolean} true if the VarType represents a struct.
     */
    isStructType():boolean {
        return this.m_type === Type.TYPE_STRUCT;
    }

    /** getBasicType
     * @return {deqpUtils.DataType} returns the basic data type of the VarType.
     */
    getBasicType() {
        DE_ASSERT(this.isBasicType());
        return (<BasicData>this.m_data).type;
    }

    /** getElementType
     * @return {VarType} returns the VarType of the element in case of an Array.
     */
    getElementType():VarType {
        DE_ASSERT(this.isArrayType());
        return (<ArrayData>this.m_data).elementType
    }

    /** getArraySize
     * (not to be confused with a javascript array)
     * @return {number} returns the size of the array in case it is an array.
     */
    getArraySize():number {
        DE_ASSERT(this.isArrayType());
        return (<ArrayData>this.m_data).size;
    }

    /** getStruct
     * @return {StructType} returns the structure when it is a StructType.
     */
    getStruct():StructType {
        DE_ASSERT(this.isStructType());
        return <StructType>this.m_data;
    }

    /** getPrecision
     * @return {deqpUtils.precision} returns the precision flag name.
     */
    getPrecision(): deqpUtils.precision {
        DE_ASSERT(this.isBasicType());
        return (<BasicData>this.m_data).precision;
    }

    /**
     * getScalarSize
     * @return {number} size of the scalar
     */
    getScalarSize():number {
        if (this.m_type === Type.TYPE_BASIC) {
            return deqpUtils.getDataTypeScalarSize(this.getBasicType());
        } else if (this.m_type === Type.TYPE_ARRAY) {
            return this.getElementType().getScalarSize() * this.getArraySize();
        } else if (this.m_type === Type.TYPE_STRUCT) {
            var size = 0;
            var struct = this.getStruct();
            var memberCount = struct.getSize();
            for (var iter = 0; iter < memberCount; iter++)
                size += struct.getMember(iter).getType().getScalarSize();
            return size;
        } else {
            return 0;
        }
    }

    /**
     * is
     * @return {boolean} returns true if the current object is equivalent to other.
     */
    is(other: VarType): boolean {
        if (this.m_type != other.m_type)
            return false;

        var td, od;
        if (this.m_type === Type.TYPE_BASIC) {
            td = <BasicData>this.m_data;
            od = <BasicData>other.m_data;
            return td.type === od.type && td.precision === od.precision;
        } else if (this.m_type === Type.TYPE_ARRAY) {
            td = <ArrayData>this.m_data;
            od = <ArrayData>other.m_data;
            return td.elementType === od.elementType && td.size === od.size;
        } else if (this.m_type === Type.TYPE_STRUCT) {
            return this.m_data === other.m_data;
        } else {
            return false;
        }
    }

    /**
     * isnt
     * @return {boolean} returns true if the current object is not equivalent to other.
     */
    isnt(other: VarType):boolean {
        return !this.is(other);
    }
}

/**
 * Creates a basic type VarType.
 * @param {deqpUtils.DataType} basicType
 * @param {deMath.deUint32} flags
 * @return {VarType}
 */
export function newTypeBasic(basicType, flags:number): VarType {
    return new VarType().VarTypeBasic(basicType, flags);
}

/**
 * Creates an array type VarType.
 * @param {VarType} elementType
 * @param {number} arraySize
 * @return {VarType}
 */
export function newTypeArray(elementType:VarType, arraySize:number): VarType {
    return new VarType().VarTypeArray(elementType, arraySize);
}

/**
 * Creates a struct type VarType.
 * @param {StructType} structPtr
 * @return {VarType}
 */
export function newTypeStruct(structPtr:StructType): VarType {
    return new VarType().VarTypeStruct(structPtr);
}

/**
 * StructMember class
 */
export class StructMember {
    /** @type {string} */ private m_name:string;
    /** @type {VarType} */ private m_type:VarType;
    /** @type {deMath.deUint32} */ // this.m_flags = 0; // only in glsUniformBlockCase

    /**
     * Creates a StructMember. Use this after the constructor call.
     * @param {string} name
     * @param {VarType} type
     * @return {StructMember} The currently modified object
     */
    Constructor(name:string, type:VarType):StructMember {
        this.m_type = type;
        this.m_name = name;
        // this.m_flags = flags; // only in glsUniformBlockCase

        return this;
    }

    /** getName
     * @return {string} name of the StructMember object.
     */
    getName():string {
        return this.m_name;
    }

    /** getType
     * @return {VarType} type of the StructMember object.
     */
    getType():VarType {
        return this.m_type;
    }

    /**  only in glsUniformBlockCase! getFlags
     * @return {deMath.deUint32} the flags in the member
     */
//    getFlags():number {
//        return this.m_flags;
//    }
}

/**
 * Creates a StructMember.
 * @param {string} name
 * @param {VarType} type
 * @return {StructMember}
 */
export function newStructMember(name: string, type: VarType): StructMember {
    return new StructMember().Constructor(name, type);
}

/**
 * StructType class
 */
export class StructType {
    private m_typeName:string;
    private m_members:StructMember[];

    constructor() {
        this.m_typeName = this.setTypeName(name);
        this.m_members = [];
    }

    /**
     * Creates a StructType. Use this after the constructor call.
     * @param {string} name
     * @return {StructType} The currently modified object
     */
    Constructor(name:string):StructType {
        /** @type {string}*/ this.m_typeName = this.setTypeName(name);
        return this;
    }

    /** hasTypeName
     * Checks if the StructType m_typeName is defined
     * @return {boolean}
     **/
    hasTypeName():boolean {
        return (this.m_typeName !== 'undefined');
    }

    /** setTypeName
     * @param {string} name
     * @return {string} returns StructType.m_typeName
     **/
    setTypeName(name:string):string {
        return this.m_typeName = name;
    }

    /** getTypeName
     * @return {string}
     **/
    getTypeName():string {
        return this.m_typeName;
    }

    /** getMember
     * @param {number} memberNdx The index of the member to retrieve.
     * @return {StructMember}
     **/
    getMember(memberNdx:number):StructMember {
        if (memberNdx >= 0 && memberNdx < this.m_members.length)
            return this.m_members[memberNdx];
        else {
            bufferedLogToConsole('Error: Invalid member index for StructTypes members');
            return undefined;
        }
    }

    /** getSize
     * @return {number} The size of the m_members array.
     **/
    getSize():number {
        return this.m_members.length;
    }

    /** addMember
     * @param {string} name
     * @param {VarType} type
     **/
    addMember(name:string, type:VarType):void {
        var member = newStructMember(name, type);
        this.m_members.push(member);
    }
}

/**
 * Creates a StructType.
 * @param {string} name
 * @return {StructType}
 */
export function newStructType(name: string): StructType {
    return new StructType().Constructor(name);
}

/**
 * @param {number} level
 * @return {string}
 */
function indent(level: number): string {
    /** @type {string} */ var str = '';
    for (var i = 0; i < level; i++)
        str += '\t';
    return str;
}

/**
 * @param {VarType} varType
 * @param {string} name
 * @param {number} level
 * @return {string}
 */
export function declareVariable(varType: VarType, name: string, level: number = 0) {
    var str: string = '';
    var type: VarType = varType;
    var curType: VarType = type;
    var arraySizes: number[] = [];

    // Handle arrays.
    while (curType.isArrayType())
    {
        arraySizes.push(curType.getArraySize());
        curType = curType.getElementType();
    }

    if (curType.isBasicType())
    {
        if (curType.getPrecision() !== undefined)
            str += deqpUtils.getPrecisionName(curType.getPrecision()) + ' ';
        str += deqpUtils.getDataTypeName(curType.getBasicType());
    }
    else if (curType.isStructType())
    {
        var structPtr: StructType = curType.getStruct();

        if (structPtr.hasTypeName())
            str += structPtr.getTypeName();
        else
            str += declareStructType(structPtr, level); // Generate inline declaration.
    }
    else
        DE_ASSERT(false);

    str += ' ' + name;

    // Print array sizes.
    for (var size = 0; size < arraySizes.length; size++)//std::vector<int>::const_iterator sizeIter = arraySizes.begin(); sizeIter != arraySizes.end(); sizeIter++)
    {
        var arrSize = arraySizes[size];
        if (arrSize == UNSIZED_ARRAY)
            str += '[]';
        else
            str += '[' + arrSize + ']';
    }

    return str;
}

/**
 * @param {StructType} structType
 * @param {number} level
 * @return {string}
 */
export function declareStructType(structType: StructType, level = 0) {
    var str: string = 'struct';

    // Type name is optional.
    if (structType.hasTypeName())
        str += ' ' + structType.getTypeName();

    str += '\n' + indent(level) + '{\n';

    for (var memberNdx = 0; memberNdx < structType.getSize(); memberNdx++)//StructType::ConstIterator memberIter = decl.structPtr->begin(); memberIter != decl.structPtr->end(); memberIter++)
    {
        /** @type {StructMember} */ var memberIter = structType.getMember(memberNdx);
        str += indent(level + 1);
        str += declareVariable(memberIter.getType(), memberIter.getName(), level + 1) + ';\n';
    }

    str += indent(level) + '}';

    return str;
}

//        UNSIZED_ARRAY: VarType.UNSIZED_ARRAY //!< Array length for unsized arrays.


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

import gluVarType = require('framework/opengl/gluVarType');
import deqpUtils = require('framework/opengl/gluShaderUtil');

function isNum(c:string):boolean {
    return /^[0-9]$/.test(c);
}
function isAlpha(c:string):boolean {
    return /^[a-zA-Z]$/.test(c);
}
function isIdentifierChar(c:string):boolean {
    return /^[a-zA-Z0-9_]$/.test(c);
}

interface Comparible {
    isnt(other:Comparible): boolean;
}

function array_op_equivalent<T extends Comparible>(arr1:Array<T>, arr2:Array<T>):boolean {
    if (arr1.length != arr2.length)
        return false;

    for (var i = 0; i < arr1.length; ++i) {
        if (arr1[i].isnt(arr2[1]))
            return false;
    }

    return true;
}

enum Token {
    IDENTIFIER,
    LEFT_BRACKET,
    RIGHT_BRACKET,
    PERIOD,
    NUMBER,
    END,
}
module Token {
    export var length:number = Object.keys(Token).length / 2;
}

/**
 * VarTokenizer class.
 * @param {string} str
 * @return {Object}
 */
export class VarTokenizer {
    private m_str:string;
    private m_token:number;
    private m_tokenStart:number;
    private m_tokenLen:number;

    constructor(str:string) {
        this.m_str = str;
        this.m_token = Token.length; // TODO: Fix this
        this.m_tokenStart = 0;
        this.m_tokenLen = 0;

        this.advance();
    }

    getToken():number {
        return this.m_token;
    }

    getIdentifier():string {
        return this.m_str.substr(this.m_tokenStart, this.m_tokenLen);
    }

    getNumber():number {
        return parseInt(this.getIdentifier());
    }

    getCurrentTokenStartLocation():number {
        return this.m_tokenStart;
    }

    getCurrentTokenEndLocation():number {
        return this.m_tokenStart + this.m_tokenLen;
    }

    advance() {
        if (this.m_token == Token.END) {
            throw new Error('No more tokens.');
        }

        this.m_tokenStart += this.m_tokenLen;
        this.m_token = 6; //Token.LAST; // TODO: fix this length
        this.m_tokenLen = 1;

        if (this.m_tokenStart >= this.m_str.length) {
            this.m_token = Token.END;
        }
        else if (this.m_str[this.m_tokenStart] == '[') {
            this.m_token = Token.LEFT_BRACKET;
        }
        else if (this.m_str[this.m_tokenStart] == ']') {
            this.m_token = Token.RIGHT_BRACKET;
        }
        else if (this.m_str[this.m_tokenStart] == '.') {
            this.m_token = Token.PERIOD;
        }
        else if (isNum(this.m_str[this.m_tokenStart])) {
            this.m_token = Token.NUMBER;
            while (isNum(this.m_str[this.m_tokenStart + this.m_tokenLen])) {
                this.m_tokenLen += 1;
            }
        }
        else if (isIdentifierChar(this.m_str[this.m_tokenStart])) {
            this.m_token = Token.IDENTIFIER;
            while (isIdentifierChar(this.m_str[this.m_tokenStart + this.m_tokenLen])) {
                this.m_tokenLen += 1;
            }
        }
        else {
            throw new Error('Unexpected character');
        }
    }
}

/**
 * @enum
 */
export enum ComponentType {
    STRUCT_MEMBER,
    ARRAY_ELEMENT,
    MATRIX_COLUMN,
    VECTOR_COMPONENT
}
export module ComponentType {
    export var length:number = Object.keys(ComponentType).length / 2;
}

/**
 * VarType subtype path utilities class.
 * @param {ComponentType} type_
 * @param {number} index_
 * @return {Object}
 */
export class VarTypeComponent {
    type:ComponentType;
    index:number;

    constructor(type_?:ComponentType, index_?:number) {
        this.type = type_ || null;
        this.index = index_ || ComponentType.length;
    }

    is(other:VarTypeComponent):boolean {
        return this.type === other.type && this.index === other.index;
    }

    isnt(other:VarTypeComponent):boolean {
        return this.type !== other.type || this.index !== other.index;
    }
}

/**
 * Type path formatter.
 * @param {gluVarType.VarType} type_
 * @param {Array.<VarTypeComponent>} path_
 * @return {Object}
 */
class TypeAccessFormat {
    constructor(public type:gluVarType.VarType, public path:VarTypeComponent[]) {
    }

    toString():string {
        var curType = this.type;
        var str = '';

        for (var i = 0; i < this.path.length; i++) {
            var iter = this.path[i];
            switch (iter.type) {
                case ComponentType.ARRAY_ELEMENT:
                    curType = curType.getElementType(); // Update current type.
                // Fall-through.

                case ComponentType.MATRIX_COLUMN:
                case ComponentType.VECTOR_COMPONENT:
                    str += "[" + iter.index + "]";
                    break;

                case ComponentType.STRUCT_MEMBER:
                {
                    var member = curType.getStruct().getMember(i);
                    str += "." + member.getName();
                    curType = member.getType();
                    break;
                }

                default:
                    throw new Error("Unrecognized type:" + iter.type);
            }
        }

        return str;
    }
}

/** SubTypeAccess
 * @param {gluVarType.VarType} type
 * @return {SubTypeAccess | array_op_equivalent | boolean}
 */
class SubTypeAccess {

    private m_type:gluVarType.VarType;
    private m_path:VarTypeComponent[];

    constructor(type:gluVarType.VarType) {
        this.m_type = type;
        this.m_path = [];
    }

    private helper(type:ComponentType, ndx:number):SubTypeAccess {
        this.m_path.push(new VarTypeComponent(type, ndx));
        if (!this.isValid()) {
            throw new Error;
        }
        return this;
    }

    member(ndx:number):SubTypeAccess {
        return this.helper(ComponentType.STRUCT_MEMBER, ndx);
    }

    element(ndx:number):SubTypeAccess {
        return this.helper(ComponentType.ARRAY_ELEMENT, ndx);
    }

    column(ndx:number):SubTypeAccess {
        return this.helper(ComponentType.MATRIX_COLUMN, ndx);
    }

    component(ndx:number):SubTypeAccess {
        return this.helper(ComponentType.VECTOR_COMPONENT, ndx);
    }

    parent():SubTypeAccess {
        if (this.m_path.length === 0) {
            throw new Error;
        }
        this.m_path.pop();
        return this;
    }

    isValid():boolean {
        return isValidTypePath(this.m_type, this.m_path);
    }

    getType() {
        return getVarType(this.m_type, this.m_path);
    }

    getPath():VarTypeComponent[] {
        return this.m_path;
    }

    empty():boolean {
        return this.m_path.length === 0;
    }

    is(other:SubTypeAccess):boolean {
        return array_op_equivalent(this.m_path, other.m_path) && this.m_type.is(other.m_type);
    }

    isnt(other:SubTypeAccess):boolean {
        return !this.is(other);
    }
}

/**
 * Subtype iterator parent class.
 * basic usage for all child classes:
 *     for (var i = new BasicTypeIterator(type) ; !i.end() ; i.next()) {
 *         var j = i.getType();
 *     }
 * To inherit from this base class, use this outside the child's definition:
 *     ChildClass.prototype = new SubTypeIterator();
 * @return {Object}
 */
class SubTypeIterator {

    private m_type: gluVarType.VarType;  // const VarType*
    private m_path:VarTypeComponent[]; // TypeComponentVector

    constructor(type: gluVarType.VarType) {
        this.m_type = type;
        this.m_path = [];

        this.findNext();
    }

    private removeTraversed():void {
        while (this.m_path.length) {
            var curComp = this.m_path[this.m_path.length - 1]; // VarTypeComponent&
            var parentType = getVarType(this.m_type, this.m_path, 0, this.m_path.length - 1); // VarType

            if (curComp.type == ComponentType.MATRIX_COLUMN) {
                if (!deqpUtils.isDataTypeMatrix(parentType.getBasicType())) {
                    throw new Error('Isn\'t a matrix.');
                }
                if (curComp.index + 1 < deqpUtils.getDataTypeMatrixNumColumns(parentType.getBasicType())) {
                    break;
                }
            }
            else if (curComp.type == ComponentType.VECTOR_COMPONENT) {
                if (!deqpUtils.isDataTypeVector(parentType.getBasicType())) {
                    throw new Error('Isn\'t a vector.');
                }
                if (curComp.index + 1 < deqpUtils.getDataTypeScalarSize(parentType.getBasicType())) {
                    break;
                }
            }
            else if (curComp.type == ComponentType.ARRAY_ELEMENT) {
                if (!parentType.isArrayType()) {
                    throw new Error('Isn\'t an array.');
                }
                if (curComp.index + 1 < parentType.getArraySize()) {
                    break;
                }

            }
            else if (curComp.type == ComponentType.STRUCT_MEMBER) {
                if (!parentType.isStructType()) {
                    throw new Error('Isn\'t a struct.');
                }
                if (curComp.index + 1 < parentType.getStruct().getSize()) {
                    break;
                }

            }

            this.m_path.pop();
        }
    }

    findNext():void {
        if (this.m_path.length > 0) {
            // Increment child counter in current level.
            var curComp = this.m_path[this.m_path.length - 1]; // VarTypeComponent&
            curComp.index += 1;
        }

        for (; ;) {

            var curType = getVarType(this.m_type, this.m_path); // VarType

            if (this.isExpanded(curType))
                break;

            // Recurse into child type.
            if (curType.isBasicType()) {
                var basicType = curType.getBasicType(); // DataType

                if (deqpUtils.isDataTypeMatrix(basicType)) {
                    this.m_path.push(new VarTypeComponent(ComponentType.MATRIX_COLUMN, 0));
                }
                else if (deqpUtils.isDataTypeVector(basicType)) {
                    this.m_path.push(new VarTypeComponent(ComponentType.VECTOR_COMPONENT, 0));
                }
                else {
                    throw new Error('Cant expand scalars - isExpanded() is buggy.');
                }
            }
            else if (curType.isArrayType()) {
                this.m_path.push(new VarTypeComponent(ComponentType.ARRAY_ELEMENT, 0));
            }
            else if (curType.isStructType()) {
                this.m_path.push(new VarTypeComponent(ComponentType.STRUCT_MEMBER, 0));
            }
            else {
                throw new Error();
            }
        }
    }

    end():boolean {
        return this.m_type === null;
    }

    // equivalent to operator++(), doesn't return.
    next():void {
        if (this.m_path.length > 0) {
            // Remove traversed nodes.
            this.removeTraversed();

            if (this.m_path.length > 0)
                this.findNext();
            else
                this.m_type = null; // Unset type to signal end.
        }
        else {
            if (!this.isExpanded(getVarType(this.m_type, this.m_path))) {
                throw new Error('First type was already expanded.');
            }
            this.m_type = null;
        }
    }

    getType():gluVarType.VarType {
        return getVarType(this.m_type, this.m_path);
    }

    getPath():VarTypeComponent[] {
        return this.m_path;
    }

    toString():string {
        var x = new TypeAccessFormat(this.m_type, this.m_path);
        return x.toString();
    }

    isExpanded(type: gluVarType.VarType): boolean { return false; }
}

/** BasicTypeIterator
 * @param {gluVarType.VarType} type
 * @return {gluVarType.Type}
 */
export class BasicTypeIterator extends SubTypeIterator {
    constructor(type:gluVarType.VarType) {
        super(type);
    }

    isExpanded(type:gluVarType.VarType):boolean {
        return type.isBasicType();
    }
}

/** VectorTypeIterator
 * @param {gluVarType.VarType} type
 * @return {gluVarType.Type}
 */
export class VectorTypeIterator extends SubTypeIterator {
    constructor(type:gluVarType.VarType) {
        super(type);
    }

    isExpanded(type:gluVarType.VarType):boolean {
        return type.isBasicType() && deqpUtils.isDataTypeScalarOrVector(type.getBasicType());
    }
}

/** ScalarTypeIterator
 * @param {gluVarType.VarType} type
 * @return {gluVarType.Type}
 */
export class ScalarTypeIterator extends SubTypeIterator {
    constructor(type:gluVarType.VarType) {
        super(type);
    }

    isExpanded(type:gluVarType.VarType):boolean {
        return type.isBasicType() && deqpUtils.isDataTypeScalar(type.getBasicType());
    }
}

function inBounds<T>(x:T, a:T, b:T):boolean {
    return a <= x && x < b;
}

/** isValidTypePath
 * @param {gluVarType.VarType} type
 * @param {Array.<VarTypeComponent>} array
 * @param {number} begin
 * @param {number} end
 * @return {boolean}
 */
function isValidTypePath(type: gluVarType.VarType, array: VarTypeComponent[], begin: number = 0, end: number = array.length): boolean {

    var curType = type; // const VarType*
    var pathIter = begin; // Iterator

    // Process struct member and array element parts of path.
    while (pathIter != end) {
        var element = array[pathIter];

        if (element.type == ComponentType.STRUCT_MEMBER) {

            if (!curType.isStructType() || !inBounds(element.index, 0, curType.getStruct().getSize())) {
                return false;
            }

            curType = curType.getStruct().getMember(element.index).getType();

        }
        else if (element.type == ComponentType.ARRAY_ELEMENT) {
            if (
                !curType.isArrayType() ||
                (
                curType.getArraySize() != gluVarType.UNSIZED_ARRAY && !inBounds(element.index, 0, curType.getArraySize())
                )
            ) {
                return false;
            }

            curType = curType.getElementType();
        }
        else {
            break;
        }

        ++pathIter;
    }

    if (pathIter != end) {
        if (!(
            array[pathIter].type == ComponentType.MATRIX_COLUMN ||
            array[pathIter].type == ComponentType.VECTOR_COMPONENT
            )) {
            throw new Error('Not a matrix or a vector');
        }

        // Current type should be basic type.
        if (!curType.isBasicType()) {
            return false;
        }

        var basicType = curType.getBasicType(); // DataType

        if (array[pathIter].type == ComponentType.MATRIX_COLUMN) {
            if (!deqpUtils.isDataTypeMatrix(basicType)) {
                return false;
            }

            basicType = deqpUtils.getDataTypeFloatVec(deqpUtils.getDataTypeMatrixNumRows(basicType));
            ++pathIter;
        }

        if (pathIter != end && array[pathIter].type == ComponentType.VECTOR_COMPONENT) {
            if (!deqpUtils.isDataTypeVector(basicType))
                return false;

            basicType = deqpUtils.getDataTypeScalarTypeAsDataType(basicType);
            ++pathIter;
        }
    }

    return pathIter == end;
}

/** getVarType
 * @param {gluVarType.VarType} type
 * @param {Array.<VarTypeComponent>} array
 * @param {number} start
 * @param {number} end
 * @return {gluVarType.VarType}
 */
export function getVarType(type:gluVarType.VarType, array:VarTypeComponent[], start:number = 0, end:number = array.length):gluVarType.VarType {

    if (!isValidTypePath(type, array, start, end)) {
        throw new Error('Type is invalid');
    }

    var curType = type; // const VarType*
    var element = null; // Iterator
    var pathIter = 0;

    // Process struct member and array element parts of path.
    for (pathIter = start; pathIter != end; ++pathIter) {
        element = array[pathIter];

        if (element.type == ComponentType.STRUCT_MEMBER) {
            curType = curType.getStruct().getMember(element.index).getType();
        }
        else if (element.type == ComponentType.ARRAY_ELEMENT) {
            curType = curType.getElementType();
        }
        else {
            break;
        }
    }

    if (pathIter != end) {
        var basicType = curType.getBasicType(); // DataType
        var precision = curType.getPrecision(); // Precision

        if (element.type == ComponentType.MATRIX_COLUMN) {
            basicType = deqpUtils.getDataTypeFloatVec(deqpUtils.getDataTypeMatrixNumRows(basicType));
            element = array[++pathIter];
        }

        if (pathIter != end && element.type == ComponentType.VECTOR_COMPONENT) {
            basicType = deqpUtils.getDataTypeScalarTypeAsDataType(basicType);
            element = array[++pathIter];
        }

        if (pathIter != end) {
            throw new Error();
        }

        return gluVarType.newTypeBasic(basicType, precision);
    }
    else {
        /* TODO: Original code created an object copy. We are returning reference to the same object */
        return curType;
    }
}

export function parseVariableName(nameWithPath:string):string {
    var tokenizer = new VarTokenizer(nameWithPath);
    if (tokenizer.getToken() != Token.IDENTIFIER) {
        throw new Error('Not an identifier.');
    }
    return tokenizer.getIdentifier();
}

// returns an array (TypeComponentVector& path)
// params: const char*, const VarType&
export function parseTypePath(nameWithPath:string, type) {

    var tokenizer = new VarTokenizer(nameWithPath);

    if (tokenizer.getToken() == Token.IDENTIFIER) {
        tokenizer.advance();
    }

    var path = [];

    while (tokenizer.getToken() != Token.END) {

        var curType = getVarType(type, path);

        if (tokenizer.getToken() == Token.PERIOD) {

            tokenizer.advance();
            if (tokenizer.getToken() != Token.IDENTIFIER) {
                throw new Error();
            }
            if (!curType.isStructType()) {
                throw new Error('Invalid field selector');
            }

            // Find member.
            var memberName = tokenizer.getIdentifier();
            var ndx = 0;
            for (; ndx < curType.getStruct().getSize(); ++ndx) {

                if (memberName == curType.getStruct().getMember(ndx).getName()) {
                    break;
                }

            }
            if (ndx >= curType.getStruct().getSize()) {
                throw new Error('Member not found in type: ' + memberName);
            }

            path.push(new VarTypeComponent(ComponentType.STRUCT_MEMBER, ndx));
            tokenizer.advance();
        }
        else if (tokenizer.getToken() == Token.LEFT_BRACKET) {

            tokenizer.advance();
            if (tokenizer.getToken() != Token.NUMBER) {
                throw new Error();
            }

            var ndx = tokenizer.getNumber();

            if (curType.isArrayType()) {
                if (!inBounds(ndx, 0, curType.getArraySize())) throw new Error;
                path.push(new VarTypeComponent(ComponentType.ARRAY_ELEMENT, ndx));

            }
            else if (curType.isBasicType() && deqpUtils.isDataTypeMatrix(curType.getBasicType())) {
                if (!inBounds(ndx, 0, deqpUtils.getDataTypeMatrixNumColumns(curType.getBasicType())))
                    throw new Error;
                path.push(new VarTypeComponent(ComponentType.MATRIX_COLUMN, ndx));
            }
            else if (curType.isBasicType() && deqpUtils.isDataTypeVector(curType.getBasicType())) {
                if (!inBounds(ndx, 0, deqpUtils.getDataTypeScalarSize(curType.getBasicType())))
                    throw new Error;
                path.push(new VarTypeComponent(ComponentType.VECTOR_COMPONENT, ndx));
            }
            else {
                //TCU_FAIL
                throw new Error('Invalid subscript');
            }

            tokenizer.advance();
            if (tokenizer.getToken() != Token.RIGHT_BRACKET) {
                throw new Error('Expected token RIGHT_BRACKET');
            }
            tokenizer.advance();
        }
        else {
            // TCU_FAIL
            throw new Error('Unexpected token');
        }
    }

    return path;
}
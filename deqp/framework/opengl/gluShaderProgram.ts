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

/**
 * Shader type enum
 * @enum {number}
 */
export enum shaderType {
    VERTEX,
    FRAGMENT
}

/**
 * Get GL shader type from shaderType
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {shaderType} type Shader Type
 * @return {number} GL shader type
 */
function getGLShaderType(gl:WebGLRenderingContext, type:shaderType):number {
    var _glShaderType;
    switch (type) {
        case shaderType.VERTEX:
            _glShaderType = gl.VERTEX_SHADER;
            break;
        case shaderType.FRAGMENT:
            _glShaderType = gl.FRAGMENT_SHADER;
            break;
        default:
            testFailedOptions('Unknown shader type ' + type, true);
    }

    return _glShaderType;
}
/**
 * Declares shader information
 */
class ShaderInfo {
    /** Shader type. */
    type:shaderType;
    /** Shader source. */
    source:string;
    /** Compile info log. */
    infoLog:string;
    /** Did compilation succeed? */
    compileOk:boolean;
    /** Compile time in microseconds (us). */
    compileTimeUs:number;

    constructor(type:shaderType, source:string) {
        this.type = type;
        this.source = source;
        this.infoLog = null;
        this.compileOk = false;
        this.compileTimeUs = 0;
    }
}

/**
 * Generates vertex shader info from source
 * @param {string} source
 * @return {ShaderInfo} vertex shader info
 */
export function genVertexSource(source:string):ShaderInfo {
    var shader = new ShaderInfo(shaderType.VERTEX, source);
    return shader;
}

/**
 * Generates fragment shader info from source
 * @param {string} source
 * @return {ShaderInfo} fragment shader info
 */
export function genFragmentSource(source:string):ShaderInfo {
    var shader = new ShaderInfo(shaderType.FRAGMENT, source);
    return shader;
}

/**
 * Generates shader from WebGL context and type
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {shaderType} type Shader Type
 */
class Shader {

    gl:WebGL2RenderingContext;
    info:ShaderInfo;
    shader:WebGLShader;

    constructor(gl:WebGL2RenderingContext, type:shaderType) {
        this.gl = gl;
        this.info = new ShaderInfo(type, null);
        /** Client-side clone of state for debug / perf reasons. */
        this.shader = gl.createShader(getGLShaderType(gl, type));
        assertMsgOptions(gl.getError() == gl.NO_ERROR, 'glCreateShader()', false, true);
    }

    setSources(source:string):void {
        this.gl.shaderSource(this.shader, source);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glshaderSource()', false, true);
        this.info.source = source;
    }

    getCompileStatus():boolean {
        return this.info.compileOk;
    }

    compile():void {
        this.info.compileOk = false;
        this.info.compileTimeUs = 0;
        this.info.infoLog = '';

        /** @type {Date} */ var compileStart = new Date();
        this.gl.compileShader(this.shader);
        /** @type {Date} */ var compileEnd = new Date();
        this.info.compileTimeUs = 1000 * (compileEnd.getTime() - compileStart.getTime());

        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glCompileShader()', false, true);

        var compileStatus = this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glGetShaderParameter()', false, true);

        this.info.compileOk = compileStatus;
        this.info.infoLog = this.gl.getShaderInfoLog(this.shader);
    }

    getShader():WebGLShader {
        return this.shader;
    }
}

class ProgramInfo {
    infoLog:string;
    linkOk:boolean;
    linkTimeUs:number;

    constructor() {
        this.linkOk = false;
        this.linkTimeUs = 0;
    }
}

/**
 * Creates program.
 * Inner methods: attach shaders, bind attributes location, link program and transform Feedback Varyings
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {WebGLProgram} programID
 */
class Program {

    gl:WebGL2RenderingContext;
    program:WebGLProgram;
    info:ProgramInfo;

    constructor(gl:WebGL2RenderingContext, programID?:WebGLProgram) {
        this.gl = gl;
        this.program = programID;
        this.info = new ProgramInfo();

        if (programID == null) {
            this.program = gl.createProgram();
            assertMsgOptions(gl.getError() == gl.NO_ERROR, 'glCreateProgram()', false, true);
        }
    }

    attachShader(shader:WebGLShader):void {
        this.gl.attachShader(this.program, shader);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.attachShader()', false, true);
    }

    bindAttribLocation(location:number, name:string):void {
        this.gl.bindAttribLocation(this.program, location, name);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.bindAttribLocation()', false, true);
    }

    link():void {
        this.info.linkOk = false;
        this.info.linkTimeUs = 0;
        this.info.infoLog = '';

        /** @type {Date} */ var linkStart = new Date();
        this.gl.linkProgram(this.program);
        /** @type {Date} */ var linkEnd = new Date();
        this.info.linkTimeUs = 1000 * (linkEnd.getTime() - linkStart.getTime());

        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glLinkProgram()', false, true);

        var linkStatus = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.getProgramParameter()', false, true);
        this.info.linkOk = linkStatus;
        this.info.infoLog = this.gl.getProgramInfoLog(this.program);
    }

    transformFeedbackVaryings(varyings:string[], bufferMode:number):void {
        this.gl.transformFeedbackVaryings(this.program, varyings, bufferMode);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.transformFeedbackVaryings()', false, true);
    }
}

/**
 * Assigns gl WebGL context and programSources. Declares array of shaders and new program()
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {ProgramSources} programSources
 */
export class ShaderProgram {
    gl:WebGL2RenderingContext;
    programSources:ProgramSources;
    shaders:Shader[];
    program:Program;
    shadersOK:boolean;

    constructor(gl:WebGL2RenderingContext, programSources:ProgramSources) {
        this.gl = gl;
        this.programSources = programSources;
        this.shaders = [];
        this.program = new Program(gl);
        this.shadersOK = true;

        for (var i = 0; i < programSources.sources.length; i++) {
            var shader = new Shader(gl, programSources.sources[i].type);
            shader.setSources(programSources.sources[i].source);
            shader.compile();
            this.shaders.push(shader);
            this.shadersOK = this.shadersOK && shader.getCompileStatus();
        }

        if (this.shadersOK) {
            for (var i = 0; i < this.shaders.length; i++)
                this.program.attachShader(this.shaders[i].getShader());

            for (var attrib in programSources.attribLocationBindings)
                this.program.bindAttribLocation(programSources.attribLocationBindings[attrib], attrib);

            if (programSources.transformFeedbackBufferMode)
                if (programSources.transformFeedbackBufferMode === gl.NONE)
                    assertMsgOptions(programSources.transformFeedbackVaryings.length === 0, 'Transform feedback sanity check', false, true);
                else
                    this.program.transformFeedbackVaryings(programSources.transformFeedbackVaryings, programSources.transformFeedbackBufferMode);

            /* TODO: GLES 3.1: set separable flag */
            this.program.link();
        }
    }

    getProgram():WebGLProgram {
        return this.program.program;
    }

    getProgramInfo():ProgramInfo {
        return this.program.info;
    }

    isOk():boolean {
        return this.shadersOK;
    }
}

export enum containerTypes {
    ATTRIB_LOCATION_BINDING,
    TRANSFORM_FEEDBACK_MODE,
    TRANSFORM_FEEDBACK_VARYING,
    TRANSFORM_FEEDBACK_VARYINGS,
    SHADER_SOURCE,
    PROGRAM_SEPARABLE,
    PROGRAM_SOURCES,

    CONTAINER_TYPE_LAST,
    ATTACHABLE_BEGIN = ATTRIB_LOCATION_BINDING,
    ATTACHABLE_END = PROGRAM_SEPARABLE + 1
}

export class AttribLocationBinding {

    constructor(public name:string, public location:number) {
    }

    getContainerType():containerTypes {
        return containerTypes.ATTRIB_LOCATION_BINDING;
    }
}

export class TransformFeedbackMode {

    constructor(public mode) {
    }

    getContainerType():containerTypes {
        return containerTypes.TRANSFORM_FEEDBACK_MODE;
    }
}

export class TransformFeedbackVarying {

    constructor(public name:string) {
    }

    getContainerType():containerTypes {
        return containerTypes.TRANSFORM_FEEDBACK_VARYING;
    }
}

export class TransformFeedbackVaryings {

    constructor(public array:string[]) {
    }

    getContainerType():containerTypes {
        return containerTypes.TRANSFORM_FEEDBACK_VARYINGS;
    }
}

export class ProgramSeparable {
    constructor(public separable:boolean) {
    }

    getContainerType():containerTypes {
        return containerTypes.PROGRAM_SEPARABLE;
    }
}

export class VertexSource {
    shaderType:shaderType;

    constructor(public source:string) {
        this.shaderType = shaderType.VERTEX;
    }

    getContainerType():containerTypes {
        return containerTypes.SHADER_SOURCE;
    }
}

export class FragmentSource {
    shaderType:shaderType;

    constructor(public source:string) {
        this.shaderType = shaderType.FRAGMENT;
    }

    getContainerType():containerTypes {
        return containerTypes.SHADER_SOURCE;
    }
}

export class ProgramSources {

    sources:ShaderInfo[];
    attribLocationBindings = [];
    transformFeedbackVaryings:string[];
    transformFeedbackBufferMode:number;
    separable:boolean;

    constructor() {
        this.sources = [];
        this.attribLocationBindings = [];
        this.transformFeedbackVaryings = [];
        this.transformFeedbackBufferMode = 0;
        this.separable = false;
    }

    getContainerType():containerTypes {
        return containerTypes.PROGRAM_SOURCES;
    }

    add(item):ProgramSources {

        var type:number|string = 'undefined';
        if (typeof(item.getContainerType) == 'function') {
            type = item.getContainerType();
            if (typeof(type) != 'number' ||
                (type < containerTypes.ATTACHABLE_BEGIN || type >= containerTypes.ATTACHABLE_END))
            {
                type = 'undefined';
            }
        }

        switch (type) {
            case containerTypes.ATTRIB_LOCATION_BINDING:
                this.attribLocationBindings.push(item);
                break;

            case containerTypes.TRANSFORM_FEEDBACK_MODE:
                this.transformFeedbackBufferMode = item.mode;
                break;

            case containerTypes.TRANSFORM_FEEDBACK_VARYING:
                this.transformFeedbackVaryings.push(item.name);
                break;

            case containerTypes.TRANSFORM_FEEDBACK_VARYINGS:
                [].push.apply(this.transformFeedbackVaryings, item.array);
                break;

            case containerTypes.SHADER_SOURCE:
                this.sources.push(new ShaderInfo(item.shaderType, item.source));
                break;

            case containerTypes.PROGRAM_SEPARABLE:
                this.separable = item.separable;
                break;

            default:
                throw Error('Type \"' + type + '\" cannot be added to ProgramSources.');
                break;
        }

        return this;
    }
}

/**
 * //! Helper for constructing vertex-fragment source pair.
 * @param {string} vertexSrc
 * @param {string} fragmentSrc
 * @return {ProgramSources}
 */
export function makeVtxFragSources(vertexSrc:string, fragmentSrc:string):ProgramSources {
    /** @type� {ProgramSources} */ var sources = new ProgramSources();
    sources.sources.push(genVertexSource(vertexSrc));
    sources.sources.push(genFragmentSource(fragmentSrc));
    return sources;
}

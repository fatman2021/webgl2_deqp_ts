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

import tcuTexture = require('framework/common/tcuTexture');
import deMath = require('framework/delibs/debase/deMath');

function DE_ASSERT(x: boolean): void {
    if (!x)
        throw new Error('Assert failed');
}

/*--------------------------------------------------------------------*//*!
 * \brief RGBA8888 surface
 *
 * Surface provides basic pixel storage functionality. Only single format
 * (RGBA8888) is supported.
 *
 * PixelBufferAccess (see tcuTexture.h) provides much more flexible API
 * for handling various pixel formats. This is mainly a convenience class.
 *//*--------------------------------------------------------------------*/
export class Surface {

    private m_width:number;
    private m_height:number;
    private m_data:ArrayBuffer;
    private m_pixels:Uint8Array;

    constructor(width:number, height:number) {
        this.setSize(width, height);
    }

    setSize(width:number, height:number): void {
        this.m_width = width;
        this.m_height = height;
        if (width * height > 0) {
            this.m_data = new ArrayBuffer(4 * width * height);
            this.m_pixels = new Uint8Array(this.m_data);
        }
    }

    getWidth():number {
        return this.m_width;
    }

    getHeight():number {
        return this.m_height;
    }

    /**
     * @param {Array<Number>} color Vec4 color
     */
    setPixel(x:number, y:number, color:ArrayLike<number>):void {
        DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
        DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));

        var offset = 4 * (x + y * this.m_width);
        for (var i = 0; i < 4; i++)
            this.m_pixels[offset + i] = color[i];
    }

    getPixel(x:number, y:number):number[] {
        DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
        DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));

        var color = [];
        color.length = 4;

        var offset = 4 * (x + y * this.m_width);
        for (var i = 0; i < 4; i++)
            color[i] = this.m_pixels[offset + i];

        return color;
    }

    /**
     * @return {PixelBufferAccess} Pixel Buffer Access object
     */
    getAccess():tcuTexture.PixelBufferAccess {
        return new tcuTexture.PixelBufferAccess({
            format: new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8),
            width: this.m_width,
            height: this.m_height,
            data: this.m_data
        });
    }

    getSubAccess(x, y, width, height) {
        /* TODO: Implement. the deqp getSubAccess() looks broken. It will probably fail if
         * x != 0 or width != m_width
         */
        throw new Error('Unimplemented');
    }
}
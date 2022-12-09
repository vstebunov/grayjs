import Concentration from './concentration';
import lerpColor from './lerpColor';

const blue = [70, 66, 55];//color(#464237);
const yellow = [248, 236, 194];//color(#f8ecc2);

const Da = 1.0;
const f = 0.055;
const k = 0.062;
const dt = 1.0;
const Db = 0.2;

const kernel = [
  [ 0.05, 0.2, 0.05 ],
  [ 0.2,  -1, 0.2 ],
  [ 0.05, 0.2, 0.05 ]
];

class App {
    ctx:CanvasRenderingContext2D;
    ctx3d: WebGLRenderingContext;
    img:HTMLImageElement;
    c: Concentration[][] = [];

    setup() {
        const canvas = document.getElementById('grayjs') as HTMLCanvasElement;
        if (!canvas.getContext) {
            return;
        }
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => this.imgOnLoad();
        img.src = 'img/diffusion.jpg';

        this.ctx = ctx;
        this.img = img;
    }

    setupGL() {
        const canvas = document.getElementById('graygl') as HTMLCanvasElement;
        if (!canvas.getContext) {
            return;
        }
        const gl = canvas.getContext('webgl');
        /*
        const img = new Image();
        img.onload = () => this.imgOnLoad();
        img.src = 'img/diffusion.jpg';
        */

        const fSource = `
            precision mediump float;

            uniform sampler2D u_Sampler;
            varying vec2 v_TexCoord;

            void main()
            {
                gl_FragColor = texture2D(u_Sampler, v_TexCoord);
            }
        `;
        const fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader, fSource);
        gl.compileShader(fShader);

        const vSource = `
        attribute vec4 a_Position;
        attribute vec2 a_TexCoord;
        varying vec2 v_TexCoord;

        void main()
        {
            gl_Position = a_Position;
            v_TexCoord = a_TexCoord;
        }
        `;
        const vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader, vSource);
        gl.compileShader(vShader);

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vShader);
        gl.attachShader(shaderProgram, fShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram); 

        const vertices = new Float32Array([
            -1, 1, 0.0, 1.0,
            -1, -1, 0.0, 0.0,
            1, 1, 1.0, 1.0,
            1, -1, 1.0, 0.0,
        ]);
        var FSIZE = vertices.BYTES_PER_ELEMENT;
    
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const a_Position = gl.getAttribLocation(shaderProgram, 'a_Position');
        if (a_Position < 0)
        {
            console.log('Failed to get the storage location of a_Position');
            return -1;
        }
        // Assign the buffer object to a_Position variable
        // gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);

        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        // Get the storage location of a_TexCoord
        var a_TexCoord = gl.getAttribLocation(shaderProgram, 'a_TexCoord');
    
        if (a_TexCoord < 0)
        {
            console.log('Failed to get the storage location of a_TexCoord');
            return -1;
        }
        // Assign the buffer object to a_TexCoord variable
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
        gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

        this.initTexture(gl, shaderProgram);

        //gl.clearColor(0.0, 0.0, 0.0, 1.0);
        //gl.clear(gl.COLOR_BUFFER_BIT);
        //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        this.ctx3d = gl;
    }

    initTexture (gl, shaderProgram) {
        let texture = gl.createTexture();
        if (!texture) {
            console.log('Failed to create texture object');
            return false;
        }

        let u_Sampler = gl.getUniformLocation(shaderProgram, 'u_Sampler');
        if (!u_Sampler) {
            console.log('Failed to get the storage location of u_Sampler');
            return false;
        }
        
        let image = new Image();
        if (!image) {
            console.log('Failed to create image object');
            return false;
        }

        image.onload = () => {
            this.loadTexture(gl, 4, texture, u_Sampler, image);
        };
        image.src = 'img/diffusion.jpg';

        return true;
    }

    loadTexture(gl, n, texture, u_Sampler, image) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        // these two lines needed in WebGL1 but not WebGL2 if the image is not
        // power of 2 in both dimension
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

        gl.uniform1i(u_Sampler, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }

    imgOnLoad() {
        const {ctx, img} = this;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
        let c: Concentration[][] = [];
        const quadWidth = img.width * 4;

        for (let i=0, n=imageData.length; i<n; i+=4) {
            const green = imageData[i + 2];
            const color = green / 255;
            const x = Math.floor(i / (quadWidth));
            const y = i % (quadWidth) / 4;
            if (!c[x]) {
                c[x] = [];
            };
            c[x][y] = {
                A: 1 - color,
                B: color 
            };
        }

        this.c = c;

        this.draw();
    }

    draw() {
        if (!this) {
            return;
        }

        const {ctx, img} = this;
        if (!ctx) {
            return;
        }
        const time = new Date()
        const image = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = image.data;
        const quadWidth = image.width * 4;

        for (let i=0, n = pixels.length; i < n; i+=4) {
            const x = Math.floor(i / (quadWidth));
            const y = i % (quadWidth) / 4;
            const a = this.c[x][y].A;
            const b = this.c[x][y].B;

            this.c[x][y].A = a + (Da * this.conv(x,y, true) - a * b * b + f * (1 - a)) * dt;
            this.c[x][y].B = b + (Db * this.conv(x,y, false) + a * b * b - (k + f) * b) * dt;

            const newColor = lerpColor(yellow, blue, this.c[x][y].A);
            pixels[i] = newColor[0];
            pixels[i+1] = newColor[1];
            pixels[i+2] = newColor[2];

        }

        ctx.putImageData(image, 0, 0);

        // window.requestAnimationFrame(() => this.draw());
        // console.log(window.requestAnimationFrame);
    }

    conv (i: number, j: number, isA: boolean): number {
        let res = 0.0;
        const img = this.img;

        for (let x = 0; x < 3; x+=1) {
            for (let y = 0; y < 3; y +=1) {
                let xx = 0;
                if (i + x - 1 == -1) {
                    xx = 0;
                } else if (i + x - 1 == img.width)  {
                    xx = img.width - 1;
                } else {
                    xx = i + x - 1;
                }

                let yy = 0;
                if (j + y - 1 == -1) {
                    yy = 0;
                } else if (j + y - 1 == img.height)  {
                    yy = img.height - 1;
                } else {
                    yy = j + y - 1;
                }

                res += kernel[x][y] * 
                    (isA ? this.c[xx][yy].A : this.c[xx][yy].B);
            }
        }  
        return 0;
    }
}

export default App;

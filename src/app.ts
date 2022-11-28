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
        console.log(new Date(), time);

        window.requestAnimationFrame(() => this.draw());
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

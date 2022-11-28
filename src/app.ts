import Concentration from './concentration';
import lerpColor from './lerpColor';

const blue = [70, 66, 55];//color(#464237);
const yellow = [248, 236, 194];//color(#f8ecc2);

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
                A: color,
                B: 1 - color 
            }
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
        const image = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = image.data;
        const quadWidth = image.width * 4;

        for (let i=0, n = pixels.length; i < n; i+=4) {
            const x = Math.floor(i / (quadWidth));
            const y = i % (quadWidth) / 4;
            const newColor = lerpColor(yellow, blue, this.c[x][y].A);
            pixels[i] = newColor[0];
            pixels[i+1] = newColor[1];
            pixels[i+2] = newColor[2];

        }

        ctx.putImageData(image, 0, 0);

        //window.requestAnimationFrame(() => this.draw());
    }
}

export default App;

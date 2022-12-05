import App from './app';

const app = new App();

document.addEventListener('DOMContentLoaded', () => { 
    app.setup();
    app.setupGL();
});


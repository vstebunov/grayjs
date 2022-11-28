function lerpColor(color1: number[], color2: number[], amount: number) {
    const r1 = color1[0];
    const r2 = color2[0];
    const red = r1 + amount * (r2 - r1);
    const g1 = color1[1];
    const g2 = color2[1];
    const green = g1 + amount * (g2 - g1);
    const b1 = color1[2];
    const b2 = color2[2];
    const blue = b1 + amount * (b2 - b1);
    return [red, green, blue];
}

export default lerpColor;

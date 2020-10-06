var Vector = (function () {
    function Vector() {
        this.w = 1.0;
    }
    Vector.prototype.getLength = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };
    Vector.prototype.reverse = function (dst) {
        if (dst === void 0) { dst = null; }
        if (dst == null) {
            dst = new Vector();
        }
        dst.x = -this.x;
        dst.y = -this.y;
        dst.z = -this.z;
        return dst;
    };
    Vector.prototype.add = function (t, dst) {
        if (dst === void 0) { dst = null; }
        if (dst == null) {
            dst = new Vector();
        }
        dst.x = this.x + t.x;
        dst.y = this.y + t.y;
        dst.z = this.z + t.z;
        dst.w = 1.0;
        return dst;
    };
    Vector.prototype.sub = function (t, dst) {
        if (dst === void 0) { dst = null; }
        if (dst == null) {
            dst = new Vector();
        }
        dst.x = this.x - t.x;
        dst.y = this.y - t.y;
        dst.z = this.z - t.z;
        dst.w = 1.0;
        return dst;
    };
    Vector.prototype.dot = function (t) {
        return this.x * t.x + this.y * t.y + this.z * t.z;
    };
    Vector.prototype.cross = function (t, dst) {
        if (dst === void 0) { dst = null; }
        if (dst == null) {
            dst = new Vector();
        }
        var x = this.y * t.z - this.z * t.y;
        var y = this.z * t.x - this.x * t.z;
        var z = this.x * t.y - this.y * t.x;
        dst.x = x;
        dst.y = y;
        dst.z = z;
        dst.w = 1.0;
        return dst;
    };
    Vector.prototype.normalize = function (dst) {
        if (dst === void 0) { dst = null; }
        if (dst == null) {
            dst = new Vector();
        }
        var len = this.getLength();
        if (len > 0) {
            dst.x = this.x / len;
            dst.y = this.y / len;
            dst.z = this.z / len;
        }
        return dst;
    };
    return Vector;
})();
var Matrix = (function () {
    function Matrix() {
        this.m = [];
        for (var i = 0; i < 4; i++) {
            var col = new Float32Array(4);
            for (var j = 0; j < 4; j++) {
                col[j] = j == i ? 1 : 0;
            }
            this.m.push(col);
        }
    }
    Matrix.prototype.multiply = function (t, dst) {
        if (dst === void 0) { dst = null; }
        if (dst == null) {
            dst = new Matrix();
        }
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                dst.m[j][i] =
                    this.m[j][0] * t.m[0][i]
                        + this.m[j][1] * t.m[1][i]
                        + this.m[j][2] * t.m[2][i]
                        + this.m[j][3] * t.m[3][i];
            }
        }
        return dst;
    };
    Matrix.prototype.setValue = function (val) {
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                this.m[j][i] = val;
            }
        }
    };
    Matrix.setPerspective = function (dst, fovy, aspect, near, far) {
        dst.setValue(0);
        var tan = Math.tan(fovy / 2);
        var nt = 1 / tan;
        var nr = nt / aspect;
        var n = Math.abs(near);
        var f = Math.abs(far);
        dst.m[0][0] = nr;
        dst.m[1][1] = nt;
        dst.m[2][2] = (n + f) / (n - f);
        dst.m[3][2] = 2 * f * n / (f - n);
        dst.m[2][3] = 1;
    };
    Matrix.setLookAt = function (dst, eye, up, at) {
        var w = at.sub(eye).normalize().reverse();
        var u = up.cross(w).normalize();
        var v = w.cross(u);
        dst.setValue(0);
        dst.m[0][0] = u.x;
        dst.m[1][0] = u.y;
        dst.m[2][0] = u.z;
        dst.m[0][1] = v.x;
        dst.m[1][1] = v.y;
        dst.m[2][1] = v.z;
        dst.m[0][2] = w.x;
        dst.m[1][2] = w.y;
        dst.m[2][2] = w.z;
        dst.m[3][3] = 1;
        var tEye = eye.reverse();
        dst.m[3][0] = u.dot(tEye);
        dst.m[3][1] = v.dot(tEye);
        dst.m[3][2] = w.dot(tEye);
    };
    return Matrix;
})();
var MathUtils = (function () {
    function MathUtils() {
    }
    MathUtils.linearInterpolateValue = function (value1, value2, t) {
        return (1 - t) * value1 + t * value2;
    };
    MathUtils.linearInterpolateVector = function (vec1, vec2, t, dst) {
        if (dst === void 0) { dst = null; }
        if (dst == null) {
            dst = new Vector();
        }
        dst.x = MathUtils.linearInterpolateValue(vec1.x, vec2.x, t);
        dst.y = MathUtils.linearInterpolateValue(vec1.y, vec2.y, t);
        dst.z = MathUtils.linearInterpolateValue(vec1.z, vec2.z, t);
        return dst;
    };
    return MathUtils;
})();
var Color = (function () {
    function Color(r, g, b, a) {
        this.a = a;
        this.r = r;
        this.g = g;
        this.b = b;
    }
    Color.getInterpColor = function (color1, color2, color3, a, b, c, dstColor) {
        dstColor.r = color1.r * a + color2.r * b + color3.r * c;
        dstColor.g = color1.g * a + color2.g * b + color3.g * c;
        dstColor.b = color1.b * a + color2.b * b + color3.b * c;
        dstColor.a = color1.a * a + color2.a * b + color3.a * c;
    };
    Color.BLACK = new Color(0, 0, 0, 255);
    Color.WHITE = new Color(255, 255, 255, 255);
    Color.RED = new Color(255, 0, 0, 255);
    Color.BLUE = new Color(0, 0, 255, 255);
    Color.GREEN = new Color(0, 255, 0, 255);
    return Color;
})();
var Renderer = (function () {
    function Renderer(width, height, blitCallback) {
        this.bitBlit = null;
        this.frameBuffer = null;
        this.zBuffer = null;
        this.backgroundColor = Color.BLACK;
        this.width = width;
        this.height = height;
        this.bitBlit = blitCallback;
        this.frameBuffer = new Uint8Array(width * height * 4);
        this.zBuffer = new Float32Array(width * height);
    }
    Renderer.prototype.clear = function () {
        for (var l = 0; l < this.frameBuffer.length; l += 4) {
            this.frameBuffer[l] = this.backgroundColor.r;
            this.frameBuffer[l + 1] = this.backgroundColor.g;
            this.frameBuffer[l + 2] = this.backgroundColor.b;
            this.frameBuffer[l + 3] = this.backgroundColor.a;
        }
        for (var l = 0; l < this.zBuffer.length; l++) {
            this.zBuffer[l] = NaN;
        }
    };
    Renderer.prototype.drawLine = function (x0, y0, x1, y1, color) {
        if (x0 == x1) {
            var dir = y0 < y1 ? 1 : -1;
            for (var y = y0; y != y1; y += dir) {
                this.setPixel(x0, y, color);
            }
            this.setPixel(x1, y1, color);
        }
        else if (y0 == y1) {
            var dir = x0 < x1 ? 1 : -1;
            for (var x = x0; x != x1; x += dir) {
                this.setPixel(x, y0, color);
            }
            this.setPixel(x1, y1, color);
        }
        else {
            var dx = Math.abs(x1 - x0);
            var dy = Math.abs(y1 - y0);
            if (dx > dy) {
                if (x0 > x1) {
                    var tx = x0, ty = y0;
                    x0 = x1, y0 = y1;
                    x1 = tx, y1 = ty;
                }
                var dir = y1 > y0 ? 1 : -1;
                var y = y0;
                var d = (y0 - y1) * (x0 + 1) + (x1 - x0) * (y0 + 0.5 * dir) + x0 * y1 - x1 * y0;
                for (var x = x0; x <= x1; x++) {
                    this.setPixel(x, y, color);
                    if (d * dir < 0) {
                        y += dir;
                        d += (x1 - x0) * dir + (y0 - y1);
                    }
                    else {
                        d += y0 - y1;
                    }
                }
            }
            else {
                if (y0 > y1) {
                    var tx = x0, ty = y0;
                    x0 = x1, y0 = y1;
                    x1 = tx, y1 = ty;
                }
                var dir = x1 > x0 ? 1 : -1;
                var x = x0;
                var d = (y0 - y1) * (x0 + 0.5 * dir) + (x1 - x0) * (y0 + 1) + x0 * y1 - x1 * y0;
                for (var y = y0; y <= y1; y++) {
                    this.setPixel(x, y, color);
                    if (d * dir > 0) {
                        x += dir;
                        d += (x1 - x0) + (y0 - y1) * dir;
                    }
                    else {
                        d += x1 - x0;
                    }
                }
            }
        }
    };
    Renderer.prototype.barycentricFunc = function (vs, a, b, x, y) {
        return ((vs[a].y - vs[b].y) * x + (vs[b].x - vs[a].x) * y + vs[a].x * vs[b].y - vs[b].x * vs[a].y);
    };
    Renderer.prototype.drawTriangle = function (v0, v1, v2) {
        var x0 = v0.x, x1 = v1.x, x2 = v2.x, y0 = v0.x, y1 = v1.y, y2 = v2.y;
        var minX = Math.floor(Math.min(x0, x1, x2));
        var maxX = Math.ceil(Math.max(x0, x1, x2));
        var minY = Math.floor(Math.min(y0, y1, y2));
        var maxY = Math.ceil(Math.max(y0, y1, y2));
        var c = new Color(255, 255, 255, 255);
        var vs = [v0, v1, v2];
        var fBelta = this.barycentricFunc(vs, 2, 0, x1, y1);
        var fGama = this.barycentricFunc(vs, 0, 1, x2, y2);
        var fAlpha = this.barycentricFunc(vs, 1, 2, x0, y0);
        var offScreenPointX = -1, offScreenPointY = -1;
        for (var x = minX; x <= maxX; x++) {
            for (var y = minY; y <= maxY; y++) {
                var belta = this.barycentricFunc(vs, 2, 0, x, y) / fBelta;
                var gama = this.barycentricFunc(vs, 0, 1, x, y) / fGama;
                var alpha = 1 - belta - gama;
                if (alpha >= 0 && belta >= 0 && gama >= 0) {
                    if ((alpha > 0 || fAlpha * this.barycentricFunc(vs, 1, 2, offScreenPointX, offScreenPointY) > 0)
                        && (belta > 0 || fBelta * this.barycentricFunc(vs, 2, 0, offScreenPointX, offScreenPointY) > 0)
                        && (gama > 0 || fGama * this.barycentricFunc(vs, 0, 1, offScreenPointX, offScreenPointY) > 0)) {
                        Color.getInterpColor(v0.color, v1.color, v2.color, alpha, belta, gama, c);
                        this.setPixel(x, y, c);
                    }
                }
            }
        }
    };
    Renderer.prototype.setPixel = function (x, y, color) {
        if (x < this.width && y < this.height && x >= 0 && y >= 0) {
            var pstart = (this.width * y + x) * 4;
            this.frameBuffer[pstart] = color.r;
            this.frameBuffer[pstart + 1] = color.g;
            this.frameBuffer[pstart + 2] = color.b;
            this.frameBuffer[pstart + 3] = color.a;
        }
    };
    Renderer.prototype.drawElements = function (va, elements) {
        //根据当前的view和project, 对所有三角形进行投影计算， clip, 
        //对三角形进行光栅化， 然后进行着色，zbuffer覆盖, blend上framebuffer
    };
    Renderer.prototype.flush = function () {
        this.bitBlit(this.width, this.height, this.frameBuffer);
    };
    return Renderer;
})();
var App = (function () {
    function App(canvasWidth, canvasHeight, blitCallback) {
        this.bitBlit = null;
        this.renderder = new Renderer(canvasWidth, canvasHeight, blitCallback);
        var self = this;
        var wrapMainLoop = function () {
            self.mainLoop();
            requestAnimationFrame(wrapMainLoop);
        };
        wrapMainLoop();
    }
    App.prototype.mainLoop = function () {
        this.renderder.clear();
        this.renderder.drawTriangle({ x: 100, y: 200, color: Color.RED }, { x: 200, y: 250, color: Color.BLUE }, { x: 150, y: 350, color: Color.GREEN });
        this.renderder.drawTriangle({ x: 100, y: 200, color: Color.GREEN }, { x: 500, y: 100, color: Color.BLUE }, { x: 200, y: 250, color: Color.RED });
        var va = [
            { x: -1, y: -1, z: 1, color: Color.GREEN },
            { x: 1, y: -1, z: 1, color: Color.GREEN },
            { x: 1, y: 1, z: 1, color: Color.GREEN },
            { x: -1, y: 1, z: 1, color: Color.GREEN },
            { x: -1, y: -1, z: -1, color: Color.GREEN },
            { x: 1, y: -1, z: -1, color: Color.GREEN },
            { x: 1, y: 1, z: -1, color: Color.GREEN },
            { x: -1, y: 1, z: -1, color: Color.GREEN },
        ];
        var elements = [
            0, 1, 2,
            2, 3, 1,
            7, 6, 5,
            5, 4, 7,
            0, 4, 5,
            5, 1, 0,
            1, 5, 6,
            6, 2, 1,
            2, 6, 7,
            7, 3, 2,
            3, 7, 4,
            4, 0, 3
        ];
        this.renderder.drawElements(va, elements);
        this.renderder.flush();
    };
    return App;
})();
exports["default"] = App;
//# sourceMappingURL=raster.js.map
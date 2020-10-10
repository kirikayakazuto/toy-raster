import { Vector, Color, UV, ColorEnums, Texture, Camera, Matrix, Vertex } from "./data"

class MathUtils {

    // public static linearInterpolateValue(value1:number, value2:number, t:number) {
    //     return (1-t) * value1 + t * value2
    // }

    public static isInsideViewVolumn(v:Vector){
        if (v.x < -1 || v.x > 1){
            return false
        }
        if (v.y < -1 || v.y > 1){
            return false
        }
        if (v.z < -1 || v.z > 1){
            return false
        }
        return true
    }

    public static convertToScreenPos(v:Vector, dst:Vector, width:number, height:number){
        dst.x = (v.x + 1)/2 * width
        dst.y = (v.y + 1)/2 * height
        dst.z = v.z
        return dst
    }

    public static getInterpColor(color1:Color, color2:Color, color3:Color, a:number, b:number, c:number, dstColor:Color) {
        dstColor.r = MathUtils.getInterpValue(color1.r, color2.r, color3.r, a, b, c)
        dstColor.g = MathUtils.getInterpValue(color1.g, color2.g, color3.g, a, b, c)
        dstColor.b = MathUtils.getInterpValue(color1.b, color2.b, color3.b, a, b, c)
        dstColor.a = MathUtils.getInterpValue(color1.a, color2.a, color3.a, a, b, c)
    }
    public static getInterpUV(uv1:UV, uv2:UV, uv3:UV, a:number, b:number, c:number, dstUV:UV) {
        dstUV.u = MathUtils.getInterpValue(uv1.u, uv2.u, uv3.u, a, b, c)
        dstUV.v = MathUtils.getInterpValue(uv1.v, uv2.v, uv3.v, a, b, c)
    }
    
    public static getInterpValue(v1:number, v2:number, v3:number,  a:number, b:number, c:number) {
        return v1*a + v2*b + v3*c
    }

    public static multiplyColor(color1:Color, color2:Color, dst:Color){
        dst.r = color1.r * color2.r / 255
        dst.g = color1.g * color2.g / 255
        dst.b = color1.b * color2.b / 255
        dst.a = color1.a * color2.a / 255
        return dst
    }
}



export default class Raster {
    public width:number 
    public height:number
    public frameBuffer:Uint8Array = null
    protected zBuffer:Float32Array = null
    protected backgroundColor:Color = ColorEnums.clone(ColorEnums.BLACK)
    protected activeTexture:Texture = null

    protected camera:Camera = {
        view: new Matrix(),
        projection: new Matrix(),
        vp: new Matrix()
    }

    constructor(width:number, height:number) {
        this.width = width
        this.height = height

        this.frameBuffer = new Uint8Array(width*height*4)
        this.zBuffer = new Float32Array(width*height)

        this.setDefaultCamera()
    }

    public clear() {
        for (let l=0;l<this.frameBuffer.length;l+=4){
            this.frameBuffer[l] = this.backgroundColor.r
            this.frameBuffer[l+1] = this.backgroundColor.g
            this.frameBuffer[l+2] = this.backgroundColor.b
            this.frameBuffer[l+3] = this.backgroundColor.a
        }
        for (let l=0;l<this.zBuffer.length;l++){
            this.zBuffer[l] = NaN
        }
    }


    public drawLine(x0:number, y0:number, x1:number, y1:number, color:Color){
        if (x0 == x1) {
            let dir = y0 < y1 ? 1 : -1
            for (let y=y0; y!=y1; y+=dir) {
                this.setPixel(x0, y, color)
            }
            this.setPixel(x1, y1, color)
        } else if (y0 == y1) {
            let dir = x0 < x1 ? 1 : -1
            for (let x=x0; x!=x1; x+=dir) {
                this.setPixel(x, y0, color)
            }
            this.setPixel(x1, y1, color)
        } else {
            //use mid-point algorithm to draw line, <CG> 4th, Setion 8.1
            let dx = Math.abs(x1 - x0)
            let dy = Math.abs(y1 - y0)
            if (dx > dy) {
                //more horizontal line
                if (x0 > x1) {
                    let tx = x0, ty = y0
                    x0 = x1, y0 = y1
                    x1 = tx, y1 = ty
                }
                let dir = y1 > y0 ? 1: -1
                let y = y0
                let d = (y0-y1)*(x0+1) + (x1-x0)*(y0+0.5*dir) + x0*y1 - x1*y0
                for (let x=x0;x<=x1;x++) {
                    this.setPixel(x, y, color)
                    if (d*dir < 0){
                        y += dir
                        d += (x1-x0)*dir + (y0-y1)
                    } else {
                        d += y0 - y1
                    }
                }
            } else {
                //more vertical line
                if (y0 > y1) {
                    let tx = x0, ty = y0
                    x0 = x1, y0 = y1
                    x1 = tx, y1 = ty
                }
                let dir = x1 > x0 ? 1: -1
                let x = x0
                let d = (y0-y1)*(x0+0.5*dir) + (x1-x0)*(y0+1) + x0*y1 - x1*y0
                for (let y=y0;y<=y1;y++) {
                    this.setPixel(x, y, color)
                    if (d*dir > 0){
                        x += dir
                        d += (x1-x0)+ (y0-y1)*dir 
                    } else {
                        d += x1 - x0
                    }
                }
            }
        }
    }

    protected barycentricFunc(vs:Array<Vector>, a:number, b:number, x:number, y:number):number{
        return ((vs[a].y - vs[b].y)*x + (vs[b].x - vs[a].x)*y + vs[a].x*vs[b].y - vs[b].x*vs[a].y)
    }
// protected printed:boolean = false
    public drawTriangle2D(v0:Vertex, v1:Vertex, v2:Vertex) {
        //使用重心坐标的算法(barycentric coordinates)对三角形进行光栅化
        //使用AABB来优化性能
        //对于三角形边(edge case)上的点, 使用的是<CG 4th>上的算法， 使用一个Off-screen point(-1, -1) 来判断是否在同一边
        let vs = [v0.posScreen, v1.posScreen, v2.posScreen]
        let x0 = vs[0].x, x1 = vs[1].x, x2 = vs[2].x, y0 = vs[0].y, y1=vs[1].y, y2=vs[2].y
        let minX = Math.floor( Math.min(x0, x1, x2) )
        let maxX = Math.ceil( Math.max(x0, x1, x2) )
        let minY = Math.floor( Math.min(y0, y1, y2) )
        let maxY = Math.ceil( Math.max(y0, y1, y2) )
        let fBelta = this.barycentricFunc(vs, 2, 0, x1, y1)
        let fGama = this.barycentricFunc(vs, 0, 1, x2, y2)
        let fAlpha =  this.barycentricFunc(vs, 1, 2, x0, y0)
        let offScreenPointX = -1, offScreenPointY = -1
        
        let tempColor:Color = ColorEnums.clone(ColorEnums.WHITE)
        let uv:UV = {u:0, v:0}

        for (let x=minX;x<=maxX;x++) {
            for (let y=minY;y<=maxY;y++) {
                //F(a,b, x,y) = (ya-yb)*x + (xb-xa)*y + xa*yb - xb*ya, 
                //a,b is [0,1,2], belta= F(2,0,x,y) / F(2, 0, x1,y1)
                let belta = this.barycentricFunc(vs, 2, 0, x, y) / fBelta
                let gama = this.barycentricFunc(vs, 0, 1, x, y) / fGama
                let alpha = 1 - belta - gama
                if (alpha>=0 && belta >=0 && gama >=0) {
                    if (  (alpha > 0 || fAlpha*this.barycentricFunc(vs, 1, 2, offScreenPointX, offScreenPointY) >0) 
                    &&  (belta > 0 || fBelta*this.barycentricFunc(vs, 2, 0, offScreenPointX, offScreenPointY) >0) 
                    &&  (gama > 0 || fGama*this.barycentricFunc(vs, 0, 1, offScreenPointX, offScreenPointY) >0) 
                      ){
                        //在三角形内，边上的点也属于三角形
                        //注意不能直接使用屏幕空间三角形的3个顶点属性直接插值，
                        //在3D空间中顶点属性可以通过重心坐标线性插值，但是屏幕空间中已经不是线性插值，需要做透视矫正
                        let rhw = MathUtils.getInterpValue(v0.rhw, v1.rhw, v2.rhw, alpha, belta, gama) //1/z
                        //这里使用rhw=1/w作为深度缓冲的值，非线性的zbuffer在近处有更高的精度
                        let zPos = this.width * y + x
                        if (isNaN(this.zBuffer[zPos]) || this.zBuffer[zPos] > rhw) {
                            let w = 1 / (rhw != 0 ? rhw : 1)
                            //反推3D空间中的重心坐标  a, b, c
                            let a = alpha*w*v0.rhw
                            let b = belta*w*v1.rhw
                            let c = gama*w*v2.rhw
                            
                            MathUtils.getInterpColor(v0.color, v1.color, v2.color, a, b, c, tempColor)
                            MathUtils.getInterpUV(v0.uv, v1.uv, v2.uv, a, b, c, uv)
                            // if (!this.printed){
                            //     console.log("uv=",  uv.u,uv.v)
                            // }
                            // console.log("inter uv", v0.uv, v1.uv, v2.uv, a, b, c, uv)
                            let finalColor = this.fragmentShading(x, y, tempColor, uv)
                            if (finalColor.a > 0) {
                                this.setPixel(x, y, finalColor)
                                this.zBuffer[zPos] = rhw
                            }
                        }
                    }
                }
            }
        }
        // this.printed = true

    }

    //片元着色
    protected fragmentShading(x:number, y:number, color:Color, uv:UV) {
        if (this.activeTexture != null) {
            let tex = this.activeTexture.sample(uv)
            return MathUtils.multiplyColor(tex, color, tex)
        } 
        return color
    }

    public setActiveTexture(texture:Texture) {
        this.activeTexture = texture
    }

    public setPixel(x:number, y:number, color:Color) {
        if (x < this.width && y < this.height && x>=0 && y>=0) {
            let pstart = (this.width*y + x)*4
            this.frameBuffer[pstart] = color.r
            this.frameBuffer[pstart+1] = color.g
            this.frameBuffer[pstart+2] = color.b
            this.frameBuffer[pstart+3] = color.a
        }
    }

    //va is array of vertex, elements is triangles using vertex index in va
    public drawElements(va:Array<Vertex>, elements:Array<number>) {
        //根据当前的view和project, 对所有三角形进行投影计算
        //对每一个三角形进行光栅化， 然后进行着色，zbuffer和framebuffer赋值
        //没做backface culling, 只做了view volumn culling
        //三角形细分的clip没做
        if (elements.length % 3 != 0){
            return
        }
        let cameraTransform = this.camera.vp
        for (let vert of va) {
            if (vert.posProject == null) {
                vert.posProject = new Vector()
            }
            vert.posWorld.transform(cameraTransform, vert.posProject)
            vert.rhw = 1/vert.posProject.w //w等同于投影前的视图坐标的z
            vert.posProject.homogenenize()
            if (MathUtils.isInsideViewVolumn(vert.posProject)){
                if (vert.posScreen == null){
                    vert.posScreen = new Vector()
                }
                MathUtils.convertToScreenPos(vert.posProject, vert.posScreen, this.width, this.height)
            }
        }
        for (let i=0;i<elements.length;i+=3) {
            let trianglePoints = [va[elements[i]], va[elements[i+1]], va[elements[i+2]]]
            let culling = false
            for (let p of trianglePoints) {
                //view volumn culling
                if (!MathUtils.isInsideViewVolumn(p.posProject) ) {
                    culling = true
                    break;
                }
            }
            if (!culling) {
                this.drawTriangle2D(trianglePoints[0], trianglePoints[1], trianglePoints[2])
            }
        }
    }

    protected setDefaultCamera() {
        let eye = new Vector(1.5, 0, 3, 1)
        let at = new Vector(0, 0, 0, 1)
        let up = new Vector(0, 1, 0, 1)
        let fovy = Math.PI / 2
        let aspect = this.width / this.height
        let near = 1
        let far = 500
        this.setCamera(eye, at, up, fovy, aspect, near, far)
    }

    public setCamera(eye:Vector, lookAt:Vector, up:Vector, fovy:number, aspect:number, near:number, far:number) {
        this.camera.view.setLookAt(eye, lookAt, up)
        this.camera.projection.setPerspective(fovy, aspect, near, far)
        this.camera.vp = this.camera.view.multiply(this.camera.projection)
    }
}

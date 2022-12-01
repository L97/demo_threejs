
import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import html2canvas from 'html2canvas'
import './index.scss'
const createElement = function (params, isTitle) {
  const { xxx } = params
  let element = document.createElement('div')
  element.id = 'xxx'
  element.innerHTML = `<div class = 'curLabel' > 
    <div class = 'devName'><span>${xxx}</span></div>
    </div>`
  return element
}
const calDistance = (x, y, z, val) => {
  const dis = Math.sqrt(x * x + z * z)
  return dis < val ? true : false
}
export default class loader {
  constructor() {
    this.curID = null
    this.renderer = null
    this.labelRenderer = null
    this.scene = null
    this.camera = null
    this.curMesh = {}
    this.canvasDiv = {
      element: null,
      width: 0,
      height: 0
    }
  }
  initContainer(ID) {
    const _el = document.getElementById(ID)
    this.curID = ID
    this.canvasDiv.element = _el
    this.canvasDiv.width = _el.clientWidth
    this.canvasDiv.height = _el.clientHeight
  }
  initRender() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true })
    this.renderer.setSize(this.canvasDiv.width, this.canvasDiv.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.textureEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.logarithmicDepthBuffer = true;
    this.canvasDiv.element.appendChild(this.renderer.domElement)
  }
  initCamera(position) {
    this.camera && (this.camera = null)
    this.camera = new THREE.PerspectiveCamera(
      90,
      this.canvasDiv.width / this.canvasDiv.height,
      1,
      1000000
    )
    const { x, y, z } = position
    this.camera.position.set(x, y, z)
  }
  initScene() {
    this.scene = new THREE.Scene()
  }
  initLight(opts) {
    // const light = new THREE.DirectionalLight(0xffffff, .2)
    // light.position.copy(opts)
    // this.scene.add(new THREE.AmbientLight(0xffffff, .2))
    // this.scene.add(light)
  }
  loadMoudle(url) {
    const format = url.split('.')[1]
    let loader = null

    switch (format) {
      case 'fbx':
        loader = new FBXLoader()
        loader.load(url, mesh => {
          this.clearPreScene()
          this.curMesh = mesh
          this.resetCamera()
          this.scene.add(mesh)
        })
        break;
      case 'obj':
        loader = new OBJLoader()
        loader.load(url, mesh => {
          this.clearPreScene()
          this.curMesh = mesh
          this.resetCamera()
          this.scene.add(mesh)
        })
        break;
      case 'gltf':
        loader = new GLTFLoader()
        loader.load(url, mesh => {
          this.clearPreScene()
          mesh.scene.traverse((child) => {
            if (child.isMesh) {
              child.frustumCulled = false;
              // 模型阴影
              child.castShadow = false;
              child.receiveShadow = false
              //模型自发光
              child.material.emissive = child.material.color;
              child.material.emissiveMap = child.material.map;
              child.material.side = 0;
              child.material.shadowSide = THREE.BackSide;
            }
          })
          this.curMesh = mesh.scene
          this.resetCamera()
          this.scene.add(mesh.scene)
          
        })
        break;
      default:
        break;
    }
  }
  initControls(options) {
    this.controls && (this.controls = null)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    options && Object.keys(options).forEach(key => {
      this.controls[key] = options[key]
    })
  }
  render() {
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.render.bind(this))
  }
  onWindowResize() {
    const el = document.getElementById(this.curID)
    const width = el.offsetWidth
    const height = el.offsetHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }
  onRatcasterEvent(e, filter, callback = null, id) {
    const element = document.getElementById(id).children[0] // resize后canvas有偏移,宽没撑满,先取canvas
    const boundingClientRect = element.getBoundingClientRect()
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    mouse.x = ((e.clientX - boundingClientRect.left) / element.offsetWidth) * 2 - 1
    mouse.y = -((e.clientY - boundingClientRect.top) / element.offsetHeight) * 2 + 1
    raycaster.setFromCamera(mouse, this.camera)  //将平面坐标系转为世界坐标系
    if (
      this.scene &&
      this.scene.children &&
      this.scene.children.length > 0
    ) {
      const intersects = raycaster.intersectObjects(this.scene.children, true)
      if (intersects.length > 0) {
      } else {
        callback()
      }
    }
  }
  // 配置页双击
  onDblClick(e) {
    const emitPoint = (obj) => {
    }
    this.onRatcasterEvent(e, true, emitPoint, 'id')
  }
  clearPreScene() {
    this.curMesh && this.scene.remove(this.curMesh)
    if (this.renderer) {
      this.renderer.dispose()
    }
  }
  resetCamera () {
    const bbox = new THREE.Box3().setFromObject( this.curMesh );
    let x= bbox.max.x-bbox.min.x;
    let y= bbox.max.y-bbox.min.y;
    let z= bbox.max.z-bbox.min.z;

    if (y/x >= this.canvasDiv.height / this.canvasDiv.width) {
      let h = y;
      let Fov= this.camera.fov * Math.PI / 180;
      let m = h / (2 * Math.tan(Fov* 0.8) );
      this.camera.position.y = 2*m + (z/2);
    } else {
      let w = x;
      let h = w*this.canvasDiv.height / this.canvasDiv.width;
      let Fov = this.camera.fov * Math.PI / 180;
      let m = h / (2 * Math.tan(Fov * 0.8));
      this.camera.position.y = 2*m + (z/2);
    }
  }
}

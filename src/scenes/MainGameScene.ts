import { Experience } from '../engine/Experience'
import { Engine } from '../engine/Engine'
import * as THREE from 'three'
import { Resource } from '../engine/Resources'
import { Object3D } from 'three'
import { emitUnitAction, toogleHelpers } from '../signals/signals'
import { Obstacle } from '../controls/Obstacle'
import { UnitControl } from '../controls/UnitControl'
import { ModelControl } from '../controls/ModelControl'
import { SwipeManager } from '../managers/SwipeManager'

export class MainGameScene implements Experience {
  resources: Resource[] = [
    {
      name: 'BrainMan',
      type: 'gltf',
      path: '../../assets/BrainMan.glb',
    },
    {
      name: 'Brain',
      type: 'gltf',
      path: '../../assets/Brain.glb',
    },
    {
      name: 'TrackFloor',
      type: 'gltf',
      path: '../../assets/TrackFloor.glb',
    },
  ]
  private obstacle: Obstacle = new Obstacle()
  private gridHelper: Object3D = new THREE.GridHelper(100, 50)
  private directLightHelper!: Object3D
  private hemisphereLightHelper!: Object3D
  private pointLightHelper!: Object3D
  private axes: Object3D = new THREE.AxesHelper(100)
  private unit!: UnitControl
  private trackFloor!: ModelControl
  private swipeManager: SwipeManager = new SwipeManager()

  constructor(private engine: Engine) {
    toogleHelpers.on('onShowHelpers', () => this.showHelpers())
    toogleHelpers.on('onHideHelpers', () => this.hideHelpers())
    toogleHelpers.on('onSwitchCameraRotation', (switchValue: boolean) =>
      this.onSwitchRotationCamera(switchValue)
    )
    emitUnitAction.on('onUnitRun', () => this.unit.run())
    emitUnitAction.on('onUnitStop', () => this.unit.stop())
    emitUnitAction.on('onUnitHit', () => this.unit.hit())
    emitUnitAction.on('onUnitWin', () => this.unit.win())
    emitUnitAction.on('onUnitFall', () => this.unit.fall())
    emitUnitAction.on('onUnitMoveLeft', () => this.unit.moveLeft())
    emitUnitAction.on('onUnitMoveRight', () => this.unit.moveRight())
  }

  init() {
    this.setCamera()
    this.setBackground()
    this.addTrackFloor()
    this.addUnit()

    this.obstacle.position.set(3, 1.1, 5)
    this.obstacle.receiveShadow = true
    this.obstacle.castShadow = true
    this.engine.scene.add(this.obstacle)

    this.setLight()
    this.hideHelpers()
    if (localStorage.getItem('isHelpersVisible') === 'true') {
      this.showHelpers()
    }
    if (localStorage.getItem('isEnableCameraRotation') === 'true') {
      this.engine.camera.enableOrbitRotation = true
    }
  }

  resize() {}

  private setCamera() {
    this.engine.camera.enableOrbitRotation = false
    this.engine.camera.instance.position.set(0, 10, 30)
  }

  private onSwitchRotationCamera(switchValue: boolean) {
    this.engine.camera.enableOrbitRotation = switchValue
  }

  private setLight() {
    this.engine.scene.add(new THREE.AmbientLight(0xffffff, 0.1))
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(15, 30, -40)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 3072
    directionalLight.shadow.mapSize.height = 3072
    directionalLight.shadow.camera.near = 1.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -80
    directionalLight.shadow.camera.right = 80
    directionalLight.shadow.camera.top = 80
    directionalLight.shadow.camera.bottom = -80
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
    hemisphereLight.position.set(0, 10, 0)
    const pointLight = new THREE.PointLight(0xe6e229, 10, 0)
    pointLight.position.set(0, 6, 19.5)

    this.hemisphereLightHelper = new THREE.HemisphereLightHelper(
      hemisphereLight,
      2
    )
    this.directLightHelper = new THREE.DirectionalLightHelper(directionalLight)
    this.pointLightHelper = new THREE.PointLightHelper(pointLight)

    this.engine.scene.add(directionalLight, hemisphereLight, pointLight)

    this.engine.scene.add(
      this.hemisphereLightHelper,
      this.directLightHelper,
      this.pointLightHelper,
      this.gridHelper
    )
  }

  hideHelpers() {
    this.axes.visible = false
    this.gridHelper.visible = false
    this.directLightHelper.visible = false
    this.hemisphereLightHelper.visible = false
    this.pointLightHelper.visible = false
  }

  showHelpers() {
    this.axes.visible = true
    this.gridHelper.visible = true
    this.directLightHelper.visible = true
    this.hemisphereLightHelper.visible = true
    this.pointLightHelper.visible = true
  }

  update(delta: number) {
    this.unit.update(delta)
    this.updateCamera()
  }

  updateCamera() {}

  private setBackground() {
    this.engine.scene.background = new THREE.Color(0xa0a0a0)
    this.engine.scene.fog = new THREE.Fog(0xa0a0a0, 20, 70)
  }

  private addTrackFloor() {
    const trackFloorModel = this.engine.resources.getItem('TrackFloor')
    this.trackFloor = new ModelControl(trackFloorModel)
    this.trackFloor.addToScene(this.engine.scene)
    this.trackFloor.setPosition(0, 0, 30)
    this.trackFloor.setScale(1, 1, 3)
  }

  private addUnit() {
    const brainManModel = this.engine.resources.getItem('BrainMan')
    this.unit = new UnitControl(brainManModel)
    this.unit.setPosition(0, 0.1, 20)
    this.unit.setRotation(0, Math.PI, 0)
    this.unit.addToScene(this.engine.scene)
    this.unit.step = +this.trackFloor.objectSize.width.toFixed(0) / 3
    this.swipeManager.subscribeOnLeftSwipe(this.unit.moveLeft, this.unit)
    this.swipeManager.subscribeOnRightSwipe(this.unit.moveRight, this.unit)
  }
}

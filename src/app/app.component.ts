import { Component, OnInit } from '@angular/core';
import {
    Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh,
    CannonJSPlugin, PhysicsImpostor, PhysicsJoint, Color3, StandardMaterial, DynamicTexture
} from 'babylonjs';



class MyScene {



}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'harmonograph';
    engine: Engine;
    scene: Scene;
    canvas: any;
    light1: HemisphericLight;
    sphere: Mesh;
    pendulum: Mesh;
    ground: Mesh;
    camera: ArcRotateCamera;
    support: Mesh;
    length;
    constructor() {

    }

    ngOnInit() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new Engine(this.canvas, true);

        this.length = 0.5;


        this.createScene();
        this.scene.registerBeforeRender(() => {
            const t = new Date().getTime();
            //      this.box1.position.x = -20 * Math.sin(t / 1000);
        });

        this.engine.runRenderLoop(() => {
            console.log(this.pendulum.position.z);
            this.scene.render();
        });
    }


    createScene() {


        const scene: Scene = new Scene(this.engine);

        this.camera = new ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        this.camera.wheelPrecision = 50;
        this.camera.attachControl(this.canvas, true);

        this.light1 = new HemisphericLight('light1', new Vector3(1, 1, 0), scene);

        //  pendulum
        this.pendulum = MeshBuilder.CreateCylinder('pendulum', { tessellation: 8, diameter: 0.02, height: this.length }, scene);
        this.sphere = MeshBuilder.CreateSphere('sphere', { diameter: .1 }, scene);
        this.sphere.position.y = -this.length / 2;
        this.sphere.parent = this.pendulum;

        // support
        this.support = MeshBuilder.CreateBox('pivot', { height: 0.02, width: 0.02, depth: 0.05 }, scene);
        this.support.position.y = this.length / 2;
        this.support.position.x = 0;


        // ground
        this.ground = MeshBuilder.CreateGround('ground', { width: 2, height: 2 }, scene);
        this.ground.position.y = -this.length * 0.6;

        this.scene = scene;
        this.go();

    }

    go() {
        const gravityVector = new Vector3(0, -0.81, 0);
        const physicsPlugin = new CannonJSPlugin();

        this.scene.enablePhysics(gravityVector, physicsPlugin);

        // tslint:disable-next-line:max-line-length
        this.pendulum.physicsImpostor = new PhysicsImpostor(this.pendulum, PhysicsImpostor.CylinderImpostor, { mass: 1, restitution: 0.9 }, this.scene);

        // tslint:disable-next-line:max-line-length
        this.ground.physicsImpostor = new PhysicsImpostor(this.ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);

        // tslint:disable-next-line:max-line-length
        this.support.physicsImpostor = new PhysicsImpostor(this.support, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);


        const jointData = {
            mainPivot: new Vector3(0.0, 0, 0.0),
            connectedPivot: new Vector3(0.0, this.length / 2.0, 0.0),
        };


        const joint = new PhysicsJoint(PhysicsJoint.BallAndSocketJoint, jointData);

        this.support.physicsImpostor.addJoint(this.pendulum.physicsImpostor, joint);
        this.pendulum.physicsImpostor.registerBeforePhysicsStep(() => {
            console.log(' Before step ');
        });
    }


    prodX() {
        // Impulse Settings
        const impulseDirection = new Vector3(1, 0, 0);
        const impulseMagnitude = .5;
        const contactLocalRefPoint = new Vector3(0, 0, 0);


        // tslint:disable-next-line:max-line-length
        this.pendulum.physicsImpostor.applyImpulse(impulseDirection.scale(impulseMagnitude), this.pendulum.getAbsolutePosition().add(contactLocalRefPoint));

    }


    prodZ() {
        // Impulse Settings
        const impulseDirection = new Vector3(0, 0, 1);
        const impulseMagnitude = .5;
        const contactLocalRefPoint = new Vector3(0, 0, 0);


        // tslint:disable-next-line:max-line-length
        this.pendulum.physicsImpostor.applyImpulse(impulseDirection.scale(impulseMagnitude), this.pendulum.getAbsolutePosition().add(contactLocalRefPoint));

    }


    // show axis
    showAxis(size2, scene) {
        const makeTextPlane = function (text, color, size) {
            const dynamicTexture = new DynamicTexture('DynamicTexture', 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color, 'transparent', true);
            const plane = Mesh.CreatePlane('TextPlane', size, scene, true);
            plane.material = new StandardMaterial('TextPlaneMaterial', scene);
            plane.material.backFaceCulling = false;
            //  plane.material.specularColor = new Color3(0, 0, 0);
            // plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };

        const axisX = Mesh.CreateLines('axisX', [
            Vector3.Zero(), new Vector3(size2, 0, 0), new Vector3(size2 * 0.95, 0.05 * size2, 0),
            new Vector3(size2, 0, 0), new Vector3(size2 * 0.95, -0.05 * size2, 0)
        ], scene);
        axisX.color = new Color3(1, 0, 0);
        const xChar = makeTextPlane('X', 'red', size2 / 10);
        xChar.position = new Vector3(0.9 * size2, -0.05 * size2, 0);
        const axisY = Mesh.CreateLines('axisY', [
            Vector3.Zero(), new Vector3(0, size2, 0), new Vector3(-0.05 * size2, size2 * 0.95, 0),
            new Vector3(0, size2, 0), new Vector3(0.05 * size2, size2 * 0.95, 0)
        ], scene);
        axisY.color = new Color3(0, 1, 0);
        const yChar = makeTextPlane('Y', 'green', size2 / 10);
        yChar.position = new Vector3(0, 0.9 * size2, -0.05 * size2);
        const axisZ = Mesh.CreateLines('axisZ', [
            Vector3.Zero(), new Vector3(0, 0, size2), new Vector3(0, -0.05 * size2, size2 * 0.95),
            new Vector3(0, 0, size2), new Vector3(0, 0.05 * size2, size2 * 0.95)
        ], scene);
        axisZ.color = new Color3(0, 0, 1);
        const zChar = makeTextPlane('Z', 'blue', size2 / 10);
        zChar.position = new Vector3(0, 0.05 * size2, 0.9 * size2);
    }
}

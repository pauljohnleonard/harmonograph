import { Component, OnInit } from '@angular/core';
import {
    Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh,
    CannonJSPlugin, PhysicsImpostor, PhysicsJoint, Color3, StandardMaterial, DynamicTexture, Texture
} from 'babylonjs';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { pipe } from 'rxjs';
import { Cylinder } from './classes';



const mu0 = 4e-7 * Math.PI;
const Br = 1.0;

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
    weight: Mesh;
    arm: Mesh;
    ground: Mesh;
    magnet: Mesh;
    camera: ArcRotateCamera;
    support: Mesh;
    pendulumLength;
    distToGround;
    armLength: number;
    pendulumrep: Cylinder;
    wieghtrep: Cylinder;
    magnetrep: Cylinder;
    tableSize: number;
    constructor() {

    }

    ngOnInit() {
        this.canvas = document.getElementById('renderCanvas');
        this.engine = new Engine(this.canvas, true);

        this.pendulumLength = 0.5;
        this.distToGround = 0.05;
        this.tableSize = 1;
        this.pendulumrep = new Cylinder(0.02, this.pendulumLength);
        this.magnetrep = new Cylinder(0.1, 0.05);
        this.wieghtrep = new Cylinder(0.1, 0.1);

        this.armLength = 0.5;
        this.createScene();
        this.scene.registerBeforeRender(() => {
            const t = new Date().getTime();
            //      this.box1.position.x = -20 * Math.sin(t / 1000);
        });

        this.engine.runRenderLoop(() => {

            this.applyForces();
            this.scene.render();
        });
    }


    magForce(r1: Vector3, m1: Vector3, r2: Vector3, m2: Vector3) {

        const r: Vector3 = r1.subtract(r2);
        const rMag = r.length();
        const K = 3 * mu0 / (4 * Math.PI);

        const scale1 = Vector3.Dot(m1, r);
        const scale2 = Vector3.Dot(m2, r);
        const scale3 = Vector3.Dot(m1, m2);
        const scale4 = 5 * scale1 * scale2 / (rMag * rMag);

        const vec = m2.scale(scale1).add(m2.scale(scale2)).add(r.scale(scale3 + scale4));
        vec.scaleInPlace(K);
        return vec;
    }

    applyForces() {
        const r1: Vector3 = this.weight.absolutePosition;
        const posSupport: Vector3 = this.support.absolutePosition;
        const m1: Vector3 = r1.subtract(posSupport).normalize();
        m1.scaleInPlace(Br * this.wieghtrep.volume / mu0);


        const r2: Vector3 = this.magnet.absolutePosition;
        const m2 = new Vector3(0, 1, 0);
        m1.scaleInPlace(Br * this.magnetrep.volume / mu0);


        const force = this.magForce(r1, m1, r2, m2);
        force.scaleInPlace(-1.0);
        console.log(force);


        const contactLocalRefPoint = new Vector3(0, 0, 0);
        // tslint:disable-next-line:max-line-length
        this.arm.physicsImpostor.applyForce(force, this.arm.getAbsolutePosition().add(contactLocalRefPoint));

    }

    createScene() {


        const scene: Scene = new Scene(this.engine);

        this.camera = new ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        this.camera.wheelPrecision = 50;
        this.camera.attachControl(this.canvas, true);

        this.light1 = new HemisphericLight('light1', new Vector3(1, 1, 0), scene);

        //  pendulum
        // tslint:disable-next-line:max-line-length
        this.arm = MeshBuilder.CreateCylinder('pendulum', { tessellation: 8, diameter: this.pendulumrep.diameter, height: this.pendulumLength }, scene);
        this.weight = MeshBuilder.CreateCylinder('pendulum', { diameter: this.wieghtrep.diameter, height: this.wieghtrep.height, }, scene);
        this.weight.position.y = -this.pendulumLength / 2;
        this.weight.parent = this.arm;

        const myMaterial = new StandardMaterial('myMaterial', scene);

        // myMaterial.diffuseTexture = new Texture('URL', scene);

        myMaterial.diffuseColor = new Color3(0.5, 0.6, 0.87);
        myMaterial.specularColor = new Color3(0.5, 0.6, 0.87);
        myMaterial.emissiveColor = new Color3(0, 0.3, 0.3);
        myMaterial.ambientColor = new Color3(0.23, 0.98, 0.53);

        this.weight.material = myMaterial;


        // support
        this.support = MeshBuilder.CreateBox('pivot', { height: 0.02, width: this.armLength, depth: 0.05 }, scene);
        this.support.position.y = this.pendulumLength / 2;
        this.support.position.x = this.armLength / 2;


        // ground

        this.ground = MeshBuilder.CreateGround('ground', { width: this.tableSize, height: this.tableSize }, scene);

        const bottomofSwing = - this.pendulumLength / 2  - this.wieghtrep.height / 2 ;

        this.ground.position.y = bottomofSwing - this.distToGround;

        const gMaterial = new StandardMaterial('myMaterial', scene);

        gMaterial.diffuseTexture = new Texture('URL', scene);

        this.ground.material = gMaterial;
        // myMaterial.diffuseColor = new Color3(0.5, 0.6, 0.87);
        // myMaterial.specularColor = new Color3(0.5, 0.6, 0.87);
        // myMaterial.emissiveColor = new Color3(0, 0.3, 0.3);
        // myMaterial.ambientColor = new Color3(0.23, 0.98, 0.53);



        // magnet
        this.magnet = MeshBuilder.CreateCylinder('magnet', { diameter: this.magnetrep.diameter, height: this.magnetrep.height }, scene);
        this.magnet.position.y = bottomofSwing - this.distToGround + this.magnetrep.height / 2;

        const magMat = new StandardMaterial('myMaterial', scene);

        // myMaterial.diffuseTexture = new Texture('URL', scene);

        magMat.diffuseColor = new Color3(0.7, 0.6, 0.3);

        this.magnet.material = magMat;
        this.scene = scene;
        this.go();

    }

    go() {
        const gravityVector = new Vector3(0, -0.81, 0);
        const physicsPlugin = new CannonJSPlugin();

        this.scene.enablePhysics(gravityVector, physicsPlugin);

        // tslint:disable-next-line:max-line-length
        this.arm.physicsImpostor = new PhysicsImpostor(this.arm, PhysicsImpostor.CylinderImpostor, { mass: 1, restitution: 0.9 }, this.scene);

        // tslint:disable-next-line:max-line-length
        this.ground.physicsImpostor = new PhysicsImpostor(this.ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);

        // tslint:disable-next-line:max-line-length
        this.support.physicsImpostor = new PhysicsImpostor(this.support, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this.scene);

        const jointData = {
            mainPivot: new Vector3(-this.armLength / 2, 0, 0.0),
            connectedPivot: new Vector3(0.0, this.pendulumLength / 2.0, 0.0),
        };


        const joint = new PhysicsJoint(PhysicsJoint.BallAndSocketJoint, jointData);

        this.support.physicsImpostor.addJoint(this.arm.physicsImpostor, joint);
        this.arm.physicsImpostor.registerBeforePhysicsStep(() => {
            console.log(' Before step ');
        });
    }




    prodX() {
        // Impulse Settings
        const impulseDirection = new Vector3(1, 0, 0);
        const impulseMagnitude = .1;
        const contactLocalRefPoint = new Vector3(0, 0, 0);


        // tslint:disable-next-line:max-line-length
        this.arm.physicsImpostor.applyImpulse(impulseDirection.scale(impulseMagnitude), this.arm.getAbsolutePosition().add(contactLocalRefPoint));

    }


    prodZ() {
        // Impulse Settings
        const impulseDirection = new Vector3(0, 0, 1);
        const impulseMagnitude = .1;
        const contactLocalRefPoint = new Vector3(0, 0, 0);


        // tslint:disable-next-line:max-line-length
        this.arm.physicsImpostor.applyImpulse(impulseDirection.scale(impulseMagnitude), this.arm.getAbsolutePosition().add(contactLocalRefPoint));

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

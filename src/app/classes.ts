export class Cylinder {

    _volume;

    constructor(public diameter, public height) {
        this._volume = this.height * (this.diameter * this.diameter) * Math.PI / 4;
    }

    get volume() {
        return this._volume;
    }
}

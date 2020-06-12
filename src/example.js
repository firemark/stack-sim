import { makeEl, makePanelEl } from "@/make-el";
import Dancer from "@/dancer";

export default class Example {

    constructor(container, code, components, options) {
        options = options || {};
        this.options = {
            stackSize: options.stackSize || 0x200A,
            stackLabels: options.stackLabels || {},
            parseVal: options.parseVal || this.defaultParseVal,
            availableFlags: options.availableFlags || [],
        }
        this.code = code;
        this.container = container;
        this.components = components;
        this.reset();

        this.dancer = new Dancer(this);

        var upEl = makeEl('div', 'up');
        var panelEl = makePanelEl(this);

        components.forEach((component) => {
            component.init(this);
            upEl.appendChild(component.element);
        });

        container.appendChild(upEl);
        container.appendChild(panelEl);
        container.className = "example";
    }

    defaultParseVal(v) {
        if (v && v[0] === ':') {
            return v.charCodeAt(1);
        }
        return parseInt(v);
    }

    actionStep() {
        if (this.boom) {
            return;
        }

        this.step = this.nextStep;
        if (this.step >= this.code.length)
            return;

        try {
            this.dancer.dance();
        } catch (e) {
            console.error(e);
        }

        this.draw();
        this.updateOldStack();
    }

    actionReset() {
        this.reset();
        this.draw();
    }

    draw() {
        this.components.forEach(component => component.draw(this));
    }

    reset() {
        this.clearStack();
        this.clearCode();
        this.flags = this.setupFlags();
        this.step = -1;
        this.nextStep = 0;
        this.boom = false;
    }

    setupFlags() {
        const flags = {};
        this.options.availableFlags.forEach((flag) => {
            flags[flag] = false;
        });
        return flags;
    }

    clearStack() {
        this.stack = [];
        for(let i=0; i < this.options.stackSize; i++) {
            this.stack.push('???');
        }
        this.updateOldStack();
    }

    clearCode() {
        this.code.forEach(function (line) {
            line.firstExecuted = false;
            line.boom = false;
            line.errorMsg = false;
        });
    }

    updateOldStack() {
        this.oldStack = this.stack.slice();
    }

    throwBoom(msg) {
        const line = this.code[this.step];
        line.boom = true;
        line.errorMsg = msg;
        this.boom = true;
        throw msg;
    }

}

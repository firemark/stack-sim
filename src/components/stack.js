import BaseComponent from "@/components/base";
import RENDER_FUNCTIONS from "@/render-functions.js";
import { makeEl } from "@/make-el";


export default class StackComponent extends BaseComponent {

    constructor(options) {
        super();
        this.element = makeEl('div', 'mem');
        options = options || {};
        var start = options.start !== undefined ? options.start : 0x2000;
        var size = options.size;
        this.options = {
            start: start,
            end: size !== undefined ? start + size - 1 : (options.end || 0x2009),
            pointer: options.pointer,
            pointerCallback: options.pointerCallback || ((i) => i),
            label: options.label || 'STACK',
        };
    }

    _makeIndexToLabel(stackLabels) {
        let indexToLabel = {};
        Object.entries(stackLabels).forEach(([key, val]) => {
            if (typeof val === 'number') {
                indexToLabel[val] = { key: key };
                return;
            }

            const firstIndex = val.index;
            const size = val.size || 1;
            for(let i = 0; i < size; i++) {
                indexToLabel[firstIndex + i] = {
                    key: size == 1 ? key : key + `[${i}]`,
                    hideAddr: val.hideAddr,
                    render: val.render,
                };
            }
        });
        return indexToLabel;
    }

    init(machine) {
        const element = this.element;
        const indexToLabel = this._makeIndexToLabel(machine.options.stackLabels);

        function getLabelName(label, index) {
            var labelIndex = index.toString(16).padStart(4, '0');
            if (!label) return labelIndex;
            if (label.hideAddr) return label.key;
            return label.key + ':' + labelIndex;
        }

        const labelEl = makeEl('div', 'cell-label', this.options.label);
        element.appendChild(labelEl);

        const start = this.options.start;
        const end = this.options.end;
        for(let index = start; index <= end; index++) {
            const stackVal = machine.stack[index];
            const label = indexToLabel[index];
            const cell = makeEl('div', 'cell-val', stackVal);
            cell.dataset.index = index;
            const [render, renderAlt] = this.getRenderFromLabel(label);
            cell.dataset.render = render;
            cell.dataset.renderAlt = renderAlt;

            const labelName = getLabelName(label, index);
            const cellName = makeEl('div', 'cell-name', labelName);

            const item = makeEl('div', 'cell');
            item.appendChild(cellName);
            item.appendChild(cell);

            element.appendChild(item);
        }
    }

    getRenderFromLabel(label) {
        if (!label || !label.render) {
            return ['int', '-'];
        }

        const render = label.render;
        if (typeof render === 'string') {
            return [render, '-'];
        }

        return render;
    }

    getStackPointer(machine) {
        const label = this.options.pointer;
        if (!label) {
            return -1;
        }
        let pointer = machine.options.stackLabels[label];
        if (typeof pointer !== 'number') {
            pointer = pointer.index;
        }

        const value = machine.stack[pointer];
        if (typeof value !== 'number') {
            return -1;
        }

        return this.options.pointerCallback(value);
    }

    draw(machine) {
        const items = this.element.querySelectorAll('.cell-val');
        const stack = machine.stack;
        const oldStack = machine.oldStack;
        const stackPointer = this.getStackPointer(machine);

        items.forEach((item) => {
            const index = item.dataset.index;
            const newValue = stack[index];
            const oldValue = oldStack[index];
            const render = RENDER_FUNCTIONS[item.dataset.render];
            const renderAlt = item.dataset.renderAlt !== '-' ? RENDER_FUNCTIONS[item.dataset.renderAlt] : null;

            item.innerHTML = ''; // reset node
            if (newValue == oldValue) {
                item.innerHTML = render(newValue);
            } else {
                const oldEl = makeEl('span', 'old');
                oldEl.innerHTML = render(oldValue);

                const newEl = makeEl('span', 'new');
                newEl.innerHTML = render(newValue);

                const arrowEl = makeEl('span', 'arrow', '→');

                item.appendChild(oldEl);
                item.appendChild(arrowEl);
                item.appendChild(newEl);
            }
        })
    }


}


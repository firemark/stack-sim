import BaseComponent from "@/components/base";
import RENDER_FUNCTIONS from "@/render-functions.js";
import { makeEl } from "@/make-el";


export default class StackComponent extends BaseComponent {

    constructor(options) {
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
        Object.entries(stackLabels).forEach(({ key, val }) => {
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
            cell.dataset.render = label && label.render ? label.render : 'int'

            const labelName = getLabelName(label, index);
            const cellName = makeEl('div', 'cell-name', labelName);

            const item = makeEl('div', 'cell');
            item.appendChild(cellName);
            item.appendChild(cell);

            element.appendChild(item);
        }
    }

    getStackPointer(machine) {
        const label = this.options.pointer;
        if (!label) {
            return -1;
        }
        const pointer = machine.options.stackLabels[label];
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
        var items = this.element.querySelectorAll('.cell-val');
        var stack = machine.stack;
        var oldStack = machine.oldStack;
        var stackPointer = this.getStackPointer(machine);

        items.forEach(function (item) {
            var index = item.dataset.index;
            var newValue = stack[index];
            var oldValue = oldStack[index];
            var render = RENDER_FUNCTIONS[item.dataset.render];

            item.dataset.currentInStack = index == stackPointer ? 'yes' : 'no';
            item.innerHTML = ''; // reset node
            if (newValue == oldValue) {
                item.innerHTML = render(newValue);
            } else {
                var oldEl = makeEl('span', 'old');
                oldEl.innerHTML = render(oldValue);

                var newEl = makeEl('span', 'new');
                newEl.innerHTML = render(newValue);

                var arrowEl = makeEl('span', 'arrow', '→');

                item.appendChild(oldEl);
                item.appendChild(arrowEl);
                item.appendChild(newEl);
            }
        })
    }

}


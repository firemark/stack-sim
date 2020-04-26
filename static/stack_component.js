function StackComponent(options) {
    this.element = makeEl('div', 'mem');
    options = options || {};
    var start = options.start !== undefined ? options.start : 0x2000;
    var size = options.size;
    this.options = {
        start: start,
        end: size !== undefined ? start + size - 1 : (options.end || 0x2009),
        pointer: options.pointer,
        pointerCallback: options.pointerCallback || function (i) { return i; },
        label: options.label || 'STACK',
    };
}

StackComponent.prototype._makeIndexToLabel = function (stackLabels) {
    var indexToLabel = {}; 
    Object.entries(stackLabels).forEach(function (obj) {
        var key = obj[0];
        var val = obj[1];
        if (typeof val === 'number') {
            indexToLabel[val] = {key: key};
        } else {
            var firstIndex = val.index;
            var size = val.size || 1;
            for(var i =  0; i < size; i++) {
                indexToLabel[firstIndex + i] = {
                    key: size == 1 ? key : key + '[' + i + ']',
                    hideAddr: val.hideAddr,
                    render: val.render,
                };
            }
        }
    });
    return indexToLabel;
}

StackComponent.prototype.init = function (machine) {
    var element = this.element;
    var indexToLabel = this._makeIndexToLabel(machine.options.stackLabels);

    function getLabelName(label, index) {
        var labelIndex = index.toString(16).padStart(4, '0');
        if (!label) return labelIndex; 
        if (label.hideAddr) return label.key; 
        return label.key + ':' + labelIndex;
    }

    var labelEl = makeEl('div', 'cell-label', this.options.label);
    element.appendChild(labelEl);

    var start = this.options.start; 
    var end = this.options.end;
    for(var index = start; index <= end; index++) {
        var stackVal = machine.stack[index];
        var label = indexToLabel[index];
        var cell = makeEl('div', 'cell-val', stackVal);
        cell.dataset.index = index;
        cell.dataset.render = label && label.render ? label.render : 'int'

        var labelName = getLabelName(label, index);
        var cellName = makeEl('div', 'cell-name', labelName);

        var item = makeEl('div', 'cell');
        item.appendChild(cellName);
        item.appendChild(cell);

        element.appendChild(item);
    };
};

StackComponent.prototype.getStackPointer = function (machine) {
    var label = this.options.pointer;
    if (!label) {
        return -1;
    }
    var pointer = machine.options.stackLabels[label];
    if (typeof pointer !== 'number') {
        pointer = pointer.index;
    }

    var value = machine.stack[pointer];
    if (typeof value !== 'number') {
        return -1;
    }

    return this.options.pointerCallback(value);
}

StackComponent.prototype.draw = function (machine) {
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
};

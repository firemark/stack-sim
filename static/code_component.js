function CodeComponent(options) {
    this.element = makeEl('ol', 'code');
    options = options || {};
    this.options = {
        start: options.start !== undefined ? options.start : 0,
        size: options.size,
    };
}

CodeComponent.prototype.init = function (machine) {
    var element = this.element;
    var size = this.options.size || machine.code.length;
    var start = this.options.start;
    element.start = start;

    for(var i = 0; i < size; i++) {
        var index = i + start;
        var line = machine.code[index];
        if (line === undefined) {
            break;
        }
        var itemCode = makeEl('code', 'language-c', line.line);
        var itemErr = makeEl('span', 'error');

        var item = document.createElement('li');
        item.dataset.index = index;
        item.dataset.active = 'no';
        item.appendChild(itemCode);
        item.appendChild(itemErr);

        element.appendChild(item);
    };
}

CodeComponent.prototype.draw = function (machine) {
    var items = this.element.querySelectorAll('li');
    var step = machine.step;
    var code = machine.code;
    items.forEach(function (item) {
        var line = code[item.dataset.index];
        item.dataset.boom = line.boom ? 'yes' : 'no';
        item.dataset.active = step == item.dataset.index ? 'yes' : 'no'
        if (line.errorMsg) {
            item.querySelector('.error').textContent = line.errorMsg;
        }
    })
}
